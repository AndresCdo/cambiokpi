import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { supabase, getCache, setCache } from "../services/supabase";
import KPICard from "../components/KPICard";
import {
  aggregateKPIs,
  getLast7Days,
  formatCurrency,
  type Transaction,
} from "../utils/calculations";

interface DashboardProps {
  session: any;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate: (route: any) => void;
  pendingRequests: number;
}

const PAIR_COLORS: Record<string, string> = {
  USD_USDT: "#7c3aed",
  EUR_USDT: "#2563eb",
  VES_USDT: "#22c55e",
};

const PAIR_LABELS: Record<string, string> = {
  USD_USDT: "USD",
  EUR_USDT: "EUR",
  VES_USDT: "VES",
};

export default function Dashboard({
  session,
  showToast,
  onNavigate,
  pendingRequests,
}: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [operatorName, setOperatorName] = useState("");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Try cache first
      const cached = await getCache<{
        transactions: Transaction[];
        goal: number;
        name: string;
        businessName: string;
      }>("dashboard_data");

      if (cached) {
        setTransactions(cached.transactions);
        setMonthlyGoal(cached.goal);
        setOperatorName(cached.name);
        setBusinessName(cached.businessName);
        setLoading(false);
      }

      // Fetch fresh data
      const operatorId = session.user.id;
      const now = new Date();

      // Fetch operator info
      const { data: operator } = await supabase
        .from("operators")
        .select("full_name, business_name")
        .eq("id", operatorId)
        .single();

      if (operator) {
        setOperatorName(operator.full_name);
        setBusinessName(operator.business_name || "");
      }

      // Fetch current month transactions
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data: txns, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("operator_id", operatorId)
        .gte("created_at", startOfMonth.toISOString())
        .order("created_at", { ascending: false });

      if (txns) {
        setTransactions(txns as Transaction[]);
      }

      // Fetch monthly goal
      const { data: goal } = await supabase
        .from("monthly_goals")
        .select("target_profit_usdt")
        .eq("operator_id", operatorId)
        .eq("year", now.getFullYear())
        .eq("month", now.getMonth() + 1)
        .single();

      if (goal) {
        setMonthlyGoal(Number(goal.target_profit_usdt));
      }

      // Cache for 5 minutes
      await setCache(
        "dashboard_data",
        {
          transactions: txns || cached?.transactions || [],
          goal: goal?.target_profit_usdt || cached?.goal || 0,
          name: operator?.full_name || cached?.name || "",
          businessName: operator?.business_name || cached?.businessName || "",
        },
        300000
      );

      setLoading(false);
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      showToast("Error cargando datos. Usando datos en caché.", "error");
      setLoading(false);
    }
  }

  const kpis = aggregateKPIs(transactions);

  // Today's profit
  const today = new Date().toISOString().split("T")[0];
  const todayProfit = (kpis.byDay[today]?.profit || 0);

  // This week's profit (last 7 days)
  const last7 = getLast7Days();
  const weekProfit = last7.reduce(
    (sum, day) => sum + (kpis.byDay[day]?.profit || 0),
    0
  );

  // Bar chart: last 7 days
  const barData = last7.map((day) => ({
    day: new Date(day + "T12:00:00").toLocaleDateString("es", {
      weekday: "short",
    }),
    profit: kpis.byDay[day]?.profit || 0,
  }));

  // Pie chart: by pair
  const pieData = Object.entries(kpis.byPair).map(([pair, data]) => ({
    name: PAIR_LABELS[pair] || pair,
    value: data.profit,
    pair,
  }));

  const goalProgress =
    monthlyGoal > 0
      ? Math.min((kpis.totalProfit / monthlyGoal) * 100, 100)
      : 0;

  const displayName = businessName || operatorName || "Operador";

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">
            Hola, {displayName.split(" ")[0]}
          </h1>
          <p className="text-xs text-text-secondary">
            {new Date().toLocaleDateString("es", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {pendingRequests > 0 && (
          <button
            onClick={() => onNavigate("requests")}
            className="relative flex items-center gap-1 btn-secondary-ext text-xs"
          >
            <span className="w-2 h-2 bg-loss rounded-full animate-pulse" />
            {pendingRequests} pendiente{pendingRequests !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2">
        <KPICard
          title="Ganancia Hoy"
          value={formatCurrency(todayProfit)}
          icon={<Calendar size={12} />}
          accent="profit"
          loading={loading}
        />
        <KPICard
          title="Ganancia Semanal"
          value={formatCurrency(weekProfit)}
          icon={<TrendingUp size={12} />}
          accent="profit"
          loading={loading}
        />
        <KPICard
          title="Ganancia Mensual"
          value={formatCurrency(kpis.totalProfit)}
          icon={<DollarSign size={12} />}
          accent="profit"
          loading={loading}
        />
        <KPICard
          title="Operaciones"
          value={kpis.count.toString()}
          icon={<BarChart3 size={12} />}
          subtitle="este mes"
          loading={loading}
        />
      </div>

      {/* Monthly Goal Progress */}
      {monthlyGoal > 0 && (
        <div className="card-dark p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Target size={14} className="text-primary" />
              <span className="text-xs text-text-secondary font-medium">
                Meta mensual
              </span>
            </div>
            <span className="text-xs font-mono text-text-primary">
              {formatCurrency(kpis.totalProfit)} /{" "}
              {formatCurrency(monthlyGoal)}
            </span>
          </div>
          <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-text-secondary mt-1">
            {goalProgress >= 100
              ? "Meta alcanzada"
              : `${goalProgress.toFixed(0)}% completado`}
          </p>
        </div>
      )}

      {/* Bar Chart - Last 7 Days */}
      <div className="card-dark p-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Últimos 7 días
        </h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2d2d3d"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a24",
                border: "1px solid #2d2d3d",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value: number) => [
                formatCurrency(value),
                "Ganancia",
              ]}
            />
            <Bar
              dataKey="profit"
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart - By Pair */}
      <div className="card-dark p-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Distribución por par
        </h3>
        {pieData.length > 0 ? (
          <div className="flex items-center">
            <ResponsiveContainer width="55%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.pair}
                      fill={PAIR_COLORS[entry.pair] || "#7c3aed"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a24",
                    border: "1px solid #2d2d3d",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [
                    `${value.toFixed(2)} USDT`,
                    "Ganancia",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {pieData.map((entry) => (
                <div
                  key={entry.pair}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          PAIR_COLORS[entry.pair] || "#7c3aed",
                      }}
                    />
                    <span className="text-xs text-text-secondary">
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-text-primary">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-secondary text-center py-6">
            No hay datos aún
          </p>
        )}
      </div>

      {/* Quick action */}
      <button
        onClick={() => onNavigate("calculator")}
        className="btn-primary-ext w-full text-sm py-2.5 mb-2"
      >
        Nueva operación
      </button>
    </div>
  );
}

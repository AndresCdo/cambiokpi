import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { formatCurrency, type Transaction } from "../utils/calculations";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
} from "lucide-react";

interface HistoryProps {
  session: any;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

const TIME_FILTERS = [
  { label: "Todas", value: "all" },
  { label: "Hoy", value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes", value: "month" },
];

const PAIR_FILTERS = [
  { label: "Todas", value: "all" },
  { label: "USD/USDT", value: "USD_USDT" },
  { label: "EUR/USDT", value: "EUR_USDT" },
  { label: "VES/USDT", value: "VES_USDT" },
];

const STATUS_FILTERS = [
  { label: "Todas", value: "all" },
  { label: "Completadas", value: "completed" },
  { label: "Pendientes", value: "pending" },
  { label: "Canceladas", value: "cancelled" },
];

const PAIR_LABELS: Record<string, string> = {
  USD_USDT: "USD→USDT",
  EUR_USDT: "EUR→USDT",
  VES_USDT: "VES→USDT",
};

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
  completed: { color: "bg-profit/20 text-profit", label: "Completado" },
  pending: { color: "bg-yellow-500/20 text-yellow-400", label: "Pendiente" },
  cancelled: {
    color: "bg-loss/20 text-loss",
    label: "Cancelado",
  },
};

export default function History({ session, showToast }: HistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [pairFilter, setPairFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [timeFilter]);

  async function loadTransactions() {
    setLoading(true);
    try {
      const operatorId = session.user.id;
      let query = supabase
        .from("transactions")
        .select("*")
        .eq("operator_id", operatorId)
        .order("created_at", { ascending: false });

      // Time filter
      const now = new Date();
      if (timeFilter === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query = query.gte("created_at", start.toISOString());
      } else if (timeFilter === "week") {
        const start = new Date();
        start.setDate(start.getDate() - 7);
        query = query.gte("created_at", start.toISOString());
      } else if (timeFilter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte("created_at", start.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (err: any) {
      showToast("Error cargando historial", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    const { error } = await supabase
      .from("transactions")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      showToast("Error al cancelar", "error");
      return;
    }
    showToast("Operación cancelada", "success");
    loadTransactions();
  }

  const filtered = transactions.filter((t) => {
    if (pairFilter !== "all" && t.pair !== pairFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const totalProfit = filtered
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.profit_usdt), 0);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-text-primary">Historial</h1>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex gap-1 overflow-x-auto">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1 text-[11px] rounded-full font-medium transition-colors
                ${
                  timeFilter === f.value
                    ? "bg-primary text-white"
                    : "bg-surface text-text-secondary hover:text-text-primary"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="select-dark text-[11px] py-1 flex-1"
          >
            {PAIR_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-dark text-[11px] py-1 flex-1"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Total */}
      {totalProfit > 0 && (
        <div className="card-dark p-3 flex justify-between items-center">
          <span className="text-xs text-text-secondary">
            Ganancia total ({filtered.length} ops)
          </span>
          <span className="font-mono font-bold text-profit text-lg">
            {formatCurrency(totalProfit)}
          </span>
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-dark p-3 space-y-2">
              <div className="skeleton-dark h-4 w-32" />
              <div className="skeleton-dark h-6 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-secondary text-sm">No hay operaciones</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((t) => {
            const isExpanded = expandedId === t.id;
            const badge = STATUS_BADGES[t.status];

            return (
              <div
                key={t.id}
                className="card-dark overflow-hidden transition-all"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : t.id)
                  }
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-secondary">
                      {new Date(t.created_at).toLocaleDateString("es", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-primary font-medium">
                        {PAIR_LABELS[t.pair] || t.pair}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {Number(t.amount_in).toFixed(2)} {t.currency_in} →{" "}
                        {Number(t.amount_out).toFixed(2)} {t.currency_out}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-mono text-sm font-bold ${
                          Number(t.profit_usdt) > 0
                            ? "text-profit"
                            : "text-text-secondary"
                        }`}
                      >
                        {formatCurrency(Number(t.profit_usdt))}
                      </p>
                      {t.client_name && (
                        <p className="text-[10px] text-text-secondary">
                          {t.client_name}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-text-secondary ml-1 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-surface-border pt-2">
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span className="text-text-secondary">Par:</span>
                      <span className="text-text-primary">
                        {PAIR_LABELS[t.pair]}
                      </span>
                      <span className="text-text-secondary">Dirección:</span>
                      <span className="text-text-primary">{t.direction}</span>
                      <span className="text-text-secondary">Tasa:</span>
                      <span className="text-text-primary font-mono">
                        {Number(t.rate_used).toFixed(6)}
                      </span>
                      <span className="text-text-secondary">Margen:</span>
                      <span className="text-text-primary">
                        {Number(t.margin_percent).toFixed(2)}%
                      </span>
                      <span className="text-text-secondary">Método:</span>
                      <span className="text-text-primary">
                        {t.payment_method || "-"}
                      </span>
                      <span className="text-text-secondary">Origen:</span>
                      <span className="text-text-primary">
                        {t.source === "client_request"
                          ? "Cliente"
                          : "Manual"}
                      </span>
                    </div>
                    {t.notes && (
                      <p className="text-[11px] text-text-secondary">
                        Nota: {t.notes}
                      </p>
                    )}
                    {t.status === "completed" && (
                      <button
                        onClick={() => handleCancel(t.id)}
                        className="text-[11px] text-loss hover:text-loss/80 transition-colors"
                      >
                        Cancelar operación
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

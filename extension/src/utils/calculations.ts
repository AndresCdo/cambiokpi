/**
 * Calculate profit for a P2P operation
 *
 * @param amountIn - Amount of source currency
 * @param rate - Market rate (how many USDT per 1 unit of source currency)
 * @param marginPercent - Operator margin percentage
 * @returns Object with usdtValue, profit, and clientReceives
 */
export function calculateProfit(
  amountIn: number,
  rate: number,
  marginPercent: number
): { usdtValue: number; profit: number; clientReceives: number } {
  const usdtValue = amountIn * rate;
  const profit = usdtValue * (marginPercent / 100);
  const clientReceives = usdtValue - profit;
  return { usdtValue, profit, clientReceives };
}

export interface Transaction {
  id: string;
  pair: string;
  direction: "BUY" | "SELL";
  amount_in: number;
  currency_in: string;
  amount_out: number;
  currency_out: string;
  rate_used: number;
  margin_percent: number;
  profit_usdt: number;
  payment_method: string | null;
  client_name: string | null;
  notes: string | null;
  status: "completed" | "pending" | "cancelled";
  source: "manual" | "client_request";
  created_at: string;
}

export interface KPIs {
  totalProfit: number;
  totalVolume: number;
  count: number;
  byPair: Record<string, { count: number; profit: number }>;
  byDay: Record<
    string,
    { count: number; profit: number; volume: number }
  >;
}

/**
 * Aggregate transactions into KPIs
 */
export function aggregateKPIs(transactions: Transaction[]): KPIs {
  const completed = transactions.filter((t) => t.status === "completed");

  const totalProfit = completed.reduce(
    (sum, t) => sum + Number(t.profit_usdt),
    0
  );
  const totalVolume = completed.reduce(
    (sum, t) => sum + Number(t.amount_in),
    0
  );
  const count = completed.length;

  const byPair: Record<string, { count: number; profit: number }> = {};
  const byDay: Record<
    string,
    { count: number; profit: number; volume: number }
  > = {};

  for (const t of completed) {
    const pair = t.pair;
    if (!byPair[pair]) byPair[pair] = { count: 0, profit: 0 };
    byPair[pair].count++;
    byPair[pair].profit += Number(t.profit_usdt);

    const day = new Date(t.created_at).toISOString().split("T")[0];
    if (!byDay[day]) byDay[day] = { count: 0, profit: 0, volume: 0 };
    byDay[day].count++;
    byDay[day].profit += Number(t.profit_usdt);
    byDay[day].volume += Number(t.amount_in);
  }

  return { totalProfit, totalVolume, count, byPair, byDay };
}

/**
 * Get last 7 days (today + 6 days back) in YYYY-MM-DD format
 */
export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

/**
 * Format a date range label
 */
export function getDateRangeLabel(days: number): string {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return `${from.toLocaleDateString("es", { month: "short", day: "numeric" })} - ${to.toLocaleDateString("es", { month: "short", day: "numeric" })}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = "USDT",
  decimals: number = 2
): string {
  const symbol = currency === "USDT" ? "" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "VES" ? "Bs." : "";
  const formatted = Math.abs(amount).toLocaleString("es-VE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${amount < 0 ? "-" : ""}${symbol} ${formatted}`;
}

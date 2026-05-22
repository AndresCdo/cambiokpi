import { getCache, setCache } from "./supabase";

const COINGECKO_URL = "https://api.coingecko.com/api/v3";
const EXCHANGERATE_URL = "https://v6.exchangerate-api.com/v6";

interface RateResult {
  rate: number;
  source: string;
  timestamp: number;
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Get exchange rate: how many units of targetCurrency per 1 unit of baseCurrency?
 * E.g., getRate('USD', 'USDT') returns how many USDT per 1 USD (should be ~1.0)
 */
export async function getRate(
  pair: string
): Promise<RateResult & { pair: string }> {
  // Check cache first
  const cached = await getCache<RateResult>(`rate_${pair}`);
  if (cached) {
    return { ...cached, pair };
  }

  let rate = 0;
  let source = "";

  try {
    if (pair === "USD_USDT") {
      // CoinGecko: USDT price in USD, then invert for USDT/USD
      const res = await fetchWithTimeout(
        `${COINGECKO_URL}/simple/price?ids=tether&vs_currencies=usd`
      );
      const data = await res.json();
      const usdtPrice = data.tether?.usd || 1.0;
      // rate: how many USDT per 1 USD
      rate = 1 / usdtPrice;
      source = "CoinGecko";
    } else if (pair === "EUR_USDT") {
      // Get EUR/USD rate, then derive USDT rate
      const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY || "";
      const res = await fetchWithTimeout(
        `${EXCHANGERATE_URL}/${apiKey}/latest/USD`
      );
      const data = await res.json();
      const eurPerUsd = data.conversion_rates?.EUR || 0.92;
      // EUR -> USD -> USDT
      const usdPerEur = 1 / eurPerUsd;
      // Get USDT rate
      const cgRes = await fetchWithTimeout(
        `${COINGECKO_URL}/simple/price?ids=tether&vs_currencies=usd`
      );
      const cgData = await cgRes.json();
      const usdtPrice = cgData.tether?.usd || 1.0;
      // EUR_USDT: how many USDT per 1 EUR
      rate = usdPerEur * (1 / usdtPrice);
      source = "CoinGecko + ExchangeRate";
    } else if (pair === "VES_USDT") {
      // Get VES/USD rate, then derive USDT rate
      const apiKey = import.meta.env.VITE_EXCHANGERATE_API_KEY || "";
      const res = await fetchWithTimeout(
        `${EXCHANGERATE_URL}/${apiKey}/latest/USD`
      );
      const data = await res.json();
      const vesRate = data.conversion_rates?.VES;
      if (!vesRate) throw new Error("VES rate not available");
      // VES/USD rate: how many VES per 1 USD
      // VES_USDT: how many USDT per 1 VES
      // First get USDT price in USD
      const cgRes = await fetchWithTimeout(
        `${COINGECKO_URL}/simple/price?ids=tether&vs_currencies=usd`
      );
      const cgData = await cgRes.json();
      const usdtPrice = cgData.tether?.usd || 1.0;
      // 1 USD = vesRate VES
      // 1 USDT = usdtPrice USD
      // How many USDT per 1 VES?
      // vesRate VES = 1 USD = 1/usdtPrice USDT
      // 1 VES = (1/usdtPrice) / vesRate USDT
      rate = (1 / usdtPrice) / vesRate;
      source = "CoinGecko + ExchangeRate";
    }
  } catch (err) {
    console.error(`Failed to fetch rate for ${pair}:`, err);
    // Fall back to cached stale data if available
    const staleCache = await getCache<RateResult>(`rate_${pair}`);
    if (staleCache) {
      return {
        ...staleCache,
        pair,
        source: `${staleCache.source} (cached)`,
      };
    }
    throw new Error(`Could not get rate for ${pair}`);
  }

  const result: RateResult = {
    rate,
    source,
    timestamp: Date.now(),
  };

  // Cache for 60 seconds
  await setCache(`rate_${pair}`, result, 60000);

  return { ...result, pair };
}

/**
 * Get all rates at once for dashboard display
 */
export async function getAllRates(): Promise<Record<string, number>> {
  try {
    const [usdUsdt, eurUsdt, vesUsdt] = await Promise.allSettled([
      getRate("USD_USDT"),
      getRate("EUR_USDT"),
      getRate("VES_USDT"),
    ]);

    const rates: Record<string, number> = {};
    if (usdUsdt.status === "fulfilled") rates["USD_USDT"] = usdUsdt.value.rate;
    if (eurUsdt.status === "fulfilled") rates["EUR_USDT"] = eurUsdt.value.rate;
    if (vesUsdt.status === "fulfilled") rates["VES_USDT"] = vesUsdt.value.rate;

    return rates;
  } catch {
    return {};
  }
}

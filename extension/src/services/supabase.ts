import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: undefined as any, // We handle storage manually
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Manual session storage in chrome.storage.local
const SESSION_KEY = "cambiokpi_session";
const CACHE_KEY = "cambiokpi_cache";

export async function getSession(): Promise<{
  session: any | null;
}> {
  try {
    const result = await chrome.storage.local.get(SESSION_KEY);
    const stored = result[SESSION_KEY];
    if (!stored) return { session: null };

    const parsed = typeof stored === "string" ? JSON.parse(stored) : stored;

    // Check if expired
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
      await clearSession();
      return { session: null };
    }

    return { session: parsed };
  } catch {
    return { session: null };
  }
}

export async function setSession(session: any): Promise<void> {
  try {
    await chrome.storage.local.set({
      [SESSION_KEY]: JSON.stringify(session),
    });
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

export async function clearSession(): Promise<void> {
  try {
    await chrome.storage.local.remove(SESSION_KEY);
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

// Generic cache helpers
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get(`${CACHE_KEY}_${key}`);
    const cached = result[`${CACHE_KEY}_${key}`];
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      await chrome.storage.local.remove(`${CACHE_KEY}_${key}`);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlMs: number = 60000
): Promise<void> {
  try {
    await chrome.storage.local.set({
      [`${CACHE_KEY}_${key}`]: JSON.stringify({
        data,
        expiresAt: Date.now() + ttlMs,
      }),
    });
  } catch (err) {
    console.error("Failed to set cache:", err);
  }
}

export async function getOperatorId(): Promise<string | null> {
  const { session } = await getSession();
  return session?.user?.id || null;
}

// CambioKPI Background Service Worker
// Uses raw fetch to avoid bundling supabase-js (which requires document/localStorage)

const SUPABASE_URL = "https://vriebbqwkpyrnbreqakt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaWViYnF3a3B5cm5icmVxYWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDc1ODYsImV4cCI6MjA5NTAyMzU4Nn0.mXJpByfy6lxG5hPCuTOjQWaGLrfWmO8JdzCA7AtxxU8";

const REST_URL = `${SUPABASE_URL}/rest/v1`;

// Install: set up alarm
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("check_requests", { periodInMinutes: 5 });
  console.log("[CambioKPI] Background worker installed, alarm set every 5 min");
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("check_requests", { periodInMinutes: 5 });
});

// Handle alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "check_requests") {
    await checkPendingRequests();
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_REQUESTS") {
    checkPendingRequests().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function getStoredSession(): Promise<any | null> {
  try {
    const result = await chrome.storage.local.get("cambiokpi_session");
    const stored = result["cambiokpi_session"];
    if (!stored) return null;

    const session = typeof stored === "string" ? JSON.parse(stored) : stored;

    // Check if expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      // Try to refresh
      if (session.refresh_token) {
        const refreshed = await refreshSession(session.refresh_token);
        if (refreshed) return refreshed;
      }
      await chrome.storage.local.remove("cambiokpi_session");
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

async function refreshSession(refreshToken: string): Promise<any | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access_token && data.refresh_token) {
      await chrome.storage.local.set({
        cambiokpi_session: JSON.stringify(data),
      });
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

async function checkPendingRequests() {
  try {
    const session = await getStoredSession();
    if (!session) {
      console.log("[CambioKPI] No valid session stored, skipping check");
      return;
    }

    const operatorId = session.user?.id;
    if (!operatorId) return;

    // Query pending requests count using REST API
    const url = `${REST_URL}/client_requests?operator_id=eq.${operatorId}&status=eq.pending&select=count`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.log("[CambioKPI] Error checking requests:", res.status);
      return;
    }

    const data = await res.json();
    const count = Array.isArray(data) ? data.length : 0;

    // Check last notified count
    const lastNotified = await chrome.storage.local.get("last_notified_count");
    const prevCount = lastNotified["last_notified_count"] || 0;

    if (count > prevCount) {
      const newCount = count - prevCount;
      chrome.notifications.create("new_request", {
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "CambioKPI",
        message: `Nueva solicitud de cliente recibida (${newCount} nueva${newCount > 1 ? "s" : ""})`,
        priority: 2,
      });
    }

    // Store current count
    await chrome.storage.local.set({ last_notified_count: count });
    console.log(`[CambioKPI] Checked requests: ${count} pending`);
  } catch (err: any) {
    console.error("[CambioKPI] Background check error:", err);
  }
}

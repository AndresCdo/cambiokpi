// CambioKPI Background Service Worker
// Standalone - no React, no supabase-js, just raw fetch
const SUPABASE_URL = "https://vriebbqwkpyrnbreqakt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyaWViYnF3a3B5cm5icmVxYWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDc1ODYsImV4cCI6MjA5NTAyMzU4Nn0.mXJpByfy6lxG5hPCuTOjQWaGLrfWmO8JdzCA7AtxxU8";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("check_requests", { periodInMinutes: 5 });
  console.log("[CambioKPI] Background worker installed");
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("check_requests", { periodInMinutes: 5 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "check_requests") {
    await checkPendingRequests();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_REQUESTS") {
    checkPendingRequests().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function getSession() {
  const result = await chrome.storage.local.get("cambiokpi_session");
  const stored = result["cambiokpi_session"];
  if (!stored) return null;
  const session = typeof stored === "string" ? JSON.parse(stored) : stored;
  if (session.expires_at && session.expires_at * 1000 < Date.now()) {
    if (session.refresh_token) {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      if (res.ok) {
        const data = await res.json();
        await chrome.storage.local.set({ cambiokpi_session: JSON.stringify(data) });
        return data;
      }
    }
    await chrome.storage.local.remove("cambiokpi_session");
    return null;
  }
  return session;
}

async function checkPendingRequests() {
  try {
    const session = await getSession();
    if (!session) return;
    const operatorId = session.user?.id;
    if (!operatorId) return;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/client_requests?operator_id=eq.${operatorId}&status=eq.pending&select=count`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` } }
    );
    if (!res.ok) return;

    const data = await res.json();
    const count = Array.isArray(data) ? data.length : 0;

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
    await chrome.storage.local.set({ last_notified_count: count });
  } catch (err) {
    console.error("[CambioKPI] Background error:", err);
  }
}

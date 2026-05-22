import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Install: set up alarm
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("check_requests", { periodInMinutes: 5 });
  console.log("[CambioKPI] Background worker installed, alarm set every 5 min");
});

// Also set alarm on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("check_requests", { periodInMinutes: 5 });
});

// Handle alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "check_requests") {
    await checkPendingRequests();
  }
});

// Optional: also check on messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "CHECK_REQUESTS") {
    checkPendingRequests();
    sendResponse({ ok: true });
  }
  return true;
});

async function checkPendingRequests() {
  try {
    // Get session from storage
    const result = await chrome.storage.local.get("cambiokpi_session");
    const stored = result["cambiokpi_session"];
    if (!stored) {
      console.log("[CambioKPI] No session stored, skipping check");
      return;
    }

    const session = typeof stored === "string" ? JSON.parse(stored) : stored;

    // Check if expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.log("[CambioKPI] Session expired, attempting refresh");

      if (session.refresh_token) {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: session.refresh_token,
        });

        if (error || !data.session) {
          console.log("[CambioKPI] Refresh failed:", error?.message);
          await chrome.storage.local.remove("cambiokpi_session");
          return;
        }

        // Save new session
        await chrome.storage.local.set({
          cambiokpi_session: JSON.stringify(data.session),
        });
        console.log("[CambioKPI] Session refreshed");
      } else {
        await chrome.storage.local.remove("cambiokpi_session");
        return;
      }
    }

    // Set the session
    const currentSession = (await chrome.storage.local.get("cambiokpi_session"))[
      "cambiokpi_session"
    ];
    const parsedSession =
      typeof currentSession === "string"
        ? JSON.parse(currentSession)
        : currentSession;
    supabase.auth.setSession(parsedSession);

    const operatorId = parsedSession?.user?.id;
    if (!operatorId) return;

    // Check for pending requests
    const { data, error } = await supabase
      .from("client_requests")
      .select("count", { count: "exact", head: true })
      .eq("operator_id", operatorId)
      .eq("status", "pending");

    if (error) {
      console.log("[CambioKPI] Error checking requests:", error.message);
      return;
    }

    const count = (data as any)?.length ?? 0;

    // Check last notified count
    const lastNotified = await chrome.storage.local.get("last_notified_count");
    const prevCount = lastNotified["last_notified_count"] || 0;

    if (count > prevCount) {
      chrome.notifications.create("new_request", {
        type: "basic",
        iconUrl: "icons/icon-48.png",
        title: "CambioKPI",
        message: `Nueva solicitud de cliente recibida (${count - prevCount} nueva${count - prevCount > 1 ? "s" : ""})`,
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

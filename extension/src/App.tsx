import { useEffect, useState } from "react";
import { supabase, getSession, setSession, clearSession } from "./services/supabase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/Calculator";
import History from "./pages/History";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";

type Route =
  | "login"
  | "dashboard"
  | "calculator"
  | "history"
  | "requests"
  | "settings";

function getHashRoute(): Route {
  const hash = window.location.hash.replace("#/", "") || "login";
  const validRoutes: Route[] = [
    "login",
    "dashboard",
    "calculator",
    "history",
    "requests",
    "settings",
  ];
  return validRoutes.includes(hash as Route) ? (hash as Route) : "login";
}

export default function App() {
  const [route, setRoute] = useState<Route>(getHashRoute);
  const [session, setSessionState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToastState] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const [pendingRequests, setPendingRequests] = useState(0);

  function showToast(message: string, type: "success" | "error" | "info" = "info") {
    setToastState({ message, type });
    setTimeout(() => setToastState(null), 3500);
  }

  // Listen to hash changes
  useEffect(() => {
    const onHashChange = () => setRoute(getHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    async function init() {
      const { session: existingSession } = await getSession();
      if (existingSession) {
        supabase.auth.setSession(existingSession);
        setSessionState(existingSession);
      }
      setLoading(false);
    }
    init();
  }, []);

  // Auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession) {
        await setSession(newSession);
        setSessionState(newSession);
      } else {
        await clearSession();
        setSessionState(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function navigate(r: Route) {
    window.location.hash = `#/${r}`;
  }

  function handleLogout() {
    supabase.auth.signOut();
    clearSession();
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-text-secondary text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full h-full bg-surface overflow-hidden">
        <Login onLogin={() => navigate("dashboard")} showToast={showToast} />
        {toast && <Toast {...toast} onClose={() => setToastState(null)} />}
      </div>
    );
  }

  const isMainRoute = route !== "login";

  return (
    <div className="w-full h-full bg-surface overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {route === "dashboard" && (
          <Dashboard
            session={session}
            showToast={showToast}
            onNavigate={navigate}
            pendingRequests={pendingRequests}
          />
        )}
        {route === "calculator" && (
          <Calculator
            session={session}
            showToast={showToast}
            onNavigate={navigate}
          />
        )}
        {route === "history" && (
          <History session={session} showToast={showToast} />
        )}
        {route === "requests" && (
          <Requests
            session={session}
            showToast={showToast}
            onNavigate={navigate}
            setPendingRequests={setPendingRequests}
          />
        )}
        {route === "settings" && (
          <Settings
            session={session}
            showToast={showToast}
            onLogout={handleLogout}
          />
        )}
      </div>
      {isMainRoute && (
        <BottomNav current={route} onNavigate={navigate} badge={pendingRequests} />
      )}
      {toast && <Toast {...toast} onClose={() => setToastState(null)} />}
    </div>
  );
}

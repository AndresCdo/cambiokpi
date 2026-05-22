import { useEffect, useState, useCallback } from "react";
import { supabase, getCache, setCache } from "../services/supabase";
import { formatCurrency } from "../utils/calculations";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Phone,
  Wallet,
} from "lucide-react";

interface ClientRequest {
  id: string;
  client_name: string | null;
  client_contact: string | null;
  amount_in: number;
  currency_in: string;
  currency_out: string;
  payment_method: string;
  wallet_address: string | null;
  status: "pending" | "accepted" | "rejected";
  notes: string | null;
  created_at: string;
}

interface RequestsProps {
  session: any;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate: (route: any) => void;
  setPendingRequests: (count: number) => void;
}

export default function Requests({
  session,
  showToast,
  onNavigate,
  setPendingRequests,
}: RequestsProps) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const operatorId = session.user.id;

  // Load requests
  useEffect(() => {
    loadRequests();
  }, [filter]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("client_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_requests",
          filter: `operator_id=eq.${operatorId}`,
        },
        (payload) => {
          const newRequest = payload.new as ClientRequest;
          setRequests((prev) => [newRequest, ...prev]);
          showToast("Nueva solicitud recibida", "info");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "client_requests",
          filter: `operator_id=eq.${operatorId}`,
        },
        (payload) => {
          const updated = payload.new as ClientRequest;
          setRequests((prev) =>
            prev.map((r) => (r.id === updated.id ? updated : r))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [operatorId]);

  // Update pending count for badge
  useEffect(() => {
    const pendingCount = requests.filter((r) => r.status === "pending").length;
    setPendingRequests(pendingCount);
  }, [requests, setPendingRequests]);

  async function loadRequests() {
    setLoading(true);
    try {
      let query = supabase
        .from("client_requests")
        .select("*")
        .eq("operator_id", operatorId)
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("status", "pending");
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data as ClientRequest[]) || []);
    } catch (err: any) {
      showToast("Error cargando solicitudes", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(request: ClientRequest) {
    setProcessing(request.id);
    try {
      // Mark request as accepted
      const { error: updateError } = await supabase
        .from("client_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Navigate to calculator with pre-filled data
      showToast("Solicitud aceptada. Ve a la calculadora.", "success");
      onNavigate("calculator");

      // Set cache with pre-fill data
      await setCache(
        "prefill_calculator",
        {
          amount: request.amount_in,
          currencyIn: request.currency_in,
          paymentMethod: request.payment_method,
          clientName: request.client_name,
        },
        120000
      );

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: "accepted" } : r
        )
      );
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(request: ClientRequest) {
    setProcessing(request.id);
    try {
      const { error } = await supabase
        .from("client_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) throw error;

      showToast("Solicitud rechazada", "success");
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: "rejected" } : r
        )
      );
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setProcessing(null);
    }
  }

  function timeAgo(date: string): string {
    const ms = Date.now() - new Date(date).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Solicitudes</h1>
        {pendingCount > 0 && (
          <span className="bg-loss/20 text-loss text-xs font-bold px-2 py-1 rounded-full">
            {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[
          { label: "Pendientes", value: "pending" },
          { label: "Todas", value: "all" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`flex-1 py-1.5 text-[11px] rounded-lg font-medium transition-colors
              ${
                filter === f.value
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="card-dark p-3 space-y-2">
              <div className="skeleton-dark h-4 w-24" />
              <div className="skeleton-dark h-6 w-full" />
              <div className="skeleton-dark h-4 w-32" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={32} className="text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No hay solicitudes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="card-dark p-3 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      req.status === "pending"
                        ? "bg-yellow-400"
                        : req.status === "accepted"
                          ? "bg-profit"
                          : "bg-loss"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {req.client_name || "Cliente anónimo"}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {timeAgo(req.created_at)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    req.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : req.status === "accepted"
                        ? "bg-profit/20 text-profit"
                        : "bg-loss/20 text-loss"
                  }`}
                >
                  {req.status === "pending"
                    ? "Pendiente"
                    : req.status === "accepted"
                      ? "Aceptado"
                      : "Rechazado"}
                </span>
              </div>

              <div className="bg-surface rounded-lg p-2 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Cambia:</span>
                  <span className="text-text-primary font-mono">
                    {formatCurrency(
                      Number(req.amount_in),
                      req.currency_in,
                      req.currency_in === "VES" ? 2 : 2
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Recibe:</span>
                  <span className="text-text-primary">
                    {req.currency_out}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Método:</span>
                  <span className="text-text-primary">
                    {req.payment_method}
                  </span>
                </div>
              </div>

              {(req.client_contact || req.wallet_address || req.notes) && (
                <div className="space-y-1 text-[11px]">
                  {req.client_contact && (
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Phone size={12} />
                      {req.client_contact}
                    </div>
                  )}
                  {req.wallet_address && (
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Wallet size={12} />
                      <span className="font-mono text-[10px] truncate">
                        {req.wallet_address.slice(0, 12)}...
                      </span>
                    </div>
                  )}
                  {req.notes && (
                    <p className="text-text-secondary">{req.notes}</p>
                  )}
                </div>
              )}

              {req.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={processing === req.id}
                    className="btn-primary-ext flex-1 flex items-center justify-center gap-1 py-1.5 text-xs"
                  >
                    {processing === req.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCircle size={12} />
                    )}
                    Aceptar
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processing === req.id}
                    className="bg-loss/10 text-loss hover:bg-loss/20 flex-1 rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    {processing === req.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <XCircle size={12} />
                    )}
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

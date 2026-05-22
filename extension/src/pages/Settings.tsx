import { useEffect, useState } from "react";
import { supabase, getOperatorId } from "../services/supabase";
import {
  Save,
  Copy,
  LogOut,
  Loader2,
  DollarSign,
  Percent,
  Building2,
} from "lucide-react";

const APP_URL = import.meta.env.VITE_APP_URL || "https://cambiokpi.vercel.app";

interface SettingsProps {
  session: any;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onLogout: () => void;
}

interface MarginConfig {
  pair: string;
  margin_percent: number;
  min_margin_percent: number;
}

const PAIR_LABELS: Record<string, string> = {
  USD_USDT: "USD → USDT",
  EUR_USDT: "EUR → USDT",
  VES_USDT: "VES → USDT",
};

export default function Settings({
  session,
  showToast,
  onLogout,
}: SettingsProps) {
  const [margins, setMargins] = useState<MarginConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(0);
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);

  const operatorId = session.user.id;

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      // Load margins
      const { data: marginsData } = await supabase
        .from("margin_settings")
        .select("*")
        .eq("operator_id", operatorId)
        .order("pair");

      if (marginsData) {
        setMargins(marginsData as MarginConfig[]);
      }

      // Load operator profile
      const { data: operator } = await supabase
        .from("operators")
        .select("business_name")
        .eq("id", operatorId)
        .single();

      if (operator) {
        setBusinessName(operator.business_name || "");
      }

      // Load monthly goal
      const now = new Date();
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
    } catch (err: any) {
      showToast("Error cargando configuración", "error");
    } finally {
      setLoading(false);
    }
  }

  async function saveMargins() {
    setSaving(true);
    try {
      for (const m of margins) {
        const { error } = await supabase.from("margin_settings").upsert(
          {
            operator_id: operatorId,
            pair: m.pair,
            margin_percent: m.margin_percent,
            min_margin_percent: m.min_margin_percent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "operator_id, pair" }
        );
        if (error) throw error;
      }
      showToast("Márgenes guardados", "success");
    } catch (err: any) {
      showToast("Error guardando márgenes", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveGoal() {
    setSaving(true);
    try {
      const now = new Date();
      const { error } = await supabase.from("monthly_goals").upsert(
        {
          operator_id: operatorId,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          target_profit_usdt: monthlyGoal,
        },
        { onConflict: "operator_id, year, month" }
      );
      if (error) throw error;
      showToast("Meta guardada", "success");
    } catch (err: any) {
      showToast("Error guardando meta", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveBusinessName() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("operators")
        .update({ business_name: businessName })
        .eq("id", operatorId);
      if (error) throw error;
      showToast("Nombre de negocio guardado", "success");
    } catch (err: any) {
      showToast("Error guardando nombre", "error");
    } finally {
      setSaving(false);
    }
  }

  async function copyPublicLink() {
    const opId = await getOperatorId();
    const link = `${APP_URL}/r/${opId}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copiado", "success");
    } catch {
      showToast("Link: " + link, "info");
    }
  }

  function updateMargin(pair: string, field: "margin" | "min", value: string) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 50) return;
    setMargins((prev) =>
      prev.map((m) =>
        m.pair === pair
          ? {
              ...m,
              ...(field === "margin"
                ? { margin_percent: num }
                : { min_margin_percent: num }),
            }
          : m
      )
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-lg font-bold text-text-primary">Ajustes</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-dark p-3 space-y-2">
            <div className="skeleton-dark h-4 w-24" />
            <div className="skeleton-dark h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-text-primary">Ajustes</h1>

      {/* Business Name */}
      <div className="card-dark p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={14} className="text-text-secondary" />
          <span className="text-xs font-medium text-text-secondary">
            Nombre del negocio
          </span>
        </div>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="input-dark text-sm"
          placeholder="Tu negocio"
        />
        <button
          onClick={saveBusinessName}
          disabled={saving}
          className="btn-ghost-ext text-xs flex items-center gap-1"
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Guardar
        </button>
      </div>

      {/* Margin Settings */}
      <div className="card-dark p-3 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Percent size={14} className="text-text-secondary" />
          <span className="text-xs font-medium text-text-secondary">
            Márgenes por par
          </span>
        </div>

        {margins.map((m) => (
          <div key={m.pair} className="space-y-1.5">
            <p className="text-[10px] text-text-secondary font-medium">
              {PAIR_LABELS[m.pair] || m.pair}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-text-secondary block">
                  Margen %
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={m.margin_percent}
                    onChange={(e) =>
                      updateMargin(m.pair, "margin", e.target.value)
                    }
                    className="input-dark w-20 font-mono text-sm"
                  />
                  <span className="text-xs text-text-secondary">%</span>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-text-secondary block">
                  Alerta mínima %
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={m.min_margin_percent}
                    onChange={(e) =>
                      updateMargin(m.pair, "min", e.target.value)
                    }
                    className="input-dark w-20 font-mono text-sm"
                  />
                  <span className="text-xs text-text-secondary">%</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={saveMargins}
          disabled={saving}
          className="btn-primary-ext w-full flex items-center justify-center gap-1 text-xs"
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Guardar márgenes
        </button>
      </div>

      {/* Monthly Goal */}
      <div className="card-dark p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={14} className="text-text-secondary" />
          <span className="text-xs font-medium text-text-secondary">
            Meta mensual (USDT)
          </span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            min="0"
            value={monthlyGoal || ""}
            onChange={(e) =>
              setMonthlyGoal(parseFloat(e.target.value) || 0)
            }
            className="input-dark flex-1 font-mono text-sm"
            placeholder="0.00"
          />
          <button
            onClick={saveGoal}
            disabled={saving}
            className="btn-primary-ext flex items-center gap-1 text-xs"
          >
            {saving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Guardar
          </button>
        </div>
      </div>

      {/* Public Link */}
      <div className="card-dark p-3 space-y-2">
        <p className="text-xs font-medium text-text-secondary">
          Link público para clientes
        </p>
        <button
          onClick={copyPublicLink}
          className="btn-secondary-ext w-full flex items-center justify-center gap-1.5 text-xs"
        >
          <Copy size={14} />
          Copiar link de solicitud
        </button>
      </div>

      {/* Session Info */}
      <div className="card-dark p-3 space-y-1">
        <p className="text-[10px] text-text-secondary">
          Sesión: {session.user.email}
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full bg-loss/10 text-loss hover:bg-loss/20 rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>

      <p className="text-[10px] text-text-secondary text-center pb-4">
        CambioKPI v1.0.0
      </p>
    </div>
  );
}

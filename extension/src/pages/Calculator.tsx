import { useEffect, useState, useCallback, useRef } from "react";
import { Calculator as CalcIcon, Copy, Loader2, RefreshCw, Share2, Send } from "lucide-react";
import { supabase, getCache, setCache, getOperatorId } from "../services/supabase";
import { getRate } from "../services/ratesService";
import { calculateProfit, formatCurrency } from "../utils/calculations";

interface CalculatorProps {
  session: any;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onNavigate: (route: any) => void;
}

const PAIRS = [
  { value: "EUR_USDT", label: "EUR → USDT" },
  { value: "USD_USDT", label: "USD → USDT" },
  { value: "VES_USDT", label: "VES → USDT" },
];

const SOURCE_CURRENCIES: Record<string, string> = {
  EUR_USDT: "EUR",
  USD_USDT: "USD",
  VES_USDT: "VES",
};

const PAYMENT_METHODS = [
  "Zelle",
  "Transferencia",
  "Efectivo",
  "PayPal",
  "Otro",
];

const APP_URL = import.meta.env.VITE_APP_URL || "https://cambiokpi.vercel.app";

export default function Calculator({ session, showToast, onNavigate }: CalculatorProps) {
  const [pair, setPair] = useState("USD_USDT");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateSource, setRateSource] = useState("");
  const [marginPercent, setMarginPercent] = useState(1.5);
  const [marginLoading, setMarginLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicLink, setPublicLink] = useState("");

  // Register form state
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Zelle");
  const [notes, setNotes] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const operatorId = session.user.id;

  // Load margin settings
  useEffect(() => {
    loadMargins();
  }, [pair]);

  // Debounced amount -> recalculate
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!amount || !rate) return;

    debounceRef.current = setTimeout(() => {
      fetchRate();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount, pair]);

  async function loadMargins() {
    setMarginLoading(true);
    try {
      const cached = await getCache<number>(`margin_${pair}`);
      if (cached !== null) {
        setMarginPercent(cached);
        setMarginLoading(false);
      }

      const { data } = await supabase
        .from("margin_settings")
        .select("margin_percent")
        .eq("operator_id", operatorId)
        .eq("pair", pair)
        .single();

      if (data) {
        setMarginPercent(Number(data.margin_percent));
        await setCache(`margin_${pair}`, Number(data.margin_percent), 300000);
      }
    } catch (err) {
      console.error("Failed to load margins:", err);
    } finally {
      setMarginLoading(false);
    }
  }

  async function fetchRate() {
    setRateLoading(true);
    try {
      const result = await getRate(pair);
      setRate(result.rate);
      setRateSource(result.source);
    } catch (err: any) {
      showToast("Error al obtener tasa de cambio", "error");
    } finally {
      setRateLoading(false);
    }
  }

  const numAmount = parseFloat(amount) || 0;
  const calc = calculateProfit(numAmount, rate || 0, marginPercent);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !rate) {
      showToast("Completa el monto y espera la tasa", "error");
      return;
    }

    setSaving(true);

    try {
      const sourceCurrency = SOURCE_CURRENCIES[pair];

      const { error } = await supabase.from("transactions").insert({
        operator_id: operatorId,
        pair,
        direction: "SELL",
        amount_in: numAmount,
        currency_in: sourceCurrency,
        amount_out: calc.clientReceives,
        currency_out: "USDT",
        rate_used: rate,
        margin_percent: marginPercent,
        profit_usdt: calc.profit,
        payment_method: paymentMethod,
        client_name: clientName || null,
        notes: notes || null,
        status: "completed",
        source: "manual",
      });

      if (error) throw error;

      showToast("Operación registrada exitosamente", "success");

      // Reset form
      setAmount("");
      setClientName("");
      setNotes("");
      setShowRegisterForm(false);

      // Invalidate dashboard cache
      await setCache("dashboard_data", null, 0);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  async function copyPublicLink() {
    const opId = await getOperatorId();
    const link = `${APP_URL}/r/${opId}`;
    setPublicLink(link);
    try {
      await navigator.clipboard.writeText(link);
      showToast("Link copiado al portapapeles", "success");
    } catch {
      showToast("No se pudo copiar. Link: " + link, "error");
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Hola! Envíame ${numAmount || "___"} ${SOURCE_CURRENCIES[pair]} y recibe USDT al mejor precio.\n\nCompleta tus datos aquí:\n${publicLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareTelegram() {
    const text = encodeURIComponent(
      `Hola! Envíame ${numAmount || "___"} ${SOURCE_CURRENCIES[pair]} y recibe USDT al mejor precio.\n\nCompleta tus datos aquí:\n${publicLink}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(publicLink)}&text=${text}`, "_blank");
  }

  function handleMarginChange(value: string) {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 50) {
      setMarginPercent(num);
      // Save to Supabase
      supabase
        .from("margin_settings")
        .upsert(
          {
            operator_id: operatorId,
            pair,
            margin_percent: num,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "operator_id, pair" }
        )
        .then(() => {
          setCache(`margin_${pair}`, num, 300000);
        });
    } else if (value === "") {
      setMarginPercent(0);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-bold text-text-primary">Calculadora</h1>

      {/* Pair selector */}
      <div className="card-dark p-3 space-y-3">
        <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
          Par de intercambio
        </label>
        <div className="flex gap-1">
          {PAIRS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPair(p.value)}
              className={`flex-1 py-1.5 px-2 text-[11px] rounded-lg font-medium transition-colors
                ${
                  pair === p.value
                    ? "bg-primary text-white"
                    : "bg-surface text-text-secondary hover:text-text-primary"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount input */}
      <div className="card-dark p-3 space-y-2">
        <label className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
          Monto ({SOURCE_CURRENCIES[pair]})
        </label>
        <input
          type="number"
          step="any"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-dark text-lg font-mono"
          placeholder="0.00"
          autoFocus
        />
      </div>

      {/* Rate display */}
      <div className="card-dark p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
            Tasa de mercado
          </span>
          <button
            onClick={fetchRate}
            className="text-primary hover:text-primary-hover transition-colors"
            disabled={rateLoading}
          >
            <RefreshCw
              size={14}
              className={rateLoading ? "animate-spin" : ""}
            />
          </button>
        </div>
        {rateLoading ? (
          <div className="skeleton-dark h-8 w-32" />
        ) : rate ? (
          <>
            <p className="text-xl font-mono font-bold text-text-primary">
              1 {SOURCE_CURRENCIES[pair]} = {rate.toFixed(6)} USDT
            </p>
            <p className="text-[10px] text-text-secondary">
              Fuente: {rateSource}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            {amount ? "Cargando tasa..." : "Ingresa un monto para ver la tasa"}
          </p>
        )}
      </div>

      {/* Margin */}
      <div className="card-dark p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
            Tu margen (%)
          </span>
          {marginLoading && (
            <Loader2 size={12} className="animate-spin text-text-secondary" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            max="50"
            value={marginPercent}
            onChange={(e) => handleMarginChange(e.target.value)}
            className="input-dark w-24 font-mono text-lg"
          />
          <span className="text-text-secondary text-sm">%</span>
        </div>
      </div>

      {/* Results */}
      {numAmount > 0 && rate && (
        <div className="card-dark p-3 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">El cliente recibe</span>
            <span className="font-mono font-bold text-text-primary">
              {calc.clientReceives.toFixed(4)} USDT
            </span>
          </div>
          <div className="flex justify-between items-center bg-profit/10 rounded-lg px-3 py-2">
            <span className="text-xs font-semibold text-profit">
              TU GANANCIA
            </span>
            <span className="font-mono font-bold text-lg text-profit">
              {formatCurrency(calc.profit)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Share with client - always visible, prominent */}
        <div className="card-dark p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-primary" />
            <span className="text-xs font-semibold text-text-primary">
              Enviar link al cliente
            </span>
          </div>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            Tu cliente llena sus datos en el formulario y la solicitud aparece
            automáticamente en tu panel. Tú solo aceptas y listo.
          </p>

          {!showShare ? (
            <button
              onClick={async () => {
                const opId = await getOperatorId();
                setPublicLink(`${APP_URL}/r/${opId}`);
                setShowShare(true);
              }}
              className="btn-primary-ext w-full flex items-center justify-center gap-1.5 text-xs"
            >
              <Send size={14} />
              Compartir link de solicitud
            </button>
          ) : (
            <div className="space-y-2 pt-1">
              {/* Link display */}
              <div className="bg-surface rounded-lg p-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicLink}
                  className="bg-transparent text-[11px] text-text-primary flex-1 truncate outline-none"
                />
                <button
                  onClick={copyPublicLink}
                  className="text-primary hover:text-primary-hover flex-shrink-0"
                  title="Copiar link"
                >
                  <Copy size={14} />
                </button>
              </div>

              {/* Quick share buttons */}
              <div className="flex gap-2">
                <button
                  onClick={shareWhatsApp}
                  className="flex-1 bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 rounded-lg py-2 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                >
                  WhatsApp
                </button>
                <button
                  onClick={shareTelegram}
                  className="flex-1 bg-[#0088cc]/15 text-[#0088cc] hover:bg-[#0088cc]/25 rounded-lg py-2 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                >
                  Telegram
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual register */}
        {numAmount > 0 && rate && (
          <>
            {!showRegisterForm ? (
              <button
                onClick={() => setShowRegisterForm(true)}
                className="btn-secondary-ext w-full flex items-center justify-center gap-1.5"
              >
                <CalcIcon size={14} />
                Registrar operación manual
              </button>
            ) : (
              <form onSubmit={handleRegister} className="card-dark p-3 space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  Registrar operación
                </h3>

                <div>
                  <label className="text-[10px] text-text-secondary block mb-1">
                    Nombre del cliente
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="input-dark text-sm"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary block mb-1">
                    Método de pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="select-dark text-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary block mb-1">
                    Notas
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-dark text-sm resize-none"
                    rows={2}
                    placeholder="Opcional"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary-ext flex-1 flex items-center justify-center gap-1"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Guardando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="btn-secondary-ext"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

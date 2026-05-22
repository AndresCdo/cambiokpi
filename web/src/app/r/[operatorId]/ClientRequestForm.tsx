"use client";

import { useState } from "react";
import { Loader2, CheckCircle, Copy } from "lucide-react";

const CURRENCIES_IN = ["EUR", "USD", "VES", "USDT"];
const CURRENCIES_OUT = ["USDT", "EUR", "USD"];
const PAYMENT_METHODS = [
  "Zelle",
  "Transferencia bancaria",
  "Efectivo",
  "PayPal",
  "Otro",
];

interface ClientRequestFormProps {
  operatorId: string;
}

export default function ClientRequestForm({
  operatorId,
}: ClientRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    client_name: "",
    client_contact: "",
    amount_in: "",
    currency_in: "USD",
    currency_out: "USDT",
    payment_method: "Zelle",
    wallet_address: "",
    notes: "",
  });

  const showWalletField = form.currency_out === "USDT";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount_in: parseFloat(form.amount_in),
          operator_id: operatorId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al enviar la solicitud");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="card p-8 sm:p-10 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Solicitud enviada
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Tu operador la revisará pronto y te contactará. Si tienes urgencia,
          puedes comunicarte directamente.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
          <p>
            <span className="font-semibold">Cambias:</span>{" "}
            {form.amount_in} {form.currency_in}
          </p>
          <p>
            <span className="font-semibold">Recibes:</span>{" "}
            {form.currency_out}
          </p>
          <p>
            <span className="font-semibold">Método:</span>{" "}
            {form.payment_method}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Tu nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.client_name}
            onChange={(e) =>
              setForm({ ...form, client_name: e.target.value })
            }
            className="input-field"
            placeholder="Ej: María González"
          />
        </div>

        {/* Contacto */}
        <div>
          <label
            htmlFor="contact"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Tu contacto — WhatsApp / Telegram / Email
          </label>
          <input
            id="contact"
            type="text"
            required
            value={form.client_contact}
            onChange={(e) =>
              setForm({ ...form, client_contact: e.target.value })
            }
            className="input-field"
            placeholder="Ej: +58 414 555 0102"
          />
        </div>

        {/* Monto */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Monto que deseas cambiar
          </label>
          <input
            id="amount"
            type="number"
            step="any"
            min="0"
            required
            value={form.amount_in}
            onChange={(e) =>
              setForm({ ...form, amount_in: e.target.value })
            }
            className="input-field"
            placeholder="Ej: 500"
          />
        </div>

        {/* Moneda origen */}
        <div>
          <label
            htmlFor="currencyIn"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Moneda de origen
          </label>
          <select
            id="currencyIn"
            value={form.currency_in}
            onChange={(e) =>
              setForm({ ...form, currency_in: e.target.value })
            }
            className="input-field"
          >
            {CURRENCIES_IN.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Moneda destino */}
        <div>
          <label
            htmlFor="currencyOut"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Quiero recibir
          </label>
          <select
            id="currencyOut"
            value={form.currency_out}
            onChange={(e) =>
              setForm({ ...form, currency_out: e.target.value })
            }
            className="input-field"
          >
            {CURRENCIES_OUT.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Método de pago */}
        <div>
          <label
            htmlFor="paymentMethod"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Método de pago
          </label>
          <select
            id="paymentMethod"
            value={form.payment_method}
            onChange={(e) =>
              setForm({ ...form, payment_method: e.target.value })
            }
            className="input-field"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Wallet (condicional) */}
        {showWalletField && (
          <div>
            <label
              htmlFor="wallet"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Tu dirección de wallet {form.currency_out}{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="wallet"
              type="text"
              value={form.wallet_address}
              onChange={(e) =>
                setForm({ ...form, wallet_address: e.target.value })
              }
              className="input-field"
              placeholder="Tu dirección de billetera"
            />
          </div>
        )}

        {/* Notas */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Notas adicionales{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            className="input-field resize-none"
            placeholder="Cualquier información adicional..."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
        >
          {loading && <Loader2 size={20} className="animate-spin" />}
          {loading ? "Enviando solicitud..." : "Enviar solicitud"}
        </button>
      </form>
    </div>
  );
}

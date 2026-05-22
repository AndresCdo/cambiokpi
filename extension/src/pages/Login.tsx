import { useState } from "react";
import { supabase } from "../services/supabase";
import { Loader2, LogIn } from "lucide-react";

const APP_URL = import.meta.env.VITE_APP_URL || "https://cambiokpi.vercel.app";

interface LoginProps {
  onLogin: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function Login({ onLogin, showToast }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Correo o contraseña incorrectos");
      showToast("Error de autenticación", "error");
      setLoading(false);
      return;
    }

    showToast("Sesión iniciada", "success");
    onLogin();
    setLoading(false);
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <span className="text-2xl font-bold text-white">CK</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">CambioKPI</h1>
        <p className="text-sm text-text-secondary mb-8">
          Gestión profesional P2P
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded-lg mb-4 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark"
            placeholder="Correo electrónico"
            autoFocus
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark"
            placeholder="Contraseña"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-ext w-full flex items-center justify-center gap-2 py-2.5"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-surface-border">
          <p className="text-xs text-text-secondary mb-3">
            ¿No tienes cuenta?
          </p>
          <a
            href={`${APP_URL}/auth/register`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary-ext w-full text-center inline-block text-xs"
          >
            Registrarse en la web
          </a>
        </div>
      </div>
    </div>
  );
}

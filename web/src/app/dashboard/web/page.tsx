"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  LogOut,
} from "lucide-react";

export default function WebDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CK</span>
            </div>
            <span className="font-bold text-lg">CambioKPI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-primary rounded-full text-sm font-medium mb-8">
            <Activity size={14} /> Panel Web — Vista previa
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Bienvenido a CambioKPI
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-12">
            El panel web está en desarrollo. Para la mejor experiencia,
            instala la extensión de Chrome.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <div className="card p-6 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="text-primary" size={20} />
              </div>
              <p className="text-sm text-gray-600 font-medium">Dashboard KPIs</p>
              <p className="text-xs text-gray-400">Próximamente</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-gray-600 font-medium">Calculadora</p>
              <p className="text-xs text-gray-400">Próximamente</p>
            </div>
            <div className="card p-6 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <p className="text-sm text-gray-600 font-medium">Historial</p>
              <p className="text-xs text-gray-400">Próximamente</p>
            </div>
          </div>

          <div className="card p-8 max-w-lg mx-auto">
            <h2 className="text-lg font-bold mb-2">
              Descarga la extensión de Chrome
            </h2>
            <p className="text-gray-600 mb-4">
              La extensión te da acceso completo a todas las funcionalidades
              de CambioKPI desde tu navegador.
            </p>
            <a href="https://github.com/AndresCdo/cambiokpi/releases/latest" target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
              Instalar Extensión
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

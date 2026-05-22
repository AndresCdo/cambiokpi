import Link from "next/link";
import { ArrowRight, BarChart3, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CK</span>
            </div>
            <span className="font-bold text-lg">CambioKPI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Iniciar Sesión
            </Link>
            <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2">
              Registrarse <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-primary rounded-full text-sm font-medium mb-8">
            <Zap size={14} /> Profesionaliza tu operación P2P
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            Gestiona tus operaciones{" "}
            <span className="text-primary">P2P como un profesional</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            CambioKPI es la herramienta completa para cambistas: calculadora de
            márgenes, dashboard de KPIs en tiempo real, gestión de clientes y
            más — todo desde tu navegador.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              Comenzar Ahora <ArrowRight size={20} />
            </Link>
            <a
              href="https://github.com/AndresCdo/cambiokpi/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 font-medium underline underline-offset-4"
            >
              Instalar Extensión de Chrome
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Dashboard de KPIs</h3>
              <p className="text-gray-600">
                Visualiza tus ganancias diarias, semanales y mensuales. Gráficos
                interactivos y metas mensuales.
              </p>
            </div>
            <div className="card p-8">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="text-green-600" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Calculadora Inteligente</h3>
              <p className="text-gray-600">
                Calcula márgenes automáticamente con tasas en tiempo real.
                Registra operaciones en un clic.
              </p>
            </div>
            <div className="card p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Portal de Clientes</h3>
              <p className="text-gray-600">
                Tus clientes envían solicitudes desde un link público. Tú las
                recibes en tiempo real.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} CambioKPI. Todos los derechos reservados.
      </footer>
    </div>
  );
}

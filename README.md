# CambioKPI

Herramienta profesional de gestión de operaciones P2P para cambistas de criptomonedas.

## Estructura del Monorepo

```
cambiokpi/
├── extension/          # Chrome Extension (React + Vite + Manifest V3)
├── web/                # Next.js 14 App (Vercel)
├── supabase/           # Migraciones y seed data
│   └── migrations/     # Migraciones SQL
└── README.md
```

## Stack Tecnológico

| Parte | Tecnología |
|-------|-----------|
| Chrome Extension | React 18 + Vite + Tailwind CSS + Manifest V3 |
| Web App | Next.js 14 (App Router) + Tailwind CSS + Vercel |
| Backend | Supabase (Auth, PostgreSQL, Realtime, Edge Functions) |
| Gráficos | Recharts |
| Tasas de cambio | CoinGecko API + ExchangeRate-API |
| Iconos | Lucide React |

---

## Requisitos Previos

- Node.js 18+ y npm
- Cuenta de [Supabase](https://supabase.com) (gratuita)
- API Key de [ExchangeRate-API](https://www.exchangerate-api.com) (gratuita, plan Free)

---

## Paso 1: Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard/projects)
2. Ve a **SQL Editor** y ejecuta el contenido de `supabase/migrations/001_initial.sql`
3. Ve a **Project Settings > API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (solo web)

### Configurar RLS

Todas las políticas RLS están incluidas en la migración. Verifica que estén activas en **Authentication > Policies**.

---

## Paso 2: Configurar Variables de Entorno

### Extensión de Chrome

Copia `extension/.env.example` a `extension/.env`:

```bash
cp extension/.env.example extension/.env
```

Edita `extension/.env`:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_APP_URL=https://cambiokpi.vercel.app
VITE_EXCHANGERATE_API_KEY=tu-api-key-de-exchangerate
```

### Web App (Next.js)

Copia `web/.env.example` a `web/.env.local`:

```bash
cp web/.env.example web/.env.local
```

Edita `web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_EXCHANGERATE_API_KEY=tu-api-key-de-exchangerate
```

---

## Paso 3: Instalar Dependencias

```bash
# Extensión
cd extension
npm install

# Web App
cd ../web
npm install
```

---

## Paso 4: Desarrollo Local

### Web App

```bash
cd web
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Extensión de Chrome

```bash
cd extension
npm run dev
```

Esto genera una carpeta `dist/` con la extensión compilada.

---

## Paso 5: Cargar la Extensión en Chrome

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa **Modo desarrollador** (esquina superior derecha)
3. Haz clic en **Cargar descomprimida**
4. Selecciona la carpeta `extension/dist/`
5. La extensión aparecerá en la barra de herramientas

> Para desarrollo: después de `npm run dev` en la extensión, haz clic en el ícono de recargar en `chrome://extensions/` para ver los cambios.

---

## Paso 6: Registrar un Operador

1. Abre la web app en `http://localhost:3000`
2. Ve a `/auth/register` y crea una cuenta
3. Confirma el email (en desarrollo, puedes desactivar la confirmación en Supabase: **Authentication > Settings > Disable email confirmations**)
4. Abre la extensión de Chrome e inicia sesión con las mismas credenciales

---

## Paso 7: Seed Data (Opcional)

Para tener datos de demo en el dashboard:

1. En Supabase SQL Editor, usa el operador_id de tu usuario recién creado
2. Edita `supabase/seed.sql` reemplazando `:demo_operator_id` con el UUID real
3. Ejecuta el seed.sql en el SQL Editor de Supabase

---

## Despliegue

### Web App en Vercel

```bash
cd web
npx vercel deploy
```

Configura las variables de entorno en el dashboard de Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_EXCHANGERATE_API_KEY`

### Extensión

```bash
cd extension
npm run build
```

La extensión compilada estará en `extension/dist/`. Puedes publicarla en la Chrome Web Store o distribuirla manualmente.

---

## APIs Requeridas

### CoinGecko (Gratis)

- URL: `https://api.coingecko.com/api/v3`
- Usada para obtener el precio de USDT
- No requiere API key (plan público)
- Límite: ~10-30 llamadas/minuto

### ExchangeRate-API (Gratis)

- URL: `https://v6.exchangerate-api.com`
- Regístrate en [exchangerate-api.com](https://www.exchangerate-api.com) para obtener una API key gratuita
- Usada para tasas EUR/USD y VES/USD
- Límite: 1,500 llamadas/mes (plan Free)

### Supabase (Gratis)

- Plan gratuito incluye:
  - 500 MB de base de datos
  - 50,000 usuarios autenticados
  - 2 GB de ancho de banda
  - Realtime (hasta 200 conexiones simultáneas)

---

## Características Principales

### Dashboard (Extensión)
- KPIs en tiempo real (ganancias diarias, semanales, mensuales)
- Gráficos de barras (últimos 7 días)
- Gráfico de distribución por par de moneda
- Barra de progreso de meta mensual
- Badge de solicitudes pendientes

### Calculadora (Extensión)
- Tasas de cambio en tiempo real (cache 60s)
- Cálculo automático de margen de ganancia
- Registro de operaciones con un clic
- Generación de link público para clientes

### Portal de Clientes (Web App)
- Página pública sin autenticación
- Formulario de solicitud de cambio
- Diseño responsive (mobile-first)
- Confirmación visual al enviar

### Solicitudes en Tiempo Real (Extensión)
- Notificaciones push via Chrome
- Realtime subscription con Supabase
- Aceptar/Rechazar solicitudes
- Integración con la calculadora

---

## Licencia

MIT - Ver archivo `LICENSE` para más detalles.

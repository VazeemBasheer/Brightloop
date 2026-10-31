# Brightloop

Subscription-management SaaS frontend: a finance dashboard, a customer billing portal, and an AI insights drawer, wrapped in a dark marketing site and auth flow.

This repository brings together the React finance UI, the Express billing engine, and the Gemini insights service. Dashboard and portal views map live billing API responses; the AI drawer uses live subscription and product data.



## Stack

 Tool | Version | Role 

 React | 19 | UI 
 TypeScript | 5.9 | Types, strict mode 
 Vite | 7 | Dev server, bundler 
 Tailwind CSS | 4 | Design tokens + utilities (`@theme` in `src/index.css`) 
 React Router | 7 | Routing 
 anime.js | 4 | Cursor lag, scroll-linked lifecycle rail 
 motion | 12 | Entrance transitions 
 lucide-react | latest | Icons 

No UI component library — every surface is composed from the design tokens in `src/index.css`.



## Getting started

Requires Node **20.19+** or **22.12+** (Vite 7 requirement).


npm ci        # install from the lockfile
npm run dev:server  # billing API on http://localhost:5000
npm run dev:ai      # Gemini API on http://localhost:3001
npm run dev         # frontend on http://localhost:3000


 Script | Purpose 

 `npm run dev` | Dev server on `0.0.0.0:3000` (reachable from the preview panel) 
 `npm run dev:server` | Express billing API on port 5000
 `npm run dev:ai` | Gemini service on port 3001 (requires `GEMINI_API_KEY`)
 `npm run build` | Typecheck, then production build to `dist/` 
 `npm run preview` | Serve the production build locally 
 `npm run typecheck` | `tsc --noEmit` only 

---

## Routes

 Path | Screen | Notes 
 --- | --- | --- 
 `/` | Landing page | Hero, metrics strip, demographics, product bento, lifecycle rail, AI preview 
 `/login` | Sign in | Demo role switcher (Admin / Staff / Customer), simulated password reset 
 `/signup` | Sign up | Creates a customer profile in the billing database; plan provisioning remains a demo step
 `/app` | Finance dashboard | KPIs, MRR chart, plan mix, AR aging, chase queue 
 `/app/portal` | Customer portal | Active plans, Billing Day invoice generation, invoice history 
 `*` | 404 | Dark not-found page 

Login remains a demo role switcher; customer access resolves the entered email against the billing database, but there is no password authentication or session guard. Anyone can open `/app` directly.



## Features

### Landing page
- Canvas dot-grid hero that ripples from the pointer and pulses from the centre when idle, plus a static grid overlay, grain and radial glow.
- Lagging ring cursor with a precise dot, mounted globally from `src/App.tsx`. It only activates for fine pointers, falls back to a no-lag version under `prefers-reduced-motion`, and touch devices keep the native cursor.
- Scroll-linked lifecycle rail (quote → invoice → dunning → collected) driven by anime.js `onScroll`.
- Sections are deliberately sparse: one headline, two CTAs, three role cards, one product bento.

### Finance dashboard
- **KPIs:** MRR, active subscriptions, overdue invoices, cash collected — each with trend and context.
- **MRR chart:** hand-built SVG covering the last twelve months, with a pointer hover readout.
- **Plan mix:** donut with per-plan MRR share.
- **AR aging:** current / 1–30 / 31–60 / 60+ day buckets.
- **Chase queue:** live invoice search and aging, queued reminders persisted by the billing API, and CSV export.

### Customer portal
- Active plans table with seats, renewal dates, usage and status (active / paused / trial).
- **Generate Invoices (Billing Day)** runs the billing pass for the selected customer and reports invoices created, amount billed, tax calculated and duplicate billing attempts skipped. Payments update the billing database.

### AI insights drawer
- Slide-over (also `⌘K` / `Ctrl+K`) with Gemini insights from live products and subscription usage, email drafts, suggested prompts and a chat thread.
- Calls the AI service for analysis, drafts and chat; errors are shown without substituting mock responses.

### Alerts and feedback
- Toast stack plus inline `Alert` tones (`info`, `success`, `warning`, `error`) used for: duplicate signup email, invoices crossing 60 days, paused add-ons, billing run results, assistant failure, and form validation.
- All status is never conveyed by colour alone — icons and text labels accompany every state.



## Data layer and API contract

`src/lib/api.ts` is the only place the frontend calls the application APIs. Vite proxies `/api` to the billing server and `/ai-api` to the Gemini service.

- Set `GEMINI_API_KEY` in the environment before starting the AI service. `VITE_API_BASE` and `VITE_AI_API_BASE` can override the default proxy paths when running the services separately.

Optional `.env.local`:

VITE_API_BASE=http://localhost:5000
VITE_AI_API_BASE=http://localhost:3001/api/ai


 Method | Endpoint | Response 

 `GET` | `/api/stats`, `/api/subscriptions`, `/api/invoices`, `/api/notices` | Live finance dashboard data
 `GET` | `/api/customers`, `/api/subscriptions?customerId=…`, `/api/invoices?customerId=…` | Customer portal data
 `POST` | `/api/run-billing` | Billing result — `{ customerId, forceAllActive }` in
 `POST` | `/api/invoices/:id/pay` | Records a payment against an invoice
 `POST` | `/api/invoices/:id/notices` | Persists a queued invoice notice
 `POST` | `/ai-api/analyze-spending`, `/ai-api/chat`, `/ai-api/draft-email` | Gemini-backed analysis and drafts

All request/response shapes are exported from `src/lib/data.ts` (`Kpi`, `Invoice`, `AssistantAnalysis`, `BillingRunResult`, …). Change a type there and TypeScript points at every UI that must adapt.

The AI adapter converts Gemini spending findings into the `AssistantAnalysis` shape used by the drawer.



## Design system

Tokens live in `@theme` in `src/index.css`:

 Token | Value | Use 

 `--color-canvas` | `#08080a` | Page background 
 `--color-brand-*` | `#7C6DEB` | Primary accent, cursor, charts 
 `--color-mint-*` | `#1E9E76` | Healthy / paid 
 `--color-ember-*` | `#E05A30` | Overdue / destructive 
 `--color-amber-*` | warm amber | Warnings, aging mid-buckets 

Type: Inter for UI, Instrument Serif italic for display headlines, JetBrains Mono for labels, ids and currency figures. Utilities `.panel`, `.eyebrow`, `.grain` and `.dot-grid` carry the recurring surfaces.



## Project structure

src/
  App.tsx                 routes, scroll restoration, global cursor
  main.tsx                BrowserRouter + ToastProvider
  index.css               tokens, base styles, keyframes, cursor rules
  components/
    CustomCursor.tsx      lagging ring + dot
    GridRipple.tsx        landing hero canvas
    WarpField.tsx         auth background canvas
    AuthShell.tsx         shared split auth layout
    Brand.tsx             logo mark
    landing/              nav, hero, scroll lifecycle
    app/                  AppShell, AssistantDrawer, AssistantContext, RevenueChart
    ui/                   Alert, Field, Steps, Toast
  lib/
    api.ts                Backend adapters and response mapping
    data.ts               UI data types
    format.ts             currency, number, date helpers
  pages/                  Landing, Login, Signup, Dashboard, Portal, NotFound

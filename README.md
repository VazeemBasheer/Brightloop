# Brightloop

Subscription-management SaaS frontend: a finance dashboard, a customer billing portal, and an AI insights drawer, wrapped in a dark marketing site and auth flow.

This repository is **Dev 1's scope — UI and dashboards**. All screens are complete and run against a typed mock data layer; Dev 2's Express API and Dev 3's Gemini service plug in through one adapter without UI changes.



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
npm run dev   # http://localhost:3000


 Script | Purpose 

 `npm run dev` | Dev server on `0.0.0.0:3000` (reachable from the preview panel) 
 `npm run build` | Typecheck, then production build to `dist/` 
 `npm run preview` | Serve the production build locally 
 `npm run typecheck` | `tsc --noEmit` only 

---

## Routes

 Path | Screen | Notes 
 --- | --- | --- 
 `/` | Landing page | Hero, metrics strip, demographics, product bento, lifecycle rail, AI preview 
 `/login` | Sign in | Demo role switcher (Admin / Staff / Customer), simulated password reset 
 `/signup` | Sign up | 4-step wizard: account → workspace → plan → ready 
 `/app` | Finance dashboard | KPIs, MRR chart, plan mix, AR aging, chase queue 
 `/app/portal` | Customer portal | Active plans, Billing Day invoice generation, invoice history 
 `*` | 404 | Dark not-found page 

Login and signup are **simulated** — they validate input and navigate, but there is no session, token or guard yet. Anyone can open `/app` directly.



## Features

### Landing page
- Canvas dot-grid hero that ripples from the pointer and pulses from the centre when idle, plus a static grid overlay, grain and radial glow.
- Lagging ring cursor with a precise dot, mounted globally from `src/App.tsx`. It only activates for fine pointers, falls back to a no-lag version under `prefers-reduced-motion`, and touch devices keep the native cursor.
- Scroll-linked lifecycle rail (quote → invoice → dunning → collected) driven by anime.js `onScroll`.
- Sections are deliberately sparse: one headline, two CTAs, three role cards, one product bento.

### Finance dashboard
- **KPIs:** MRR, active subscriptions, overdue invoices, cash collected — each with trend and context.
- **MRR chart:** hand-built SVG, 6M/12M toggle, pointer hover readout.
- **Plan mix:** donut with per-plan MRR share.
- **AR aging:** 1–30 / 31–60 / 61–90 / 90+ buckets.
- **Chase queue:** search across customer, plan and invoice id; status filters; per-row and bulk reminders with optimistic row state; CSV export of the filtered set.

### Customer portal
- Active plans table with seats, renewal dates, usage and status (active / paused / trial).
- **Generate Invoices (Billing Day)** runs the billing pass and reports invoices created, amount billed, tax collected and duplicates skipped. New invoices are appended to the history, and the period lock is surfaced so a second run cannot double-bill.

### AI insights drawer
- Slide-over (also `⌘K` / `Ctrl+K`) with annual savings, four insight cards, confidence bars, one-click actions, suggested prompts and a chat thread.
- Calls `POST /api/assistant/analyze` and `POST /api/assistant/chat`; shows a retry path if the service is unavailable and falls back to seeded insights.

### Alerts and feedback
- Toast stack plus inline `Alert` tones (`info`, `success`, `warning`, `error`) used for: duplicate signup email, invoices crossing 60 days, paused add-ons, billing run results, assistant failure, and form validation.
- All status is never conveyed by colour alone — icons and text labels accompany every state.



## Data layer and API contract

`src/lib/api.ts` is the only place that talks to the network.

- **No `VITE_API_BASE`** → seeded mock adapter with realistic latency. UI is fully explorable offline.
- **`VITE_API_BASE` set** → same calls hit the live API; any non-2xx or network failure logs a warning and falls back to seed data so the UI never blanks during integration.

Create `.env.local`:

VITE_API_BASE=http://localhost:4000


 Method | Endpoint | Response 

 `GET` | `/api/finance/overview` | `DashboardData` — `kpis`, `revenue`, `aging`, `overdueInvoices`, `planMix`, `asOf` 
 `GET` | `/api/portal/me` | `PortalData` — `plans`, `invoices` 
 `POST` | `/api/billing/run` | `BillingRunResult` — `{ customerId }` in, run summary + invoices out 
 `POST` | `/api/invoices/:id/notices` | `{ invoiceId, queuedAt }` 
 `POST` | `/api/assistant/analyze` | `AssistantAnalysis` — `{ scope }` in, summary + insights out 
 `POST` | `/api/assistant/chat` | `{ reply }` — `{ message }` in 

All request/response shapes are exported from `src/lib/data.ts` (`Kpi`, `Invoice`, `AssistantAnalysis`, `BillingRunResult`, …). Change a type there and TypeScript points at every UI that must adapt.

`AssistantAnalysis` expects `insights[]` with `title`, `vendor`, `detail`, `savingsPerYear`, `tone` (`risk` | `opportunity`), `action` and `confidence` (0–1). Dev 3 can return Gemini output in this shape directly.



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
    api.ts                API adapter + seeded fallback
    data.ts               types + seed content
    format.ts             currency, number, date helpers
  pages/                  Landing, Login, Signup, Dashboard, Portal, NotFound






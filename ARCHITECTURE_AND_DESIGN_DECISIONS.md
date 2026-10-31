# Brightloop Subscription Management System
## Dev 2: Middle Layer & Core Engine Architecture & Design Log

This document provides a comprehensive record of every architectural decision, step, and rationale behind Dev 2 (The Core Engine) of the Brightloop Subscription Management System.

---

## 1. System Ecosystem & Dev 2's Strategic Position

```
       [ Dev 1: Frontend UI ]               [ Dev 3: Gemini AI ]
          │                  │                        │
  GET /api/stats    POST /api/run-billing    GET /api/subscriptions
  GET /api/events   POST /api/time-travel    GET /api/stats/health
          │                  │                        │
          ▼                  ▼                        ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                   Dev 2: Express Middle Layer                 │
  │                                                               │
  │   1. /api/stats  ──> Calculates MRR, Overdue, Outstanding     │
  │   2. /api/run-billing ──> Idempotent engine + tax/discount   │
  │   3. /api/time-travel ──> Fast-forward clock (renews & dues)  │
  │   4. /api/events ──> Live audit event timeline feed           │
  │   5. /api/subscriptions/:id/adjust-seats ──> Daily proration │
  │   6. /api/stats/health ──> License waste & utilization        │
  │                                                               │
  │              In-Memory Store + File Persistence               │
  │             (data/database.json & src/db.js)                  │
  └───────────────────────────────────────────────────────────────┘
```

---

## 2. Chronological Steps Taken & Engineering Rationale

### Step 1: Requirements Discovery & PDF Grounding
* **Action**: Grounded design in `Subscription_Management_System.pdf` before writing any code.
* **Why**: Rushing into implementation without understanding the business domain leads to mismatched schemas. We extracted:
  * The subscription lifecycle: `Draft` $\rightarrow$ `Quotation` $\rightarrow$ `Confirmed` $\rightarrow$ `Active` $\rightarrow$ `Closed`.
  * The invoice lifecycle: `Draft` $\rightarrow$ `Confirmed` $\rightarrow$ `Paid` / `Overdue`.
  * Key pricing nuances: Odoo brand variant adds $560 to the base price.
  * Strict business rules: *"Nothing should be billed twice or skipped."*

---

### Step 2: The In-Memory Database & File Persistence (`src/db.js`)
* **Action**: Created a seeded mock database with automatic local file persistence (`data/database.json`).
* **Why**:
  * Satisfies hackathon constraints (Express.js + standard arrays).
  * **Persistence Across Restarts**: Syncing changes to `data/database.json` ensures any new invoices or customers survive server restarts.
  * Zero external database setup overhead for teammates.
* **Seeding Strategy**:
  * **Overlapping Tool Pairs**: Seeded customers paying for *both* **Slack** and **Teams**, as well as **Asana** and **Jira** (empowers Dev 3's Gemini AI to discover duplicate tools).
  * **Seat Utilization Telemetry**: Added `activeUsers30Days` alongside `quantity` (e.g. 50 seats purchased, only 25 active logins $\rightarrow$ Gemini computes exact dollar waste!).
  * **Pre-Seeded Overdue Accounts**: Gives Dev 1 immediate overdue invoice metrics without having to simulate past days first.

---

### Step 3: The Billing Engine & Idempotency Safeguards (`src/billing.js`)
* **Action**: Implemented `POST /api/run-billing`.
* **Why**: Automates recurring billing and eliminates manual typing.
* **Core Mechanisms**:
  * Loops through `Active` subscriptions.
  * **Anti-Double-Billing Idempotency Guard**: Verifies whether an invoice was already issued for the cycle or today. Prevents duplicates if the user clicks "Run Billing" multiple times.
  * Calculates line subtotals, volume discounts (10% for $\ge 10$ seats), and taxes (10%), advancing the billing cycle upon completion.

---

### Step 4: Real-Time Stats & Financial Engine (`src/stats.js`)
* **Action**: Implemented `GET /api/stats`.
* **Why**: Provides the Finance Lead with instant metrics:
  * **MRR & ARR**: Normalized on a monthly basis (Annual divided by 12, Quarterly by 3).
  * **Outstanding Revenue**: Amount owed on pending invoices.
  * **Overdue Metrics**: Count and dollar amount of past-due invoices.

---

### Step 5: Extra "Judge Wow" Features Added

#### 1. ⏱️ The "Time Machine" Simulator (`src/time-machine.js` & `POST /api/time-travel`)
* **Why**: In live hackathon demos, static data looks fake. Presenters can now hit *"Fast-Forward 30 Days"*:
  1. The simulated clock moves forward by 30 days.
  2. Unpaid invoices past their due dates automatically transition to `'Overdue'`.
  3. Recurring renewals are evaluated and executed.
  4. Dev 1’s dashboard charts and revenue numbers animate in real time before the judges' eyes!

#### 2. 📜 Live Audit Trail Event Bus (`src/events.js` & `GET /api/events`)
* **Why**: Enterprise billing engines (Stripe, Recurly) provide immutable event logs. Every billing cycle, payment receipt, seat change, and clock shift emits an audit event (`billing.cycle`, `invoice.paid`, `seat.adjusted`, `time.fast_forward`), giving Dev 1 a real-time activity stream to show on the dashboard.

#### 3. ⚡ Mid-Cycle Seat Proration Engine (`src/proration.js` & `POST /api/subscriptions/:id/adjust-seats`)
* **Why**: Mid-cycle seat additions are the hardest problem in SaaS billing. When a customer adds seats mid-month, this engine calculates the exact remaining days in the cycle, computes the daily prorated rate, updates future subscription quantities, and issues an immediate prorated invoice (`INV-PRORATED-xxx`).

#### 4. 🎯 SaaS Health & License Waste Analytics (`GET /api/stats/health`)
* **Why**: Connects directly to Dev 3's AI scope. Computes:
  * **Platform Health Score** (0-100 composite index).
  * **Seat Utilization Rate** (e.g. 56.1%).
  * **Wasted Seats Count** (e.g. 130 unused seats).
  * **Estimated Monthly Dollar Waste** (e.g. $2,122.00/month).
  * Top contributing customers by MRR.

---

## 3. Automated Verification & Testing

Our verification test suite (`npm test` $\rightarrow$ `test-billing.js`) runs 8 comprehensive test stages:
1. Initial Database & Stats sanity check
2. Billing Day run and tax/discount calculations
3. Anti-double-billing idempotency guard
4. Dynamic post-billing stats updates
5. SaaS Health & License Waste metrics calculation
6. Mid-cycle seat proration & invoice generation
7. Live audit trail event stream capture
8. Time Machine (+30 days) simulation

**Result**: 100% test pass rate across all stages.


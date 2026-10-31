# Brightloop Subscription Management System - Core Engine (Dev 2)

The middle layer and recurring billing engine for Brightloop Software, built with Express.js, standard arrays, and automatic local JSON persistence.

## Quick Start
```bash
# 1. Start server (runs on port 5000 with CORS enabled)
npm start

# 2. Run automated test suite (verifies billing, anti-double-billing, proration, time machine)
npm test
```

---

## Complete API Reference (Dev 1 & Dev 3)

### Core Billing & Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Interactive API Explorer & Live System Health |
| **GET** | `/api/stats` | Executive & Finance Lead overview (MRR, ARR, Active Subs, Overdue, Outstanding) |
| **POST** | `/api/run-billing` | Executes billing run, calculates taxes & discounts, prevents duplicates |
| **GET** | `/api/subscriptions` | All subscriptions with seat telemetry (`activeUsers30Days` vs `quantity`) |
| **GET** | `/api/subscriptions/:id` | Single subscription detail |
| **POST** | `/api/subscriptions` | Create a new subscription or convert a quotation |
| **GET** | `/api/invoices` | List generated invoices (supports `?customerId=...` & `?status=...`) |
| **GET** | `/api/invoices/:id` | Single invoice detail |
| **POST** | `/api/invoices/:id/pay` | Simulate paying an invoice (updates cash collected & clears debt) |
| **GET** | `/api/customers` | Customer list |
| **POST** | `/api/customers` | Register a new customer |
| **GET** | `/api/products` | Software products & Odoo brand variants catalog |
| **POST** | `/api/reset-data` | Re-seeds database to clean initial state |

---

### Extra "Judge Wow" Features
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/time-travel` | **Fast-forward system clock** by X days (default 30). Marks overdue invoices, executes renewals, and animates dashboard in real time! |
| **GET** | `/api/events` | **Live Audit Trail** / timeline feed of all events (billing runs, payments, proration, clock shifts) |
| **POST** | `/api/subscriptions/:id/adjust-seats` | **Mid-cycle seat proration**: calculates daily seat charges for remaining cycle days and generates immediate prorated invoice |
| **GET** | `/api/stats/health` | **SaaS Health & License Waste Score**: seat utilization rate, wasted seats count, and estimated monthly dollar waste for Dev 3's AI |

---

## Example Payloads

### 1. `POST /api/time-travel`
```json
{
  "days": 30
}
```
**Response**:
```json
{
  "success": true,
  "previousDate": "2026-10-31",
  "currentSimulatedDate": "2026-11-30",
  "daysAdvanced": 30,
  "invoicesMadeOverdue": [...],
  "billingSummary": {
    "invoicesGeneratedCount": 1,
    "totalBilledAmount": 250.00
  }
}
```

### 2. `POST /api/subscriptions/:id/adjust-seats`
```json
{
  "productId": "prod-slack",
  "newQuantity": 20
}
```
**Response**:
```json
{
  "success": true,
  "productName": "Slack Enterprise",
  "oldQuantity": 12,
  "newQuantity": 20,
  "deltaQuantity": 8,
  "remainingDays": 31,
  "dailyRatePerSeat": 0.4839,
  "proratedAmount": 120.00,
  "taxAmount": 12.00,
  "totalDue": 132.00,
  "invoice": {
    "id": "INV-PRORATED-004",
    "totalAmount": 132.00,
    "status": "Confirmed"
  }
}
```

### 3. `GET /api/stats/health`
```json
{
  "asOf": "2026-10-31",
  "platformHealthScore": 59,
  "licenseUtilization": {
    "totalSeatsPurchased": 296,
    "totalActiveUsers": 166,
    "wastedSeatsCount": 130,
    "utilizationPercentage": "56.1%",
    "estimatedMonthlyWasteDollars": 2122.00
  },
  "topCustomersByMRR": [
    { "customerName": "Vertex Logistics", "mrr": 2329.00 },
    { "customerName": "Acme Technologies Ltd", "mrr": 1965.00 }
  ]
}
```


// src/server.js - Brightloop Express Core Engine (Dev 2)
const express = require('express');
const cors = require('cors');
const { db, resetDatabase, saveDatabase } = require('./db');
const { runBilling } = require('./billing');
const { getStats } = require('./stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow requests from Dev 1's React app (any localhost port)
app.use(express.json());

// Request logger for console debugging during demo
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Root route: Interactive status & documentation page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Brightloop Core Engine API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-top: 0; }
        .badge { background: #10b981; color: white; padding: 4px 10px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 20px; }
        .endpoint-card { background: #0f172a; border-left: 4px solid #38bdf8; padding: 14px 18px; margin-bottom: 12px; border-radius: 6px; }
        .endpoint-card a { color: #38bdf8; text-decoration: none; font-weight: 600; font-family: monospace; font-size: 15px; }
        .endpoint-card a:hover { text-decoration: underline; }
        .method { font-weight: bold; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-right: 8px; }
        .get { background: #0284c7; color: white; }
        .post { background: #059669; color: white; }
        .desc { color: #94a3b8; font-size: 14px; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Brightloop Core Engine (Dev 2)</h1>
        <div class="badge">● Server Online on Port ${PORT}</div>
        <p>The backend and billing engine is actively running. Here are the live endpoints for Dev 1 (Frontend) and Dev 3 (AI):</p>
        
        <div class="endpoint-card">
          <span class="method get">GET</span>
          <a href="/api/stats" target="_blank">/api/stats</a>
          <div class="desc">Finance Lead metrics (MRR, Active Subscriptions, Overdue Invoices, Total Revenue).</div>
        </div>

        <div class="endpoint-card">
          <span class="method get">GET</span>
          <a href="/api/subscriptions" target="_blank">/api/subscriptions</a>
          <div class="desc">All active/pending subscriptions with seat metrics for Dev 1 and Dev 3.</div>
        </div>

        <div class="endpoint-card">
          <span class="method get">GET</span>
          <a href="/api/invoices" target="_blank">/api/invoices</a>
          <div class="desc">Generated invoices with totals, taxes, discounts, and payment statuses.</div>
        </div>

        <div class="endpoint-card">
          <span class="method post">POST</span>
          <a href="#">/api/run-billing</a>
          <div class="desc">Triggered by the Customer/Admin Portal to calculate taxes, generate invoices, and advance billing cycles.</div>
        </div>

        <div class="endpoint-card">
          <span class="method get">GET</span>
          <a href="/api/products" target="_blank">/api/products</a>
          <div class="desc">Product catalog including Odoo variants and SaaS tools.</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ==========================================
// 1. BILLING ENGINE ENDPOINT (Task 2)
// ==========================================
/**
 * POST /api/run-billing
 * Loops through active subscriptions, calculates taxes/discounts, creates Invoices,
 * guards against double-billing, and advances billing dates.
 */
app.post('/api/run-billing', (req, res) => {
  try {
    const result = runBilling(req.body || {});
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error running billing:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. STATS & ANALYTICS ENDPOINT (Task 3)
// ==========================================
/**
 * GET /api/stats
 * Provides real-time MRR, Active Subscriptions, Overdue Invoices, and Revenue figures for Dev 1.
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. SUBSCRIPTIONS ENDPOINTS (For Dev 1 & Dev 3)
// ==========================================
/**
 * GET /api/subscriptions
 * Optional filters: ?customerId=cust-101 or ?status=Active
 */
app.get('/api/subscriptions', (req, res) => {
  let results = [...db.subscriptions];
  if (req.query.customerId) {
    results = results.filter(s => s.customerId === req.query.customerId);
  }
  if (req.query.status) {
    results = results.filter(s => s.status.toLowerCase() === req.query.status.toLowerCase());
  }
  return res.status(200).json(results);
});

/**
 * GET /api/subscriptions/:id
 */
app.get('/api/subscriptions/:id', (req, res) => {
  const sub = db.subscriptions.find(s => s.id === req.params.id);
  if (!sub) {
    return res.status(404).json({ error: `Subscription ${req.params.id} not found` });
  }
  return res.status(200).json(sub);
});

// ==========================================
// 4. INVOICES & PAYMENTS ENDPOINTS
// ==========================================
/**
 * GET /api/invoices
 * Optional filters: ?customerId=cust-101 or ?status=Paid
 */
app.get('/api/invoices', (req, res) => {
  let results = [...db.invoices];
  if (req.query.customerId) {
    results = results.filter(i => i.customerId === req.query.customerId);
  }
  if (req.query.status) {
    results = results.filter(i => i.status.toLowerCase() === req.query.status.toLowerCase());
  }
  return res.status(200).json(results);
});

/**
 * GET /api/invoices/:id
 */
app.get('/api/invoices/:id', (req, res) => {
  const inv = db.invoices.find(i => i.id === req.params.id);
  if (!inv) {
    return res.status(404).json({ error: `Invoice ${req.params.id} not found` });
  }
  return res.status(200).json(inv);
});

/**
 * POST /api/invoices/:id/pay
 * Simulates customer paying an invoice, immediately updating cash collected & stats!
 */
app.post('/api/invoices/:id/pay', (req, res) => {
  const inv = db.invoices.find(i => i.id === req.params.id);
  if (!inv) {
    return res.status(404).json({ error: `Invoice ${req.params.id} not found` });
  }

  const paymentAmount = req.body.amount || inv.amountDue;
  inv.amountPaid = Number((inv.amountPaid + paymentAmount).toFixed(2));
  inv.amountDue = Math.max(0, Number((inv.totalAmount - inv.amountPaid).toFixed(2)));

  if (inv.amountDue === 0) {
    inv.status = 'Paid';
  }

  const newPayment = {
    id: `PAY-${(db.payments.length + 1).toString().padStart(4, '0')}`,
    invoiceId: inv.id,
    amount: paymentAmount,
    paymentMethod: req.body.paymentMethod || 'credit_card',
    paymentDate: new Date().toISOString().split('T')[0],
    note: req.body.note || 'Payment processed via Customer Portal'
  };
  db.payments.push(newPayment);
  saveDatabase();

  return res.status(200).json({
    success: true,
    message: `Payment of $${paymentAmount} processed for ${inv.id}`,
    invoice: inv,
    payment: newPayment
  });
});

app.post('/api/invoices/:id/notices', (req, res) => {
  const invoice = db.invoices.find(inv => inv.id === req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: `Invoice ${req.params.id} not found` });
  }
  if (invoice.amountDue <= 0) {
    return res.status(400).json({ error: `Invoice ${invoice.id} has no outstanding balance` });
  }

  const notice = {
    id: `NOTICE-${(db.notices.length + 1).toString().padStart(4, '0')}`,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    queuedAt: new Date().toISOString(),
    status: 'queued'
  };
  db.notices.push(notice);
  saveDatabase();
  return res.status(202).json(notice);
});

app.get('/api/notices', (req, res) => {
  return res.status(200).json(db.notices);
});

// ==========================================
// 5. CUSTOMER & SUBSCRIPTION CREATION (Dev 1 Integration)
// ==========================================
/**
 * POST /api/customers
 * Allows Dev 1 to add new customers via their signup or admin form
 */
app.post('/api/customers', (req, res) => {
  const { name, email, company, role, address } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim() : '';
  if (typeof name !== 'string' || !name.trim()
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A name and valid email are required' });
  }
  if (db.customers.some(customer => customer.email.toLowerCase() === normalizedEmail.toLowerCase())) {
    return res.status(409).json({ error: 'Email is already registered' });
  }

  const newCustomer = {
    id: `cust-${db.customers.length + 101}`,
    name: name.trim(),
    email: normalizedEmail,
    role: role || 'customer',
    company: typeof company === 'string' && company.trim()
      ? company.trim()
      : name.trim(),
    address: address || 'Address pending'
  };

  db.customers.push(newCustomer);
  saveDatabase();

  return res.status(201).json({
    success: true,
    customer: newCustomer
  });
});

/**
 * POST /api/subscriptions
 * Allows Dev 1 to convert quotations or create subscriptions
 */
app.post('/api/subscriptions', (req, res) => {
  if (!req.body.customerId || !req.body.lines || req.body.lines.length === 0) {
    return res.status(400).json({ error: 'customerId and at least one line item are required' });
  }

  const customer = db.customers.find(c => c.id === req.body.customerId);
  const today = new Date().toISOString().split('T')[0];

  const newSub = {
    id: `SUB-${1000 + db.subscriptions.length + 1}`,
    customerId: req.body.customerId,
    customerName: customer ? customer.name : (req.body.customerName || 'Unknown Customer'),
    planId: req.body.planId || 'plan-monthly',
    status: req.body.status || 'Active',
    startDate: req.body.startDate || today,
    expiryDate: req.body.expiryDate || '2027-12-31',
    nextBillingDate: req.body.nextBillingDate || today,
    lastBilledDate: null,
    paymentTerms: req.body.paymentTerms || 'Net 15',
    discountId: req.body.discountId || null,
    taxId: req.body.taxId || 'tax-std-10',
    lines: req.body.lines
  };

  db.subscriptions.push(newSub);
  saveDatabase();

  return res.status(201).json({
    success: true,
    subscription: newSub
  });
});

// ==========================================
// 6. AUXILIARY / CATALOG ENDPOINTS
// ==========================================
app.get('/api/products', (req, res) => res.status(200).json(db.products));
app.get('/api/customers', (req, res) => res.status(200).json(db.customers));
app.get('/api/plans', (req, res) => res.status(200).json(db.plans));

/**
 * POST /api/reset-data
 * Re-seeds the mock data back to the clean initial snapshot for hackathon demos
 */
app.post('/api/reset-data', (req, res) => {
  resetDatabase();
  return res.status(200).json({ success: true, message: 'Database reset to initial seed data' });
});

// Server listener
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Brightloop Core Engine (Dev 2) running on port ${PORT}`);
    console.log(`   - Billing API:  http://localhost:${PORT}/api/run-billing`);
    console.log(`   - Stats API:    http://localhost:${PORT}/api/stats`);
    console.log(`   - Subs API:     http://localhost:${PORT}/api/subscriptions`);
    console.log(`====================================================`);
  });
}

module.exports = app;

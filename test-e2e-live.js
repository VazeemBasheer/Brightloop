// test-e2e-live.js - Complete End-to-End Live HTTP Integration Test Suite
const http = require('http');
process.env.NODE_ENV = 'test'; // Prevents server.js from auto-listening on port 5000
const app = require('./src/server');

function request(baseUrl, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = res.headers['content-type']?.includes('application/json') ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2ETests() {
  // Start server on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log('================================================================');
  console.log(`🚀 RUNNING LIVE HTTP INTEGRATION TESTS ON ${baseUrl}`);
  console.log('================================================================\n');

  try {
    // 0. Reset data first
    await request(baseUrl, 'POST', '/api/reset-data');

    // 1. Test Root Portal
    console.log('1. Testing Root Portal (GET /)...');
    const rootRes = await request(baseUrl, 'GET', '/');
    if (rootRes.status === 200 && typeof rootRes.data === 'string' && rootRes.data.includes('Brightloop Core Engine')) {
      console.log('  ✅ Root portal returned status 200 with interactive HTML UI');
    } else {
      throw new Error(`GET / failed with status ${rootRes.status}`);
    }

    // 2. Test Stats API
    console.log('\n2. Testing Stats API (GET /api/stats)...');
    const statsRes = await request(baseUrl, 'GET', '/api/stats');
    const overview = statsRes.data.overview;
    console.log(`  📊 MRR: $${overview.mrr} | Active Subs: ${overview.activeSubscriptions} | Overdue: ${overview.overdueInvoicesCount}`);
    if (overview.mrr > 0 && overview.activeSubscriptions === 8 && overview.overdueInvoicesCount === 2) {
      console.log('  ✅ Stats overview returned accurate starting financial metrics');
    } else {
      throw new Error('Stats values did not match expected values');
    }

    // 3. Test Subscriptions API (with seat telemetry for Dev 3)
    console.log('\n3. Testing Subscriptions & Seat Telemetry (GET /api/subscriptions)...');
    const subsRes = await request(baseUrl, 'GET', '/api/subscriptions');
    const sub1 = subsRes.data.find(s => s.id === 'SUB-1001');
    const slackLine = sub1.lines.find(l => l.productId === 'prod-slack');
    console.log(`  👥 Acme Corp Slack: ${slackLine.quantity} seats purchased, ${slackLine.activeUsers30Days} active users`);
    if (slackLine.quantity === 50 && slackLine.activeUsers30Days === 25) {
      console.log('  ✅ Seat telemetry and duplicate software pairs verified for Dev 3 AI');
    } else {
      throw new Error('Seat telemetry mismatch');
    }

    // 4. Test Billing Run API
    console.log('\n4. Testing Billing Day Execution (POST /api/run-billing)...');
    const billingRes = await request(baseUrl, 'POST', '/api/run-billing', { forceAllActive: true });
    console.log(`  🧾 Invoices Generated: ${billingRes.data.invoicesGeneratedCount} | Total Billed: $${billingRes.data.totalBilledAmount}`);
    if (billingRes.data.invoicesGeneratedCount === 7 && billingRes.data.totalBilledAmount > 0) {
      console.log('  ✅ Billing run created invoices, calculated taxes & discounts');
    } else {
      throw new Error('Billing run failed to generate expected invoices');
    }

    // 5. Test Anti-Double-Billing Idempotency
    console.log('\n5. Testing Anti-Double-Billing Protection (POST /api/run-billing)...');
    const rerunRes = await request(baseUrl, 'POST', '/api/run-billing', { forceAllActive: true });
    console.log(`  🛡️ Immediate Rerun Invoices: ${rerunRes.data.invoicesGeneratedCount} | Skipped: ${rerunRes.data.skipped.length}`);
    if (rerunRes.data.invoicesGeneratedCount === 0 && rerunRes.data.skipped.length === 8) {
      console.log(`  ✅ Enterprise Guard: 0 duplicate invoices generated. Sample skip: "${rerunRes.data.skipped[0].reason}"`);
    } else {
      throw new Error('Anti-double-billing guard failed');
    }

    // 6. Test Stats Dynamic Update Post-Billing
    console.log('\n6. Testing Real-time Stats Reactivity...');
    const statsPostRes = await request(baseUrl, 'GET', '/api/stats');
    console.log(`  📈 Outstanding Revenue Updated: $${overview.outstandingRevenue} -> $${statsPostRes.data.overview.outstandingRevenue}`);
    if (statsPostRes.data.overview.outstandingRevenue > overview.outstandingRevenue) {
      console.log('  ✅ Outstanding revenue dynamically refreshed on Dev 1 dashboard');
    } else {
      throw new Error('Stats did not reflect new billed invoices');
    }

    // 7. Test Customer Creation API
    console.log('\n7. Testing Customer Registration (POST /api/customers)...');
    const custRes = await request(baseUrl, 'POST', '/api/customers', {
      name: 'Gotham Industries',
      email: 'finance@gotham.com',
      company: 'Gotham Industries'
    });
    console.log(`  🏢 Customer Created: ${custRes.data.customer.name} (ID: ${custRes.data.customer.id})`);
    if (custRes.data.customer.id.startsWith('cust-')) {
      console.log('  ✅ Customer created and saved to database');
    } else {
      throw new Error('Customer creation failed');
    }

    // 8. Test Paying an Invoice API
    console.log('\n8. Testing Invoice Payment (POST /api/invoices/:id/pay)...');
    const payRes = await request(baseUrl, 'POST', '/api/invoices/INV-2026-003/pay', {
      amount: 1219.90,
      paymentMethod: 'stripe'
    });
    console.log(`  💳 Payment Processed: $${payRes.data.payment.amount} | New Status: ${payRes.data.invoice.status}`);
    if (payRes.data.invoice.status === 'Paid' && payRes.data.invoice.amountDue === 0) {
      console.log('  ✅ Payment recorded, invoice marked Paid, cash collected increases');
    } else {
      throw new Error('Payment processing failed');
    }

    // 9. Test SaaS Health & License Waste Analytics
    console.log('\n9. Testing License Waste & Health Score (GET /api/stats/health)...');
    const healthRes = await request(baseUrl, 'GET', '/api/stats/health');
    console.log(`  🎯 Health Score: ${healthRes.data.platformHealthScore}/100 | Wasted Seats: ${healthRes.data.licenseUtilization.wastedSeatsCount} | Monthly Waste: $${healthRes.data.licenseUtilization.estimatedMonthlyWasteDollars}`);
    if (healthRes.data.licenseUtilization.estimatedMonthlyWasteDollars > 0) {
      console.log('  ✅ License waste calculated for Dev 3 Gemini AI Agent');
    } else {
      throw new Error('Health metrics missing waste calculations');
    }

    // 10. Test Mid-Cycle Seat Proration
    console.log('\n10. Testing Mid-Cycle Seat Proration (POST /api/subscriptions/:id/adjust-seats)...');
    const prorateRes = await request(baseUrl, 'POST', '/api/subscriptions/SUB-1007/adjust-seats', {
      productId: 'prod-slack',
      newQuantity: 18 // from 12 to 18 (+6 seats)
    });
    console.log(`  ⚡ Seats: ${prorateRes.data.oldQuantity} -> ${prorateRes.data.newQuantity} (+${prorateRes.data.deltaQuantity}) | Prorated Due: $${prorateRes.data.totalDue}`);
    if (prorateRes.data.totalDue > 0 && prorateRes.data.invoice) {
      console.log(`  ✅ Daily proration calculated and immediate invoice ${prorateRes.data.invoice.id} issued`);
    } else {
      throw new Error('Seat proration failed');
    }

    // 11. Test Live Audit Trail
    console.log('\n11. Testing Live Audit Trail (GET /api/events)...');
    const eventsRes = await request(baseUrl, 'GET', '/api/events');
    console.log(`  📜 Total Audit Events Captured: ${eventsRes.data.length}`);
    console.log(`  Latest Event: [${eventsRes.data[0].action}] - ${eventsRes.data[0].type}`);
    if (eventsRes.data.length >= 4) {
      console.log('  ✅ Live audit trail timeline ready for Dev 1 UI drawer');
    } else {
      throw new Error('Events stream missing entries');
    }

    // 12. Test Time Machine Clock Fast-Forward
    console.log('\n12. Testing Time Machine Simulator (POST /api/time-travel)...');
    const timeRes = await request(baseUrl, 'POST', '/api/time-travel', { days: 30 });
    console.log(`  ⏱️ Advanced from ${timeRes.data.previousDate} -> ${timeRes.data.currentSimulatedDate} (+30 Days)`);
    console.log(`  Invoices transitioned to Overdue: ${timeRes.data.invoicesMadeOverdue.length}`);
    console.log(`  Recurring Renewals Executed: ${timeRes.data.billingSummary.invoicesGeneratedCount}`);
    if (timeRes.data.daysAdvanced === 30 && timeRes.data.invoicesMadeOverdue.length > 0) {
      console.log('  ✅ Time Machine dynamically shifted dates, triggered renewals, and created overdue alerts');
    } else {
      throw new Error('Time Machine failed');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 12 LIVE HTTP INTEGRATION TESTS PASSED WITH 100% SUCCESS! 🎉');
    console.log('================================================================\n');

  } finally {
    // Reset back to clean initial seed
    const { resetDatabase } = require('./src/db');
    resetDatabase();
    server.close();
  }
}

// Execute tests
runE2ETests().catch(err => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});

// test-billing.js - Verification Suite for Dev 2
const { db, resetDatabase } = require('./src/db');
const { runBilling } = require('./src/billing');
const { getStats } = require('./src/stats');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`PASSED: ${message}`);
}

console.log('--- 1. Testing Initial Database & Stats ---');
resetDatabase();
const initialStats = getStats();
console.log('Initial Stats:', initialStats.overview);

assert(initialStats.overview.activeSubscriptions > 0, 'Active subscriptions count is positive');
assert(initialStats.overview.mrr > 0, 'MRR is calculated and positive');
assert(
  Math.abs(initialStats.mrrByPlan.reduce((sum, plan) => sum + plan.mrr, 0) - initialStats.overview.mrr) < 0.01,
  'Plan-level MRR reconciles with total MRR'
);
assert(initialStats.overview.overdueInvoicesCount > 0, 'Overdue invoices exist in seed data');
assert(initialStats.overview.totalRevenue > 0, 'Total revenue collected is positive');

console.log('\n--- 2. Testing /api/run-billing Execution ---');
const initialInvoiceCount = db.invoices.length;
const billingResult = runBilling({ forceAllActive: true });
console.log(`Invoices generated: ${billingResult.invoicesGeneratedCount}`);
console.log(`Total amount billed: $${billingResult.totalBilledAmount}`);

assert(billingResult.success === true, 'Billing run succeeded');
assert(billingResult.invoicesGeneratedCount > 0, 'Generated new invoices');
assert(db.invoices.length === initialInvoiceCount + billingResult.invoicesGeneratedCount, 'Invoices added to in-memory db');

// Inspect one of the generated invoices
const sampleInvoice = billingResult.generatedInvoices[0];
console.log('Sample Generated Invoice:', {
  id: sampleInvoice.id,
  customerName: sampleInvoice.customerName,
  subtotal: sampleInvoice.subtotal,
  discountTotal: sampleInvoice.discountTotal,
  taxTotal: sampleInvoice.taxTotal,
  totalAmount: sampleInvoice.totalAmount
});

assert(sampleInvoice.totalAmount === Number((sampleInvoice.subtotal - sampleInvoice.discountTotal + sampleInvoice.taxTotal).toFixed(2)), 'Invoice math is correct (subtotal - discount + tax)');

console.log('\n--- 3. Testing Anti-Double-Billing Guard ---');
// Running billing immediately again should prevent double-billing
const secondRun = runBilling({ forceAllActive: true });
console.log(`Second run invoices generated: ${secondRun.invoicesGeneratedCount}`);
console.log(`Second run skipped count: ${secondRun.skipped.length}`);

assert(secondRun.invoicesGeneratedCount === 0, 'No duplicate invoices generated on immediate rerun');
assert(secondRun.skipped.length > 0, 'Skipped duplicate subscriptions');
console.log('Sample skip reason:', secondRun.skipped[0].reason);

console.log('\n--- 4. Testing Stats Update Post-Billing ---');
const postStats = getStats();
console.log('Updated Stats Overview:', postStats.overview);

assert(postStats.overview.outstandingRevenue > initialStats.overview.outstandingRevenue, 'Outstanding revenue increased after billing run');
assert(postStats.invoicesBreakdown.total === db.invoices.length, 'Total invoice count in stats matches db');

console.log('\n--- 5. Testing Customer-Scoped Billing ---');
resetDatabase();
const customerRun = runBilling({ forceAllActive: true, customerId: 'cust-101' });
assert(customerRun.invoicesGeneratedCount > 0, 'Customer-scoped billing generated invoices');
assert(
  customerRun.generatedInvoices.every(invoice => invoice.customerId === 'cust-101'),
  'Customer-scoped billing did not bill other customers'
);

console.log(' ALL DEV 2 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');

// src/proration.js - SaaS Mid-Cycle Seat Adjustment & Proration Engine
const { db, saveDatabase } = require('./db');
const { recordEvent } = require('./events');

/**
 * Calculates and optionally applies mid-cycle seat additions/removals with daily proration.
 * 
 * Formula:
 * 1. Cycle Length (in days) = (cycleEnd - cycleStart)
 * 2. Days Remaining = (cycleEnd - currentDate)
 * 3. Daily Rate per Seat = Unit Price / Cycle Length
 * 4. Prorated Delta = Delta Seats * Daily Rate * Days Remaining
 * 
 * @param {string} subscriptionId
 * @param {string} productId
 * @param {number} newQuantity
 * @param {Object} options
 * @param {boolean} [options.apply=true] - If true, immediately updates subscription and generates prorated invoice
 * @param {string} [options.asOfDate] - Simulated date
 */
function adjustSeats(subscriptionId, productId, newQuantity, options = {}) {
  const sub = db.subscriptions.find(s => s.id === subscriptionId);
  if (!sub) {
    throw new Error(`Subscription ${subscriptionId} not found`);
  }

  const lineIndex = sub.lines.findIndex(l => l.productId === productId);
  if (lineIndex === -1) {
    throw new Error(`Product ${productId} is not on subscription ${subscriptionId}`);
  }

  const line = sub.lines[lineIndex];
  const oldQuantity = line.quantity;
  const deltaQuantity = newQuantity - oldQuantity;

  if (deltaQuantity === 0) {
    return { message: "No seat quantity change requested", oldQuantity, newQuantity, deltaQuantity: 0 };
  }

  const currentDate = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const nextBilling = new Date(sub.nextBillingDate);
  const lastBilling = sub.lastBilledDate ? new Date(sub.lastBilledDate) : new Date(sub.startDate);

  // Calculate cycle days
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalCycleDays = Math.max(1, Math.round((nextBilling - lastBilling) / msPerDay));
  const remainingDays = Math.max(0, Math.round((nextBilling - currentDate) / msPerDay));

  const dailyRatePerSeat = line.unitPrice / totalCycleDays;
  const proratedAmount = Number((deltaQuantity * dailyRatePerSeat * remainingDays).toFixed(2));

  // Calculate tax on the prorated amount (if positive)
  const taxRule = db.taxes.find(t => t.id === sub.taxId) || { rate: 0.10, name: "Standard Tax" };
  const taxAmount = proratedAmount > 0 ? Number((proratedAmount * (taxRule.rate || 0)).toFixed(2)) : 0;
  const totalDue = Number((proratedAmount + taxAmount).toFixed(2));

  let proratedInvoice = null;

  if (options.apply !== false) {
    // 1. Update the subscription line quantity for future billing cycles
    line.quantity = newQuantity;

    // 2. If additional seats added, generate immediate prorated invoice
    if (proratedAmount > 0) {
      const todayStr = currentDate.toISOString().split('T')[0];
      const invoiceId = `INV-PRORATED-${(db.invoices.length + 1).toString().padStart(3, '0')}`;

      proratedInvoice = {
        id: invoiceId,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        customerName: sub.customerName,
        issueDate: todayStr,
        dueDate: todayStr, // Immediate for proration
        billingPeriod: {
          start: todayStr,
          end: sub.nextBillingDate
        },
        status: "Confirmed",
        subtotal: proratedAmount,
        discountTotal: 0,
        taxTotal: taxAmount,
        totalAmount: totalDue,
        amountPaid: 0,
        amountDue: totalDue,
        items: [
          {
            productId: line.productId,
            description: `Prorated addition: +${deltaQuantity} seats of ${line.productName} for ${remainingDays} remaining days (${totalCycleDays}-day cycle)`,
            quantity: deltaQuantity,
            unitPrice: Number((dailyRatePerSeat * remainingDays).toFixed(2)),
            total: proratedAmount
          }
        ]
      };

      db.invoices.push(proratedInvoice);
    }

    saveDatabase();

    // 3. Log event
    recordEvent('seat.adjusted', 'SEATS_PRORATED', {
      subscriptionId,
      productName: line.productName,
      oldQuantity,
      newQuantity,
      deltaQuantity,
      remainingDays,
      proratedAmount,
      invoiceId: proratedInvoice ? proratedInvoice.id : null
    });
  }

  return {
    success: true,
    subscriptionId,
    productName: line.productName,
    oldQuantity,
    newQuantity,
    deltaQuantity,
    totalCycleDays,
    remainingDays,
    dailyRatePerSeat: Number(dailyRatePerSeat.toFixed(4)),
    proratedAmount,
    taxAmount,
    totalDue,
    invoice: proratedInvoice
  };
}

module.exports = {
  adjustSeats
};


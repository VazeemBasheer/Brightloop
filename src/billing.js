// src/billing.js - Billing Engine for Brightloop Subscription Management System
const { db, saveDatabase } = require('./db');

/**
 * Formats a Date object to YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Adds months to a Date object
 */
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Adds days to a Date object
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Runs the recurring billing cycle.
 * 
 * Rules:
 * 1. Loops through active subscriptions.
 * 2. Checks if subscription is due for billing (or forces if simulate/all active).
 * 3. Anti-double-billing: Checks if already billed for this billing cycle.
 * 4. Calculates line items, discounts (seat-based, coupon, fixed), and taxes.
 * 5. Creates new Invoice objects with status 'Confirmed' (unpaid).
 * 6. Updates subscription lastBilledDate and advances nextBillingDate.
 * 7. Pushes invoices to db.invoices.
 * 
 * @param {Object} options
 * @param {string} [options.asOfDate] - Optional simulated current date (defaults to today)
 * @param {boolean} [options.forceAllActive] - If true, bills all active regardless of nextBillingDate
 */
function runBilling(options = {}) {
  const now = options.asOfDate ? new Date(options.asOfDate) : new Date();
  const todayStr = formatDate(now);
  const forceAll = Boolean(options.forceAllActive);

  const generatedInvoices = [];
  const skipped = [];

  // Filter only Active subscriptions
  const activeSubs = db.subscriptions.filter(s => s.status === 'Active');

  for (const sub of activeSubs) {
    // Double-billing check: already billed today
    if (sub.lastBilledDate === todayStr) {
      skipped.push({
        subscriptionId: sub.id,
        customerName: sub.customerName,
        reason: `Duplicate prevented. Already billed today (${todayStr}).`
      });
      continue;
    }

    const alreadyBilledToday = db.invoices.some(inv => 
      inv.subscriptionId === sub.id && inv.issueDate === todayStr
    );
    if (alreadyBilledToday) {
      skipped.push({
        subscriptionId: sub.id,
        customerName: sub.customerName,
        reason: `Duplicate prevented. Invoice already generated today (${todayStr}) for this subscription.`
      });
      continue;
    }

    const nextBill = new Date(sub.nextBillingDate);
    const isDue = forceAll || (nextBill <= now);

    if (!isDue) {
      skipped.push({
        subscriptionId: sub.id,
        customerName: sub.customerName,
        reason: `Not due yet. Next billing date is ${sub.nextBillingDate}.`
      });
      continue;
    }

    // Determine the billing period for this run
    const plan = db.plans.find(p => p.id === sub.planId) || { intervalMonths: 1 };
    const periodStart = todayStr;
    const periodEndDate = addMonths(now, plan.intervalMonths);
    const periodEnd = formatDate(periodEndDate);

    // Double-Billing Guard: check if an invoice already exists for this subscription and period
    const existingInvoice = db.invoices.find(inv => 
      inv.subscriptionId === sub.id &&
      inv.billingPeriod &&
      inv.billingPeriod.start === periodStart &&
      inv.billingPeriod.end === periodEnd
    );

    if (existingInvoice) {
      skipped.push({
        subscriptionId: sub.id,
        customerName: sub.customerName,
        reason: `Duplicate prevented. Already billed for period ${periodStart} to ${periodEnd} (Invoice: ${existingInvoice.id}).`
      });
      continue;
    }

    // 1. Calculate line items subtotal
    let subtotal = 0;
    let totalSeats = 0;
    const items = sub.lines.map(line => {
      const lineTotal = Number((line.unitPrice * line.quantity).toFixed(2));
      subtotal += lineTotal;
      totalSeats += (line.quantity || 1);

      return {
        productId: line.productId,
        description: `${line.productName} (${line.quantity} seats / units)`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: lineTotal
      };
    });

    // 2. Calculate discounts
    let discountTotal = 0;
    let discountApplied = null;

    if (sub.discountId) {
      const discountRule = db.discounts.find(d => d.id === sub.discountId);
      if (discountRule) {
        if (!discountRule.minQuantity || totalSeats >= discountRule.minQuantity) {
          if (discountRule.type === 'percentage') {
            discountTotal = Number((subtotal * discountRule.value).toFixed(2));
          } else if (discountRule.type === 'fixed') {
            discountTotal = Math.min(discountRule.value, subtotal);
          }
          discountApplied = {
            id: discountRule.id,
            code: discountRule.code,
            amount: discountTotal
          };
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountTotal);

    // 3. Calculate taxes
    let taxTotal = 0;
    let taxApplied = null;
    const taxRule = db.taxes.find(t => t.id === sub.taxId) || db.taxes.find(t => t.isDefault) || { rate: 0.10, name: "Standard Tax" };

    if (taxRule && taxRule.rate > 0) {
      taxTotal = Number((discountedSubtotal * taxRule.rate).toFixed(2));
      taxApplied = {
        id: taxRule.id,
        name: taxRule.name,
        rate: taxRule.rate,
        amount: taxTotal
      };
    }

    // 4. Final total
    const totalAmount = Number((discountedSubtotal + taxTotal).toFixed(2));

    // Determine due date from payment terms (e.g., Net 15, Net 30, Immediate)
    let netDays = 15;
    if (sub.paymentTerms === 'Net 30') netDays = 30;
    else if (sub.paymentTerms === 'Immediate') netDays = 0;

    const issueDate = todayStr;
    const dueDate = formatDate(addDays(now, netDays));

    // Generate unique sequential invoice ID
    const nextInvoiceNumber = (db.invoices.length + 1).toString().padStart(3, '0');
    const invoiceId = `INV-2026-${nextInvoiceNumber}`;

    const newInvoice = {
      id: invoiceId,
      subscriptionId: sub.id,
      customerId: sub.customerId,
      customerName: sub.customerName,
      issueDate: issueDate,
      dueDate: dueDate,
      billingPeriod: {
        start: periodStart,
        end: periodEnd
      },
      status: "Confirmed", // Ready to be paid by customer
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      discountApplied,
      taxTotal: Number(taxTotal.toFixed(2)),
      taxApplied,
      totalAmount: totalAmount,
      amountPaid: 0.00,
      amountDue: totalAmount,
      items: items
    };

    // Push new invoice to in-memory db
    db.invoices.push(newInvoice);
    generatedInvoices.push(newInvoice);

    // 5. Update Subscription billing dates
    sub.lastBilledDate = todayStr;
    sub.nextBillingDate = periodEnd;
  }

  // Persist to disk if any updates occurred
  if (generatedInvoices.length > 0) {
    saveDatabase();
  }

  const totalBilled = Number(generatedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toFixed(2));

  return {
    success: true,
    runDate: todayStr,
    totalActiveSubscriptions: activeSubs.length,
    invoicesGeneratedCount: generatedInvoices.length,
    totalBilledAmount: totalBilled,
    generatedInvoices: generatedInvoices,
    skipped: skipped
  };
}

module.exports = {
  runBilling
};

// src/time-machine.js - Simulation Engine & Fast-Forward Clock for Hackathon Demos
const { db, saveDatabase } = require('./db');
const { runBilling } = require('./billing');
const { recordEvent } = require('./events');

/**
 * Returns current simulated system date
 */
function getSystemDate() {
  if (!db.systemDate) {
    db.systemDate = new Date().toISOString().split('T')[0];
  }
  return db.systemDate;
}

/**
 * Fast-forwards system time by X days.
 * 
 * 1. Advances simulated date.
 * 2. Scans invoices: flags past-due unpaid invoices as 'Overdue'.
 * 3. Triggers billing for any subscriptions that have become due.
 * 4. Records timeline audit events.
 * 
 * @param {number} days - Number of days to fast-forward (default 30)
 */
function advanceTime(days = 30) {
  const previousDate = getSystemDate();
  const current = new Date(previousDate);
  current.setDate(current.getDate() + Number(days));
  const newDateStr = current.toISOString().split('T')[0];

  db.systemDate = newDateStr;

  // 1. Check for unpaid invoices that have now passed their dueDate
  const invoicesMadeOverdue = [];
  for (const inv of db.invoices) {
    if (inv.amountDue > 0 && inv.status !== 'Overdue' && inv.dueDate && inv.dueDate < newDateStr) {
      inv.status = 'Overdue';
      invoicesMadeOverdue.push({
        id: inv.id,
        customerName: inv.customerName,
        dueDate: inv.dueDate,
        amountDue: inv.amountDue
      });
    }
  }

  // 2. Run billing as of the new simulated date
  const billingResult = runBilling({
    asOfDate: newDateStr
  });

  // 3. Record Event
  recordEvent('time.fast_forward', 'TIME_MACHINE_ACTIVATED', {
    previousDate,
    newDate: newDateStr,
    daysAdvanced: days,
    invoicesMadeOverdueCount: invoicesMadeOverdue.length,
    newInvoicesGenerated: billingResult.invoicesGeneratedCount,
    totalBilled: billingResult.totalBilledAmount
  });

  saveDatabase();

  return {
    success: true,
    previousDate,
    currentSimulatedDate: newDateStr,
    daysAdvanced: days,
    invoicesMadeOverdue,
    billingSummary: {
      invoicesGeneratedCount: billingResult.invoicesGeneratedCount,
      totalBilledAmount: billingResult.totalBilledAmount,
      generatedInvoices: billingResult.generatedInvoices,
      skipped: billingResult.skipped
    }
  };
}

module.exports = {
  getSystemDate,
  advanceTime
};


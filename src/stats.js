// src/stats.js - Real-time Analytics & Financial Metrics for Dev 1 Dashboard
const { db } = require('./db');

/**
 * Calculates current platform statistics for the Finance Lead & Executive Dashboard.
 */
function getStats() {
  const today = new Date().toISOString().split('T')[0];

  // 1. Subscription Metrics
  const activeSubs = db.subscriptions.filter(s => s.status === 'Active');
  const totalSubsCount = db.subscriptions.length;
  const activeSubsCount = activeSubs.length;

  // Calculate MRR (Monthly Recurring Revenue)
  let mrr = 0;
  const mrrByPlan = new Map();
  for (const sub of activeSubs) {
    const plan = db.plans.find(p => p.id === sub.planId) || { intervalMonths: 1 };
    
    // Calculate regular subtotal for this subscription
    const subtotal = sub.lines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
    
    // Apply discount if active
    let discounted = subtotal;
    if (sub.discountId) {
      const discountRule = db.discounts.find(d => d.id === sub.discountId);
      if (discountRule) {
        if (discountRule.type === 'percentage') {
          discounted = subtotal * (1 - discountRule.value);
        } else if (discountRule.type === 'fixed') {
          discounted = Math.max(0, subtotal - discountRule.value);
        }
      }
    }

    // Normalize to monthly
    const monthlyValue = discounted / (plan.intervalMonths || 1);
    mrr += monthlyValue;

    const breakdown = mrrByPlan.get(sub.planId) || {
      planId: sub.planId,
      name: plan.name || sub.planId,
      activeSubscriptions: 0,
      mrr: 0
    };
    breakdown.activeSubscriptions++;
    breakdown.mrr += monthlyValue;
    mrrByPlan.set(sub.planId, breakdown);
  }
  mrr = Number(mrr.toFixed(2));
  const arr = Number((mrr * 12).toFixed(2));

  // 2. Invoice & Financial Metrics
  let totalRevenueCollected = 0;
  let outstandingRevenue = 0;
  let overdueRevenue = 0;
  let overdueInvoicesCount = 0;
  let paidInvoicesCount = 0;
  let unpaidInvoicesCount = 0;

  for (const inv of db.invoices) {
    totalRevenueCollected += (inv.amountPaid || 0);

    const due = inv.amountDue || 0;
    if (due > 0) {
      outstandingRevenue += due;
      unpaidInvoicesCount++;

      // Check if overdue: status is Overdue OR dueDate is before today
      if (inv.status === 'Overdue' || (inv.dueDate && inv.dueDate < today)) {
        overdueInvoicesCount++;
        overdueRevenue += due;
      }
    } else {
      paidInvoicesCount++;
    }
  }

  totalRevenueCollected = Number(totalRevenueCollected.toFixed(2));
  outstandingRevenue = Number(outstandingRevenue.toFixed(2));
  overdueRevenue = Number(overdueRevenue.toFixed(2));

  // 3. Recent Feed (last 5 invoices and payments)
  const recentInvoices = [...db.invoices]
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
    .slice(0, 5);

  const recentPayments = [...db.payments]
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    .slice(0, 5);

  return {
    asOf: today,
    overview: {
      mrr: mrr,                              // Monthly Recurring Revenue
      arr: arr,                              // Annual Recurring Revenue
      activeSubscriptions: activeSubsCount,  // Count of active subscriptions
      totalSubscriptions: totalSubsCount,    // Total subscriptions (all states)
      totalRevenue: totalRevenueCollected,   // Cash collected to date
      outstandingRevenue: outstandingRevenue,// Unpaid revenue due
      overdueInvoicesCount: overdueInvoicesCount, // Count of overdue invoices
      overdueRevenue: overdueRevenue,        // $ amount overdue
      totalCustomers: db.customers.length
    },
    mrrByPlan: Array.from(mrrByPlan.values()).map(plan => ({
      ...plan,
      mrr: Number(plan.mrr.toFixed(2))
    })),
    invoicesBreakdown: {
      total: db.invoices.length,
      paid: paidInvoicesCount,
      unpaid: unpaidInvoicesCount,
      overdue: overdueInvoicesCount
    },
    subscriptionsByStatus: {
      active: db.subscriptions.filter(s => s.status === 'Active').length,
      quotation: db.subscriptions.filter(s => s.status === 'Quotation').length,
      draft: db.subscriptions.filter(s => s.status === 'Draft').length,
      confirmed: db.subscriptions.filter(s => s.status === 'Confirmed').length,
      closed: db.subscriptions.filter(s => s.status === 'Closed').length
    },
    recentInvoices,
    recentPayments
  };
}

module.exports = {
  getStats
};

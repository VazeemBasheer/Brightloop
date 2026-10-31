import type {
  ActivePlan,
  AgingBucket,
  AssistantAnalysis,
  BillingRunResult,
  Insight,
  Invoice,
  Kpi,
  PlanMixItem,
  PortalInvoice,
  RevenuePoint,
} from './data';

export interface DashboardData {
  kpis: Kpi[];
  revenue: RevenuePoint[];
  aging: AgingBucket[];
  overdueInvoices: Invoice[];
  planMix: PlanMixItem[];
  asOf: string;
  renewalsNext30Days: number;
  renewalValueNext30Days: number;
  billedTotal: number;
  collectionRate: number;
  overdueInvoiceCount: number;
  queuedNoticeInvoiceIds: string[];
}

export interface PortalData {
  customer: { id: string; name: string; company?: string };
  plans: ActivePlan[];
  invoices: PortalInvoice[];
}

interface SubscriptionLine {
  productId: string;
  productName: string;
  variant?: string;
  quantity: number;
  activeUsers30Days?: number;
  unitPrice: number;
}

interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: string;
  status: string;
  nextBillingDate: string;
  lines: SubscriptionLine[];
}

interface BackendInvoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  billingPeriod?: { start: string; end: string };
  status: string;
  totalAmount: number;
  amountDue: number;
  amountPaid: number;
  taxTotal?: number;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
}

interface BackendStats {
  asOf: string;
  mrrByPlan: Array<{
    planId: string;
    name: string;
    activeSubscriptions: number;
    mrr: number;
  }>;
  overview: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    totalSubscriptions: number;
    totalRevenue: number;
    outstandingRevenue: number;
    overdueInvoicesCount: number;
    overdueRevenue: number;
    totalCustomers: number;
  };
}

interface BackendProduct {
  id: string;
  category: string;
}

interface GeminiFinding {
  type: 'duplicate' | 'zombie' | 'upgrade';
  tool: string;
  savingEstimate: number;
  recommendation: string;
  confidence: number;
}

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';
const aiApiBase = (import.meta.env.VITE_AI_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '/ai-api';
const customerStorageKey = 'brightloop.customerId';

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string; message?: string } | null;
    throw new Error(body?.error || body?.message || `${path} failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

const backend = <T>(path: string, init?: RequestInit) => request<T>(apiBase, path, init);
const aiService = <T>(path: string, init?: RequestInit) => request<T>(aiApiBase, path, init);
const jsonBody = (body: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
});

const today = () => new Date().toISOString().slice(0, 10);
const dayDifference = (date: string) =>
  Math.floor((Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const frequencyFor = (planId: string): ActivePlan['frequency'] => {
  if (planId.includes('year')) return 'Yearly';
  if (planId.includes('quarter')) return 'Quarterly';
  return 'Monthly';
};

function mapInvoice(invoice: BackendInvoice): Invoice {
  const daysOverdue = dayDifference(invoice.dueDate);
  return {
    id: invoice.id,
    customer: invoice.customerName,
    initials: initials(invoice.customerName),
    plan: invoice.items.map((item) => item.description).join(', ') || invoice.subscriptionId,
    amount: invoice.amountDue,
    dueDate: invoice.dueDate,
    daysOverdue,
    status: daysOverdue > 0 ? 'overdue' : 'sent',
  };
}

function mapPortalInvoice(invoice: BackendInvoice): PortalInvoice {
  return {
    id: invoice.id,
    period: invoice.billingPeriod?.start
      ? new Date(`${invoice.billingPeriod.start}T00:00:00`).toLocaleString('en-US', { month: 'short', year: 'numeric' })
      : invoice.issueDate,
    issued: invoice.issueDate,
    amount: invoice.totalAmount,
    status: invoice.amountDue <= 0 ? 'paid' : dayDifference(invoice.dueDate) > 0 ? 'overdue' : 'due',
  };
}

function mapSubscriptionPlan(subscription: Subscription): ActivePlan {
  const seats = subscription.lines.reduce((sum, line) => sum + line.quantity, 0);
  const activeUsers = subscription.lines.reduce((sum, line) => sum + (line.activeUsers30Days ?? line.quantity), 0);
  const price = subscription.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const status = subscription.status.toLowerCase();
  return {
    id: subscription.id,
    product: subscription.lines.map((line) => line.productName).join(' · ') || 'Subscription',
    variant: subscription.lines.map((line) => line.variant).filter(Boolean).join(' · ') || subscription.planId,
    frequency: frequencyFor(subscription.planId),
    seats,
    price,
    renewsOn: subscription.nextBillingDate,
    status: status === 'active' ? 'active' : status === 'trial' ? 'trial' : 'paused',
    usage: seats ? Math.round((activeUsers / seats) * 100) : 0,
  };
}

function makeDashboard(
  stats: BackendStats,
  subscriptions: Subscription[],
  backendInvoices: BackendInvoice[],
  notices: Array<{ invoiceId: string }>,
): DashboardData {
  const metrics = stats.overview;
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  const kpis: Kpi[] = [
    {
      id: 'mrr',
      label: 'Monthly recurring revenue',
      value: metrics.mrr,
      format: 'currency',
      delta: 0,
      deltaLabel: 'live from billing engine',
      trend: 'flat',
      hint: `ARR ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.arr)}.`,
    },
    {
      id: 'active',
      label: 'Active subscriptions',
      value: metrics.activeSubscriptions,
      format: 'number',
      delta: 0,
      deltaLabel: `of ${metrics.totalSubscriptions} total`,
      trend: 'flat',
      hint: `${metrics.totalCustomers} customers in the billing database.`,
    },
    {
      id: 'overdue',
      label: 'Overdue invoices',
      value: metrics.overdueRevenue,
      format: 'currency',
      delta: 0,
      deltaLabel: `${metrics.overdueInvoicesCount} invoices past due`,
      trend: 'flat',
      hint: 'Outstanding balances past their due date.',
    },
    {
      id: 'collected',
      label: 'Collected to date',
      value: metrics.totalRevenue,
      format: 'currency',
      delta: 0,
      deltaLabel: 'recorded payments',
      trend: 'flat',
      hint: `Total outstanding: ${metrics.outstandingRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`,
    },
  ];

  const unsettled = backendInvoices.filter((invoice) => invoice.amountDue > 0);
  const buckets: AgingBucket[] = [
    { label: 'Current', amount: 0, invoices: 0, tone: 'mint' },
    { label: '1–30 days', amount: 0, invoices: 0, tone: 'amber' },
    { label: '31–60 days', amount: 0, invoices: 0, tone: 'ember' },
    { label: '60+ days', amount: 0, invoices: 0, tone: 'brand' },
  ];
  for (const invoice of unsettled) {
    const days = dayDifference(invoice.dueDate);
    const bucket = buckets[days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : 3];
    bucket.amount += invoice.amountDue;
    bucket.invoices += 1;
  }

  const colors = ['#7c6deb', '#3ec79a', '#e9b464', '#69a9e8'];
  const planMix: PlanMixItem[] = stats.mrrByPlan.map((plan, index) => ({
    name: plan.name,
    accounts: plan.activeSubscriptions,
    mrr: plan.mrr,
    share: metrics.mrr ? Math.round((plan.mrr / metrics.mrr) * 100) : 0,
    color: colors[index % colors.length],
  }));
  const renewalLimit = Date.now() + 30 * 86_400_000;
  const upcoming = subscriptions.filter((subscription) =>
    subscription.status === 'Active'
    && Date.parse(`${subscription.nextBillingDate}T00:00:00`) <= renewalLimit
    && Date.parse(`${subscription.nextBillingDate}T00:00:00`) >= Date.now(),
  );
  const renewalValueNext30Days = upcoming.reduce((total, subscription) =>
    total + subscription.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0), 0);
  const overdueInvoices = unsettled
    .map(mapInvoice)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
  const billedTotal = backendInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const collectedTotal = backendInvoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);

  return {
    kpis,
    revenue: [{ month: currentMonth, mrr: metrics.mrr, collected: metrics.totalRevenue }],
    aging: buckets,
    overdueInvoices,
    planMix,
    asOf: stats.asOf,
    renewalsNext30Days: upcoming.length,
    renewalValueNext30Days,
    billedTotal,
    collectionRate: billedTotal ? Math.round((collectedTotal / billedTotal) * 100) : 0,
    overdueInvoiceCount: metrics.overdueInvoicesCount,
    queuedNoticeInvoiceIds: [...new Set(notices.map((notice) => notice.invoiceId))],
  };
}

function mapInsight(value: GeminiFinding, index: number): Insight {
  const tone: Insight['tone'] = value.type === 'zombie' || value.type === 'duplicate' ? 'risk' : 'opportunity';
  const title = value.type === 'zombie'
    ? 'Low-usage subscription'
    : value.type === 'duplicate'
      ? 'Potential duplicate tools'
      : 'Annual billing opportunity';
  return {
    id: `gemini-${index}`,
    tone,
    title,
    vendor: value.tool,
    detail: value.recommendation,
    savingsPerYear: value.savingEstimate,
    action: 'Draft vendor email',
    confidence: value.confidence,
  };
}

export const api = {
  getDashboard: async () => {
    const [stats, subscriptions, invoices, notices] = await Promise.all([
      backend<BackendStats>('/api/stats'),
      backend<Subscription[]>('/api/subscriptions'),
      backend<BackendInvoice[]>('/api/invoices'),
      backend<Array<{ invoiceId: string }>>('/api/notices'),
    ]);
    return makeDashboard(stats, subscriptions, invoices, notices);
  },

  getPortal: async (customerId = localStorage.getItem(customerStorageKey) || 'cust-101') => {
    const [customers, subscriptions, invoices] = await Promise.all([
      backend<Array<{ id: string; name: string; company?: string }>>('/api/customers'),
      backend<Subscription[]>(`/api/subscriptions?customerId=${encodeURIComponent(customerId)}`),
      backend<BackendInvoice[]>(`/api/invoices?customerId=${encodeURIComponent(customerId)}`),
    ]);
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) throw new Error(`Customer ${customerId} was not found`);
    return {
      customer,
      plans: subscriptions.map(mapSubscriptionPlan),
      invoices: invoices.map(mapPortalInvoice).sort((a, b) => b.issued.localeCompare(a.issued)),
    };
  },

  findCustomerByEmail: async (email: string) => {
    const customers = await backend<Array<{ id: string; name: string; email: string }>>('/api/customers');
    return customers.find((customer) => customer.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  createCustomer: (customer: { name: string; email: string; company: string }) =>
    backend<{ success: boolean; customer: { id: string; name: string; email: string } }>(
      '/api/customers',
      jsonBody(customer),
    ),

  runBillingDay: async (customerId = localStorage.getItem(customerStorageKey) || 'cust-101') => {
    const result = await backend<{
      success: boolean;
      runDate: string;
      invoicesGeneratedCount: number;
      totalBilledAmount: number;
      generatedInvoices: BackendInvoice[];
      skipped: Array<{ reason: string }>;
    }>('/api/run-billing', jsonBody({ customerId, forceAllActive: true }));
    return {
      runId: `RUN-${result.runDate.replaceAll('-', '')}`,
      generatedAt: result.runDate,
      invoicesCreated: result.invoicesGeneratedCount,
      totalBilled: result.totalBilledAmount,
      taxCollected: result.generatedInvoices.reduce((sum, invoice) => sum + (invoice.taxTotal ?? 0), 0),
      skippedDuplicates: result.skipped.filter((item) => item.reason.startsWith('Duplicate prevented')).length,
      invoices: result.generatedInvoices.map(mapPortalInvoice),
    } satisfies BillingRunResult;
  },

  sendOverdueNotice: (invoiceId: string) =>
    backend<{ invoiceId: string; queuedAt: string }>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/notices`,
      jsonBody({}),
    ),

  payInvoice: (invoiceId: string) =>
    backend<{ success: boolean; invoice: BackendInvoice }>(
      `/api/invoices/${encodeURIComponent(invoiceId)}/pay`,
      jsonBody({}),
    ),

  getAnalysis: async (): Promise<AssistantAnalysis> => {
    const [subscriptions, products] = await Promise.all([
      backend<Subscription[]>('/api/subscriptions'),
      backend<BackendProduct[]>('/api/products'),
    ]);
    const categories = new Map(products.map((product) => [product.id, product.category]));
    const findings = await aiService<GeminiFinding[]>(
      '/analyze-spending',
      jsonBody({
        subscriptions: subscriptions.flatMap((subscription) =>
          subscription.lines.map((line) => ({
            name: line.productName,
            category: categories.get(line.productId) ?? line.productId,
            cost: line.unitPrice * line.quantity,
            billing: frequencyFor(subscription.planId).toLowerCase(),
            seats: line.quantity,
            activeUsers: line.activeUsers30Days ?? line.quantity,
          })),
        ),
      }),
    );
    if (!Array.isArray(findings) || findings.some((finding) =>
      !finding
      || !['duplicate', 'zombie', 'upgrade'].includes(finding.type)
      || typeof finding.tool !== 'string'
      || typeof finding.recommendation !== 'string'
      || !Number.isFinite(finding.savingEstimate)
      || !Number.isFinite(finding.confidence)
      || finding.confidence < 0
      || finding.confidence > 1
    )) {
      throw new Error('Gemini returned findings in an unexpected format.');
    }
    const insights = findings.map(mapInsight);
    return {
      generatedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash',
      summary: insights.length
        ? `Gemini analysed ${subscriptions.length} live subscriptions and found ${insights.length} opportunities.`
        : `Gemini analysed ${subscriptions.length} live subscriptions and found no recommendations.`,
      annualSavings: insights.reduce((sum, insight) => sum + insight.savingsPerYear, 0),
      insights,
    };
  },

  askAssistant: async (message: string) => {
    const [subscriptions, stats, invoices] = await Promise.all([
      backend<Subscription[]>('/api/subscriptions'),
      backend<BackendStats>('/api/stats'),
      backend<BackendInvoice[]>('/api/invoices'),
    ]);
    return aiService<{ reply: string }>(
      '/chat',
      jsonBody({
        message,
        portfolio: {
          metrics: stats.overview,
          subscriptions: subscriptions.map((subscription) => ({
            customer: subscription.customerName,
            status: subscription.status,
            nextBillingDate: subscription.nextBillingDate,
            products: subscription.lines.map((line) => ({
              name: line.productName,
              seats: line.quantity,
              activeUsers: line.activeUsers30Days ?? line.quantity,
              unitPrice: line.unitPrice,
            })),
          })),
          invoices: invoices.map((invoice) => ({
            id: invoice.id,
            customer: invoice.customerName,
            dueDate: invoice.dueDate,
            status: invoice.status,
            total: invoice.totalAmount,
            amountDue: invoice.amountDue,
          })),
        },
      }),
    );
  },

  draftEmail: (insight: Insight) =>
    aiService<{ emailDraft: string }>(
      '/draft-email',
      jsonBody({
        vendorName: insight.vendor,
        action: insight.action,
        context: insight.detail,
      }),
    ),
};

export function setCurrentCustomer(customerId: string) {
  localStorage.setItem(customerStorageKey, customerId);
}

export function clearCurrentCustomer() {
  localStorage.removeItem(customerStorageKey);
}

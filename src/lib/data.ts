export type Trend = 'up' | 'down' | 'flat';

export interface Kpi {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  delta: number;
  deltaLabel: string;
  trend: Trend;
  hint: string;
}

export interface RevenuePoint {
  month: string;
  mrr: number;
  collected: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
  invoices: number;
  tone: 'mint' | 'amber' | 'ember' | 'brand';
}

export interface Invoice {
  id: string;
  customer: string;
  initials: string;
  plan: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: 'overdue' | 'sent' | 'paid' | 'draft';
}

export interface PlanMixItem {
  name: string;
  accounts: number;
  mrr: number;
  share: number;
  color: string;
}

export interface ActivePlan {
  id: string;
  product: string;
  variant: string;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly' | 'Weekly' | 'Daily';
  seats: number;
  price: number;
  renewsOn: string;
  status: 'active' | 'paused' | 'trial';
  usage: number;
}

export interface PortalInvoice {
  id: string;
  period: string;
  issued: string;
  amount: number;
  status: 'paid' | 'due' | 'overdue' | 'draft';
}

export interface BillingRunResult {
  runId: string;
  generatedAt: string;
  invoicesCreated: number;
  totalBilled: number;
  taxCollected: number;
  skippedDuplicates: number;
  invoices: PortalInvoice[];
}

export type InsightTone = 'risk' | 'opportunity' | 'neutral';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  vendor: string;
  detail: string;
  savingsPerYear: number;
  action: string;
  confidence: number;
}

export interface AssistantAnalysis {
  generatedAt: string;
  model: string;
  summary: string;
  annualSavings: number;
  insights: Insight[];
}

export interface AssistantMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

/** Money in the dashboard is displayed in USD but modelled in whole dollars. */
export const kpis: Kpi[] = [
  {
    id: 'mrr',
    label: 'Monthly recurring revenue',
    value: 486_200,
    format: 'currency',
    delta: 6.4,
    deltaLabel: 'vs. last month',
    trend: 'up',
    hint: 'Normalised across daily, weekly, monthly and yearly plans.',
  },
  {
    id: 'active',
    label: 'Active subscriptions',
    value: 1_248,
    format: 'number',
    delta: 3.1,
    deltaLabel: 'net new this month',
    trend: 'up',
    hint: 'Excludes paused and closed contracts.',
  },
  {
    id: 'overdue',
    label: 'Overdue invoices',
    value: 38_450,
    format: 'currency',
    delta: 12.5,
    deltaLabel: '17 invoices past due',
    trend: 'down',
    hint: 'Oldest balance is 74 days past due.',
  },
  {
    id: 'collected',
    label: 'Collected this month',
    value: 412_900,
    format: 'currency',
    delta: 4.8,
    deltaLabel: 'of $486.2k billed',
    trend: 'up',
    hint: 'Card, ACH, wire and bank transfer settled.',
  },
];

export const revenueSeries: RevenuePoint[] = [
  { month: 'Nov', mrr: 362_000, collected: 331_000 },
  { month: 'Dec', mrr: 371_500, collected: 352_000 },
  { month: 'Jan', mrr: 389_000, collected: 361_000 },
  { month: 'Feb', mrr: 397_400, collected: 378_200 },
  { month: 'Mar', mrr: 412_800, collected: 386_000 },
  { month: 'Apr', mrr: 421_300, collected: 402_100 },
  { month: 'May', mrr: 434_600, collected: 411_500 },
  { month: 'Jun', mrr: 441_900, collected: 420_800 },
  { month: 'Jul', mrr: 452_100, collected: 428_300 },
  { month: 'Aug', mrr: 460_800, collected: 439_200 },
  { month: 'Sep', mrr: 473_500, collected: 445_600 },
  { month: 'Oct', mrr: 486_200, collected: 412_900 },
];

export const agingBuckets: AgingBucket[] = [
  { label: 'Current', amount: 34_650, invoices: 41, tone: 'mint' },
  { label: '1–30 days', amount: 22_400, invoices: 9, tone: 'amber' },
  { label: '31–60 days', amount: 10_800, invoices: 5, tone: 'ember' },
  { label: '60+ days', amount: 5_250, invoices: 3, tone: 'brand' },
];

export const overdueInvoices: Invoice[] = [
  {
    id: 'INV-20418',
    customer: 'Northwind Retail',
    initials: 'NR',
    plan: 'Brightloop Platinum · Yearly',
    amount: 12_480,
    dueDate: '2026-08-18',
    daysOverdue: 74,
    status: 'overdue',
  },
  {
    id: 'INV-20471',
    customer: 'Halcyon Labs',
    initials: 'HL',
    plan: 'Enterprise Suite · Monthly',
    amount: 8_900,
    dueDate: '2026-09-12',
    daysOverdue: 49,
    status: 'overdue',
  },
  {
    id: 'INV-20502',
    customer: 'Meridian Freight',
    initials: 'MF',
    plan: 'Brightloop Standard · Monthly',
    amount: 6_250,
    dueDate: '2026-09-27',
    daysOverdue: 34,
    status: 'sent',
  },
  {
    id: 'INV-20533',
    customer: 'Aster & Co.',
    initials: 'AC',
    plan: 'Storage Add-on · Monthly',
    amount: 4_320,
    dueDate: '2026-10-04',
    daysOverdue: 27,
    status: 'overdue',
  },
  {
    id: 'INV-20561',
    customer: 'Loop Analytics',
    initials: 'LA',
    plan: 'Brightloop Platinum · Monthly',
    amount: 3_600,
    dueDate: '2026-10-12',
    daysOverdue: 19,
    status: 'sent',
  },
  {
    id: 'INV-20584',
    customer: 'Fieldstone Group',
    initials: 'FG',
    plan: 'CRM Add-on · Monthly',
    amount: 2_900,
    dueDate: '2026-10-22',
    daysOverdue: 9,
    status: 'sent',
  },
];

export const planMix: PlanMixItem[] = [
  {
    name: 'Platinum Edition',
    accounts: 421,
    mrr: 214_800,
    share: 44,
    color: '#7c6deb',
  },
  {
    name: 'Standard',
    accounts: 603,
    mrr: 186_400,
    share: 38,
    color: '#3ec79a',
  },
  {
    name: 'Add-ons',
    accounts: 224,
    mrr: 85_000,
    share: 18,
    color: '#e9b464',
  },
];

export const activePlans: ActivePlan[] = [
  {
    id: 'SUB-8841',
    product: 'Brightloop Platinum',
    variant: 'Brand: Platinum Edition',
    frequency: 'Yearly',
    seats: 40,
    price: 12_480,
    renewsOn: '2027-02-14',
    status: 'active',
    usage: 72,
  },
  {
    id: 'SUB-8842',
    product: 'Enterprise Suite',
    variant: 'Brand: Standard',
    frequency: 'Monthly',
    seats: 25,
    price: 3_600,
    renewsOn: '2026-11-04',
    status: 'active',
    usage: 91,
  },
  {
    id: 'SUB-8843',
    product: 'Storage Add-on',
    variant: '1 TB block',
    frequency: 'Monthly',
    seats: 1,
    price: 640,
    renewsOn: '2026-11-04',
    status: 'paused',
    usage: 18,
  },
];

export const portalInvoices: PortalInvoice[] = [
  {
    id: 'INV-20614',
    period: 'Oct 2026',
    issued: '2026-10-01',
    amount: 16_720,
    status: 'due',
  },
  {
    id: 'INV-20512',
    period: 'Sep 2026',
    issued: '2026-09-01',
    amount: 16_720,
    status: 'paid',
  },
  {
    id: 'INV-20408',
    period: 'Aug 2026',
    issued: '2026-08-01',
    amount: 16_720,
    status: 'paid',
  },
];

export const agingToneClasses: Record<AgingBucket['tone'], string> = {
  mint: 'bg-mint-400',
  amber: 'bg-amber-soft',
  ember: 'bg-ember-400',
  brand: 'bg-brand-400',
};

import {
  activePlans,
  agingBuckets,
  kpis,
  overdueInvoices,
  planMix,
  portalInvoices,
  revenueSeries,
  type ActivePlan,
  type AgingBucket,
  type AssistantAnalysis,
  type BillingRunResult,
  type Insight,
  type Invoice,
  type Kpi,
  type PlanMixItem,
  type PortalInvoice,
  type RevenuePoint,
} from './data';

export interface DashboardData {
  kpis: Kpi[];
  revenue: RevenuePoint[];
  aging: AgingBucket[];
  overdueInvoices: Invoice[];
  planMix: PlanMixItem[];
  asOf: string;
}

export interface PortalData {
  plans: ActivePlan[];
  invoices: PortalInvoice[];
}

/**
 * When Dev 2 ships the Express endpoints, set VITE_API_BASE in .env and every
 * screen here switches from the seeded adapter to live data with no other
 * changes. Endpoint paths match the implementation spec.
 */
const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
  /\/$/,
  '',
);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: () => T | Promise<T>,
): Promise<T> {
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      });
      if (res.ok) return (await res.json()) as T;
      console.warn(`[brightloop] ${path} responded ${res.status}; using seed.`);
    } catch (error) {
      console.warn(`[brightloop] ${path} unreachable; using seed.`, error);
    }
  }
  return fallback();
}

export const api = {
  getDashboard: () =>
    request<DashboardData>('/api/finance/overview', undefined, async () => {
      await wait(320);
      return {
        kpis,
        revenue: revenueSeries,
        aging: agingBuckets,
        overdueInvoices,
        planMix,
        asOf: new Date().toISOString(),
      };
    }),

  getPortal: () =>
    request<PortalData>('/api/portal/me', undefined, async () => {
      await wait(280);
      return { plans: activePlans, invoices: portalInvoices };
    }),

  runBillingDay: (customerId = 'cus_aster') =>
    request<BillingRunResult>(
      '/api/billing/run',
      { method: 'POST', body: JSON.stringify({ customerId }) },
      async () => {
        await wait(1400);
        const totalBilled = activePlans
          .filter((p) => p.status !== 'paused')
          .reduce((sum, p) => sum + p.price, 0);
        return {
          runId: `RUN-${Date.now().toString().slice(-6)}`,
          generatedAt: new Date().toISOString(),
          invoicesCreated: 2,
          totalBilled,
          taxCollected: Math.round(totalBilled * 0.15),
          skippedDuplicates: 1,
          invoices: [
            {
              id: `INV-${Date.now().toString().slice(-5)}`,
              period: 'Oct 2026',
              issued: new Date().toISOString().slice(0, 10),
              amount: totalBilled,
              status: 'due',
            },
          ],
        };
      },
    ),

  sendOverdueNotice: (invoiceId: string) =>
    request<{ invoiceId: string; queuedAt: string }>(
      `/api/invoices/${invoiceId}/notices`,
      { method: 'POST' },
      async () => {
        await wait(600);
        return { invoiceId, queuedAt: new Date().toISOString() };
      },
    ),

  getAnalysis: (scope = 'portfolio') =>
    request<AssistantAnalysis>(
      '/api/assistant/analyze',
      { method: 'POST', body: JSON.stringify({ scope }) },
      async () => {
        await wait(900);
        return analysis;
      },
    ),

  askAssistant: (message: string) =>
    request<{ reply: string }>(
      '/api/assistant/chat',
      { method: 'POST', body: JSON.stringify({ message }) },
      async () => {
        await wait(750);
        return { reply: heuristicReply(message) };
      },
    ),
};

const analysis: AssistantAnalysis = {
  generatedAt: new Date().toISOString(),
  model: 'gemini-3.8-flash',
  summary:
    'I audited 1,248 active subscriptions. Four issues account for most of the leakage: duplicate collaboration tools, one zombie video plan, 30 unassigned Slack seats, and 14 vendors still on monthly billing that offer annual terms.',
  annualSavings: 31_560,
  insights: [
    {
      id: 'ins-1',
      tone: 'risk',
      title: 'Duplicate collaboration stacks',
      vendor: 'Notion + Confluence',
      detail:
        'Both tools are billed to overlapping teams. Consolidating on Notion would shut down 214 unused Confluence seats.',
      savingsPerYear: 12_480,
      action: 'Draft consolidation plan',
      confidence: 0.94,
    },
    {
      id: 'ins-2',
      tone: 'opportunity',
      title: 'Unassigned seats on Slack',
      vendor: 'Slack Business+',
      detail:
        '210 seats are assigned out of 240 provisioned. Right-size the contract at renewal for an immediate credit.',
      savingsPerYear: 8_640,
      action: 'Right-size seats',
      confidence: 0.88,
    },
    {
      id: 'ins-3',
      tone: 'risk',
      title: 'Zombie subscription detected',
      vendor: 'Loom Enterprise',
      detail:
        'No logins in 63 days across 34 seats, yet the yearly term auto-renews on 12 Nov.',
      savingsPerYear: 6_120,
      action: 'Pause before renewal',
      confidence: 0.91,
    },
    {
      id: 'ins-4',
      tone: 'opportunity',
      title: 'Switch monthly terms to annual',
      vendor: 'Figma, Linear, Vercel',
      detail:
        'All three vendors price annual contracts 15–20% below the monthly equivalent. Cash-flow positive within one quarter.',
      savingsPerYear: 4_320,
      action: 'Negotiate annual terms',
      confidence: 0.82,
    },
  ],
};

function heuristicReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes('overdue') || q.includes('chase') || q.includes('collect')) {
    return '17 invoices worth $38,450 are past due. Northwind Retail alone is 74 days late on $12,480 — that is the one to escalate to a call today. The 1–30 day bucket only needs a reminder cadence.';
  }
  if (q.includes('save') || q.includes('cut') || q.includes('waste')) {
    return 'The fastest win is the Slack seat mismatch: 30 unassigned seats is $8,640 a year. After that, pausing Loom before its 12 Nov renewal avoids $6,120. Together that is $14,760 without changing how anyone works.';
  }
  if (q.includes('renew') || q.includes('next month')) {
    return '23 subscriptions renew in the next 30 days, totalling $41,280. Two of them — Slack and Loom — are candidates to pause or renegotiate first.';
  }
  if (q.includes('mrr') || q.includes('revenue') || q.includes('arr')) {
    return 'MRR is $486,200, up 6.4% month over month, putting ARR at $5.83M. Platinum Edition drives 44% of it. Collected cash this month is $412,900, so roughly $73.3k is still receivable.';
  }
  return 'Looking at the portfolio: MRR $486,200, 1,248 active subscriptions, $38,450 overdue. The biggest lever right now is the duplicate collaboration spend — $12,480 a year with no change to how the team works. Want me to draft the cancellation letter?';
}

export type { Insight };

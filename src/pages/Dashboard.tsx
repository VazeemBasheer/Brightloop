import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Download,
  Search,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '../components/app/AppShell';
import { RevenueChart } from '../components/app/RevenueChart';
import { useAssistant } from '../components/app/AssistantContext';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';
import { api, type DashboardData } from '../lib/api';
import { agingToneClasses, type Invoice, type PlanMixItem } from '../lib/data';
import { num, percent, usd } from '../lib/format';

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'sent', label: 'Open' },
] as const;

function planMixGradient(plans: PlanMixItem[]) {
  let offset = 0;
  const segments = plans.map((plan) => {
    const start = offset;
    offset += plan.share * 3.6;
    return `${plan.color} ${start}deg ${offset}deg`;
  });
  return segments.length ? `conic-gradient(${segments.join(', ')})` : '#ffffff10';
}

export default function Dashboard() {
  const { push } = useToast();
  const { open } = useAssistant();
  const location = useLocation();

  const [data, setData] = useState<DashboardData | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'overdue' | 'sent'>('all');
  const [notified, setNotified] = useState<string[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.getDashboard()
      .then((result) => {
        if (alive) {
          setData(result);
          setNotified(result.queuedNoticeInvoiceIds);
        }
      })
      .catch((error: unknown) => {
        if (alive) setLoadError(error instanceof Error ? error.message : 'Dashboard data could not be loaded.');
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const invoices = useMemo(() => {
    if (!data) return [];
    return data.overdueInvoices.filter((invoice) => {
      const matchesQuery = `${invoice.customer} ${invoice.id} ${invoice.plan}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        status === 'all' ? true : invoice.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, status]);

  const totals = useMemo(() => {
    if (!data) return null;
    const outstanding = data.aging.reduce((sum, bucket) => sum + bucket.amount, 0);
    const collectedPct = data.collectionRate;
    return { outstanding, collectedPct };
  }, [data]);

  const notify = async (invoice: Invoice) => {
    setSending(invoice.id);
    try {
      await api.sendOverdueNotice(invoice.id);
      setNotified((current) => [...current, invoice.id]);
      push({
        tone: 'success',
        title: `Reminder queued · ${invoice.id}`,
        description: `${invoice.customer}'s notice is recorded in the billing queue.`,
      });
    } catch (error) {
      push({
        tone: 'error',
        title: 'Could not queue reminder',
        description: error instanceof Error ? error.message : 'The billing service did not accept the request.',
      });
    } finally {
      setSending(null);
    }
  };

  const notifyAll = async () => {
    if (!data) return;
    const pending = data.overdueInvoices.filter((i) => i.daysOverdue > 0 && !notified.includes(i.id));
    setSending('all');
    try {
      await Promise.all(pending.map((i) => api.sendOverdueNotice(i.id)));
      setNotified((current) => [...current, ...pending.map((i) => i.id)]);
      push({
        tone: 'success',
        title: `${pending.length} reminders queued`,
        description: 'Requests are recorded in the billing queue.',
      });
    } catch (error) {
      push({
        tone: 'error',
        title: 'Could not queue all reminders',
        description: error instanceof Error ? error.message : 'The billing service did not accept every request.',
      });
    } finally {
      setSending(null);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Invoice', 'Customer', 'Plan', 'Amount', 'Days overdue', 'Status'],
      ...data.overdueInvoices.map((i) => [
        i.id,
        i.customer,
        i.plan,
        String(i.amount),
        String(i.daysOverdue),
        i.status,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'brightloop-receivables.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    push({ tone: 'info', title: 'Receivables exported', description: 'CSV downloaded.' });
  };

  return (
    <AppShell title="Finance overview" subtitle="Live billing data · all customers">
      <div id="overview" className="scroll-mt-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · all customers</p>
            <h1 className="mt-2.5 text-2xl font-medium tracking-[-0.03em] text-white sm:text-[28px]">
              Good morning, Maya.
            </h1>
            <p className="mt-1.5 max-w-md text-[13px] text-zinc-500">
              Here is where the recurring business stands, before the month
              closes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={!data}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-40"
            >
              <Download className="size-3.5" /> Export
            </button>
          </div>
        </div>

        {loadError && (
          <Alert tone="error" title="Finance data unavailable" className="mt-6">
            {loadError} Confirm the billing API is running on port 5000, then refresh.
          </Alert>
        )}

        {alertOpen && (data?.overdueInvoices.some((invoice) => invoice.daysOverdue > 60) ?? false) && (
          <Alert
            tone="warning"
            title={`${data?.overdueInvoices.filter((invoice) => invoice.daysOverdue > 60).length ?? 0} invoices have crossed 60 days`}
            className="mt-6"
            onDismiss={() => setAlertOpen(false)}
            action={
              <>
                <a
                  href="#receivables"
                  className="rounded-md border border-amber-soft/40 bg-amber-soft/10 px-3 py-1.5 text-[11px] text-amber-soft transition hover:bg-amber-soft/20"
                >
                  Open chase queue
                </a>
                <button
                  type="button"
                  onClick={open}
                  className="rounded-md px-3 py-1.5 text-[11px] text-amber-soft/80 transition hover:text-amber-soft"
                >
                  Ask AI for a plan
                </button>
              </>
            }
          >
            {usd(data?.aging.find((bucket) => bucket.label === '60+ days')?.amount ?? 0)} is more than 60 days past due, based on the billing records.
          </Alert>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data
            ? data.kpis.map((kpi) => {
                const bad = kpi.id === 'overdue';
                const good = !bad;
                return (
                  <article
                    key={kpi.id}
                    className="panel panel-hover group p-4"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-[11px] text-zinc-500">{kpi.label}</p>
                      {kpi.id === 'mrr' && (
                        <TrendingUp className="size-3.5 text-brand-400/70" />
                      )}
                    </div>
                    <p className="mt-3 font-mono text-[26px] leading-none tracking-tight text-white">
                      {kpi.format === 'currency'
                        ? usd(kpi.value)
                        : num(kpi.value)}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      {kpi.trend === 'flat' ? (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                          Live
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] ${
                            good
                              ? 'bg-mint-500/10 text-mint-400'
                              : 'bg-ember-500/10 text-ember-400'
                          }`}
                        >
                          {kpi.trend === 'up' ? (
                            <ArrowUpRight className="size-3" />
                          ) : (
                            <ArrowDownRight className="size-3" />
                          )}
                          {percent(kpi.delta)}
                        </span>
                      )}
                      <span className="truncate text-[10px] text-zinc-600">
                        {kpi.deltaLabel}
                      </span>
                    </div>
                    <p className="mt-3 border-t border-white/6 pt-2.5 text-[10px] leading-relaxed text-zinc-600">
                      {kpi.hint}
                    </p>
                  </article>
                );
              })
            : Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[156px] animate-pulse rounded-2xl border border-white/6 bg-white/[0.02]"
                />
              ))}
        </div>

        <div id="revenue" className="mt-4 grid scroll-mt-24 gap-4 lg:grid-cols-5">
          <section className="panel p-5 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">
                  Recurring revenue
                </h2>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  Current recurring revenue and collected payments
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg text-white">
                  {data ? usd(data.kpis[0].value) : '—'}
                </p>
                <p className="font-mono text-[10px] text-zinc-500">
                  Live billing data
                </p>
              </div>
            </div>
            <div className="mt-5">
              {data ? (
                <RevenueChart data={data.revenue} />
              ) : (
                <div className="h-[240px] animate-pulse rounded-lg bg-white/[0.02]" />
              )}
            </div>
          </section>

          <section className="panel p-5 lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">Plan mix</h2>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  Share of monthly recurring revenue
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  push({
                    tone: 'info',
                    title: 'Plan breakdown',
                    description:
                      'Plan distribution is calculated from active subscriptions and their configured recurring prices.',
                  })
                }
                className="rounded-md p-1 text-zinc-600 transition hover:bg-white/5 hover:text-zinc-300"
                aria-label="Plan breakdown details"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div className="relative size-28 shrink-0">
                <div
                  className="size-full rounded-full"
                  style={{
                    background: data
                      ? planMixGradient(data.planMix)
                      : '#ffffff10',
                    mask: 'radial-gradient(circle, transparent 55%, black 56%)',
                    WebkitMask:
                      'radial-gradient(circle, transparent 55%, black 56%)',
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-[9px] tracking-wider text-zinc-600 uppercase">
                    MRR
                  </span>
                  <span className="font-mono text-[13px] text-zinc-100">
                    {data ? usd(data.kpis[0].value, { compact: true }) : '—'}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2.5">
                {data?.planMix.map((plan) => (
                  <div key={plan.name}>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="flex min-w-0 items-center gap-1.5 text-zinc-400">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: plan.color }}
                        />
                        <span className="truncate">{plan.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-zinc-300">
                        {plan.share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${plan.share}%`, background: plan.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/8 pt-4">
              {data?.planMix.map((plan) => (
                <div key={plan.name}>
                  <p className="font-mono text-[13px] text-zinc-200">
                    {num(plan.accounts)}
                  </p>
                  <p className="truncate text-[10px] text-zinc-600">
                    {plan.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <section id="receivables" className="panel scroll-mt-24 p-5 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">
                  Receivables aging
                </h2>
                <p className="mt-0.5 text-[11px] text-zinc-600">
                  Outstanding balances by days past due
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg text-white">
                  {totals ? usd(totals.outstanding) : '—'}
                </p>
                <p className="font-mono text-[10px] text-zinc-600">
                  {data?.overdueInvoices.length ?? 0} invoices
                </p>
              </div>
            </div>

            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/5">
              {data?.aging.map((bucket) => (
                <div
                  key={bucket.label}
                  className={`${agingToneClasses[bucket.tone]} h-full transition-all`}
                  style={{
                    width: `${
                      (bucket.amount /
                        data.aging.reduce((s, b) => s + b.amount, 0)) *
                      100
                    }%`,
                  }}
                  title={`${bucket.label}: ${usd(bucket.amount)}`}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {data?.aging.map((bucket) => (
                <div key={bucket.label}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-1.5 rounded-full ${agingToneClasses[bucket.tone]}`}
                    />
                    <p className="text-[10px] text-zinc-500">{bucket.label}</p>
                  </div>
                  <p className="mt-1.5 font-mono text-[15px] text-zinc-100">
                    {usd(bucket.amount)}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {bucket.invoices} invoices
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/8 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">Invoice collection rate</span>
                <span className="font-mono text-zinc-200">
                  {totals ? `${totals.collectedPct}%` : '—'}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-mint-400 transition-all duration-700"
                  style={{ width: `${totals?.collectedPct ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-zinc-600">
                {data
                  ? `${usd(data.kpis[3].value)} collected against ${usd(data.billedTotal)} invoiced.`
                  : 'Calculating…'}
              </p>
            </div>
          </section>

          <section className="panel flex flex-col p-5 lg:col-span-2">
            <h2 className="text-sm font-medium text-zinc-200">Next 30 days</h2>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              Renewals and automated charges
            </p>

            <div className="mt-5 space-y-3">
              {[
                { label: 'Renewals due', value: data ? String(data.renewalsNext30Days) : '—', note: data ? `${usd(data.renewalValueNext30Days)} contracted` : 'Loading from billing records' },
                { label: 'Overdue invoices', value: data ? String(data.overdueInvoiceCount) : '—', note: data ? usd(data.kpis.find((kpi) => kpi.id === 'overdue')?.value ?? 0) : 'Loading from billing records' },
                { label: 'Active customers', value: data ? String(data.kpis.find((kpi) => kpi.id === 'active')?.value ?? 0) : '—', note: 'Currently active subscriptions' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 border-b border-white/6 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-[12px] text-zinc-300">{row.label}</p>
                    <p className="text-[10px] text-zinc-600">{row.note}</p>
                  </div>
                  <p className="font-mono text-sm text-zinc-100">{row.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <button
                type="button"
                onClick={open}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500/15 px-3 py-2 text-[11px] text-brand-200 transition hover:bg-brand-500/25"
              >
                <Sparkles className="size-3.5" /> Spend audit
              </button>
              <button
                type="button"
                onClick={() =>
                  push({
                    tone: 'info',
                    title: 'Renewal notices are not configured',
                    description: 'Review upcoming renewals with Smart Insights; automated email delivery is not enabled.',
                  })
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-[11px] text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Preview notices
              </button>
            </div>
          </section>
        </div>

        <section className="panel mt-4 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/8 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Overdue chase queue
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-600">
                Oldest balances first · every reminder is audited
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer or invoice"
                  aria-label="Search overdue invoices"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] py-1.5 pr-2.5 pl-8 text-[11px] text-zinc-300 outline-none transition placeholder:text-zinc-600 focus:border-brand-500/50 sm:w-52"
                />
              </div>
              <button
                type="button"
                onClick={() => void notifyAll()}
                disabled={sending !== null || !data || !data.overdueInvoices.some((invoice) => invoice.daysOverdue > 0 && !notified.includes(invoice.id))}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                {sending === 'all' ? (
                  <Sparkles className="size-3.5 animate-pulse" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send all
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 border-b border-white/8 px-5 py-2.5">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatus(filter.id)}
                aria-pressed={status === filter.id}
                className={`rounded-md px-2.5 py-1 text-[10px] transition ${
                  status === filter.id
                    ? 'bg-white/10 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
            <span className="ml-auto font-mono text-[10px] text-zinc-600">
              {invoices.length} shown
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-white/6 text-[9px] tracking-[0.12em] text-zinc-600 uppercase">
                  <th className="px-5 py-2.5 font-medium">Invoice</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 font-medium">Due</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {!data &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-white/[0.03]" />
                      </td>
                    </tr>
                  ))}

                {invoices.map((invoice) => {
                  const isNotified = notified.includes(invoice.id);
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-[11px] text-zinc-300">
                          {invoice.id}
                        </p>
                        <p className="mt-0.5 text-[10px] text-zinc-600">
                          {invoice.plan}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-white/6 font-mono text-[9px] text-zinc-400">
                            {invoice.initials}
                          </span>
                          <span className="text-[12px] text-zinc-300">
                            {invoice.customer}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p
                          className={`font-mono text-[11px] ${
                            invoice.daysOverdue > 60
                              ? 'text-ember-400'
                              : invoice.daysOverdue > 30
                                ? 'text-amber-soft'
                                : 'text-zinc-400'
                          }`}
                        >
                          {invoice.daysOverdue > 0
                            ? `${invoice.daysOverdue}d overdue`
                            : invoice.daysOverdue === 0
                              ? 'Due today'
                              : `Due in ${Math.abs(invoice.daysOverdue)}d`}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[12px] text-zinc-200">
                        {usd(invoice.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] tracking-wider uppercase ${
                            invoice.status === 'overdue'
                              ? 'bg-ember-500/10 text-ember-400'
                              : 'bg-amber-soft/10 text-amber-soft'
                          }`}
                        >
                          {invoice.status === 'overdue' ? 'Overdue' : 'Open'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isNotified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-mint-400">
                            <Check className="size-3" /> Queued
                          </span>
                        ) : invoice.daysOverdue <= 0 ? (
                          <span className="text-[10px] text-zinc-600">Not due</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void notify(invoice)}
                            disabled={sending === invoice.id}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:border-brand-400/40 hover:text-brand-200 disabled:opacity-40"
                          >
                            {sending === invoice.id ? (
                              <Sparkles className="size-3 animate-pulse" />
                            ) : (
                              <Send className="size-3" />
                            )}
                            Send notice
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {data && invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <p className="text-[12px] text-zinc-400">
                        Nothing matches that filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          setStatus('all');
                        }}
                        className="mt-1 text-[11px] text-brand-300 hover:text-brand-200"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/8 px-5 py-3">
            <p className="text-[10px] text-zinc-600">
              Amounts in USD · taxes calculated per order rules
            </p>
            <p className="font-mono text-[10px] text-zinc-600">
              Updated{' '}
              {data
                ? new Date(data.asOf).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}{' '}
              · {data?.kpis.find((kpi) => kpi.id === 'active')?.value ?? 0} subscriptions indexed
            </p>
          </div>
        </section>

        <p className="mt-5 text-center font-mono text-[9px] tracking-[0.18em] text-zinc-700 uppercase">
          Finance metrics are calculated from the live billing database
        </p>
      </div>
    </AppShell>
  );
}

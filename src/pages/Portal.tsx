import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  Check,
  CreditCard,
  Download,
  FileText,
  Loader2,
  PauseCircle,
  PlayCircle,
  ReceiptText,
  Sparkles,
  Users,
} from 'lucide-react';
import { AppShell } from '../components/app/AppShell';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../components/ui/Toast';
import { api, type PortalData } from '../lib/api';
import type { BillingRunResult } from '../lib/data';
import { dateShort, usd } from '../lib/format';

export default function Portal() {
  const { push } = useToast();
  const [data, setData] = useState<PortalData | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BillingRunResult | null>(null);
  const [pausedNotice, setPausedNotice] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.getPortal()
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((error: unknown) => {
        if (alive) setLoadError(error instanceof Error ? error.message : 'Portal data could not be loaded.');
      });
    return () => {
      alive = false;
    };
  }, []);

  const runBilling = async () => {
    setRunning(true);
    setResult(null);
    try {
      if (!data) return;
      const run = await api.runBillingDay(data.customer.id);
      setResult(run);
      setData(await api.getPortal(data.customer.id));
      push({
        tone: run.invoicesCreated ? 'success' : 'info',
        title: run.invoicesCreated ? `${run.invoicesCreated} invoices generated` : 'No new invoices generated',
        description: `${usd(run.totalBilled)} billed · ${run.skippedDuplicates} duplicate billing attempts skipped.`,
      });
    } catch (error) {
      push({
        tone: 'error',
        title: 'Billing run failed',
        description: error instanceof Error ? error.message : 'The billing service did not complete the run.',
      });
    } finally {
      setRunning(false);
    }
  };

  const payInvoice = async (invoiceId: string) => {
    if (!data) return;
    setPaying(invoiceId);
    try {
      await api.payInvoice(invoiceId);
      setData(await api.getPortal(data.customer.id));
      push({ tone: 'success', title: 'Payment recorded', description: `${invoiceId} is now updated in the billing account.` });
    } catch (error) {
      push({
        tone: 'error',
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'The billing service did not record the payment.',
      });
    } finally {
      setPaying(null);
    }
  };

  const downloadStatement = () => {
    if (!data) return;
    const rows = [
      ['Invoice', 'Billing period', 'Issued', 'Amount', 'Status'],
      ...data.invoices.map((invoice) => [
        invoice.id,
        invoice.period,
        invoice.issued,
        String(invoice.amount),
        invoice.status,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${data.customer.id}-statement.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    push({ tone: 'success', title: 'Statement downloaded', description: 'Invoice history exported as CSV.' });
  };

  const activeCount = data?.plans.filter((p) => p.status === 'active').length ?? 0;
  const seats = data?.plans.reduce((sum, p) => sum + p.seats, 0) ?? 0;
  const nextCharge = data?.invoices.find((i) => i.status === 'due' || i.status === 'overdue');
  const pausedPlan = data?.plans.find((plan) => plan.status === 'paused');

  const customerName = data?.customer.company || data?.customer.name || 'Customer account';

  return (
    <AppShell title="Customer portal" subtitle={data ? `${customerName} · ${data.customer.id}` : 'Loading customer account'}>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Customer portal · self-serve</p>
          <h1 className="mt-2.5 text-2xl font-medium tracking-[-0.03em] text-white sm:text-[28px]">
            {customerName}
          </h1>
          <p className="mt-1.5 max-w-md text-[13px] text-zinc-500">
            Your plans, invoices and renewals. No emails required.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void runBilling()}
          disabled={running || !data}
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-[12px] font-medium text-[#0b0b0e] transition hover:bg-white disabled:opacity-60"
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating invoices…
            </>
          ) : (
            <>
              <FileText className="size-4" />
              Generate Invoices (Billing Day)
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
      </div>

      {loadError && (
        <Alert tone="error" title="Portal data unavailable" className="mt-6">
          {loadError} Confirm the billing API is running on port 5000, then refresh.
        </Alert>
      )}

      {pausedNotice && pausedPlan && (
        <Alert
          tone="warning"
          title={`${pausedPlan.product} is not active`}
          className="mt-6"
          onDismiss={() => setPausedNotice(false)}
          action={
            <>
              <button
                type="button"
                onClick={() => {
                  setPausedNotice(false);
                  push({
                    tone: 'info',
                    title: 'Contact your account administrator',
                    description: 'Plan changes are not currently available from this portal.',
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-soft/40 bg-amber-soft/10 px-3 py-1.5 text-[11px] text-amber-soft transition hover:bg-amber-soft/20"
              >
                <PlayCircle className="size-3.5" /> Ask about this plan
              </button>
              <button
                type="button"
                onClick={() => setPausedNotice(false)}
                className="rounded-md px-3 py-1.5 text-[11px] text-amber-soft/70 transition hover:text-amber-soft"
              >
                Keep paused
              </button>
            </>
          }
        >
          This subscription is not included in billing runs. Contact your account administrator if you need to change its status.
        </Alert>
      )}

      {result && (
        <div className="panel mt-6 overflow-hidden border-mint-500/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-mint-500/[0.05] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-mint-500/15 text-mint-400">
                <Check className="size-4" strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-[13px] font-medium text-zinc-100">
                  Billing day complete
                </p>
                <p className="font-mono text-[10px] text-zinc-500">
                  {result.runId} · tax calculated from admin rules
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-400 transition hover:text-zinc-200"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-2 divide-white/8 sm:grid-cols-4 sm:divide-x">
            {[
              ['Invoices created', String(result.invoicesCreated)],
              ['Total billed', usd(result.totalBilled)],
              ['Tax collected', usd(result.taxCollected)],
              ['Duplicates skipped', String(result.skippedDuplicates)],
            ].map(([label, value]) => (
              <div key={label} className="px-5 py-4">
                <p className="text-[10px] text-zinc-600">{label}</p>
                <p className="mt-1 font-mono text-[15px] text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Next payment',
            value: nextCharge ? usd(nextCharge.amount) : usd(16_720),
            hint: nextCharge ? `${nextCharge.period} · due now` : 'No balance due',
            icon: CreditCard,
          },
          {
            label: 'Active plans',
            value: data ? `${activeCount} of ${data.plans.length}` : '—',
            hint: `${data?.plans.filter((p) => p.status !== 'active').length ?? 0} inactive or trial plans`,
            icon: ReceiptText,
          },
          {
            label: 'Assigned seats',
            value: data ? String(seats) : '—',
            hint: 'Usage visible to your admin',
            icon: Users,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="panel panel-hover p-4">
              <div className="flex items-start justify-between">
                <p className="text-[11px] text-zinc-500">{card.label}</p>
                <Icon className="size-3.5 text-brand-400/70" />
              </div>
              <p className="mt-3 font-mono text-[22px] leading-none text-white">
                {card.value}
              </p>
              <p className="mt-2 text-[10px] text-zinc-600">{card.hint}</p>
            </div>
          );
        })}
      </div>

      <section className="panel mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Active plans</h2>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              Billed automatically on each anniversary
            </p>
          </div>
          <span className="rounded-full border border-white/8 px-2.5 py-1 font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
            {data ? `${data.plans.length} contracts` : 'loading'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-white/6 text-[9px] tracking-[0.12em] text-zinc-600 uppercase">
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Billing</th>
                <th className="px-4 py-2.5 text-right font-medium">Seats</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                <th className="px-4 py-2.5 font-medium">Renews</th>
                <th className="px-4 py-2.5 font-medium">Usage</th>
                <th className="px-5 py-2.5 text-right font-medium">Manage</th>
              </tr>
            </thead>
            <tbody>
              {!data &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 animate-pulse rounded bg-white/[0.03]" />
                    </td>
                  </tr>
                ))}

              {data?.plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4">
                    <p className="text-[12px] text-zinc-200">{plan.product}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      {plan.variant} · {plan.id}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <CalendarClock className="size-3.5 text-zinc-600" />
                      {plan.frequency}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-[11px] text-zinc-300">
                    {plan.seats}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-[11px] text-zinc-200">
                    {usd(plan.price)}
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-zinc-400">
                    {dateShort(plan.renewsOn)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-14 overflow-hidden rounded-full bg-white/8">
                        <div
                          className={`h-full rounded-full ${
                            plan.usage > 70
                              ? 'bg-mint-400'
                              : plan.usage > 40
                                ? 'bg-amber-soft'
                                : 'bg-ember-400'
                          }`}
                          style={{ width: `${plan.usage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {plan.usage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] tracking-wider uppercase ${
                          plan.status === 'active'
                            ? 'bg-mint-500/10 text-mint-400'
                            : 'bg-amber-soft/10 text-amber-soft'
                        }`}
                      >
                        {plan.status}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          push({
                            tone: 'info',
                            title: `${plan.product} · plan settings`,
                            description:
                              'Upgrade, pause and cancellation requests route to your account admin.',
                          })
                        }
                        className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Invoices</h2>
            <p className="mt-0.5 text-[11px] text-zinc-600">
              Receipts are print-ready and stamped on settlement
            </p>
          </div>
          <button
            type="button"
            onClick={downloadStatement}
            disabled={!data}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
          >
            <Download className="size-3" /> Download statement
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {data?.invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.02] text-zinc-500">
                  <ReceiptText className="size-3.5" />
                </span>
                <div>
                  <p className="font-mono text-[11px] text-zinc-300">
                    {invoice.id}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {invoice.period} · issued {dateShort(invoice.issued)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[12px] text-zinc-200">
                  {usd(invoice.amount)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] tracking-wider uppercase ${
                    invoice.status === 'paid'
                      ? 'bg-mint-500/10 text-mint-400'
                      : invoice.status === 'due'
                        ? 'bg-amber-soft/10 text-amber-soft'
                        : invoice.status === 'overdue'
                          ? 'bg-ember-500/10 text-ember-400'
                        : 'bg-white/5 text-zinc-500'
                  }`}
                >
                  {invoice.status}
                </span>
                {invoice.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => void payInvoice(invoice.id)}
                    disabled={paying !== null}
                    className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-300 transition hover:border-mint-500/40 hover:text-mint-300 disabled:opacity-50"
                  >
                    {paying === invoice.id ? 'Processing…' : 'Pay now'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {!data &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-4 animate-pulse rounded bg-white/[0.03]" />
              </div>
            ))}
        </div>
      </section>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-white/10 px-5 py-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-300" />
          <p className="max-w-xl text-[11px] leading-relaxed text-zinc-500">
            Billing runs are idempotent: each invoice is keyed by subscription
            and period, so re-running the day never double-bills. Taxes come
            from admin rules, not this page.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            push({
              tone: 'info',
              title: 'Contact your account administrator',
              description: 'Cancellation requests are not submitted from this demo portal.',
            })
          }
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-400 transition hover:border-ember-500/40 hover:text-ember-400"
        >
          <PauseCircle className="size-3" /> Request plan change
        </button>
      </div>
    </AppShell>
  );
}

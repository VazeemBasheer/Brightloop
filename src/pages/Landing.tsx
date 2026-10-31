import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CreditCard,
  FileCheck2,
  Landmark,
  Percent,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { LandingNav } from '../components/landing/LandingNav';
import { Hero } from '../components/landing/Hero';
import { ScrollLifecycle } from '../components/landing/ScrollLifecycle';
import { Brand } from '../components/Brand';
import { usd } from '../lib/format';

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const metrics = [
  { value: '1,248', label: 'subscriptions, one source of truth' },
  { value: '$5.83M', label: 'ARR modelled, not guessed' },
  { value: '<2s', label: 'month-end load, every page' },
  { value: '4', label: 'renewal windows, always sent' },
];

const personas = [
  {
    index: '01',
    role: 'Finance leads',
    access: 'Full access',
    icon: Wallet,
    title: 'Month-end that answers itself.',
    copy: 'MRR, ARR, collections and AR aging on one screen. Filter 1,200 subscriptions and still get an answer before your coffee lands.',
    points: ['Live MRR & AR aging', 'Overdue chase queue', 'Export-ready summaries'],
  },
  {
    index: '02',
    role: 'Billing & ops',
    access: 'Scoped access',
    icon: RefreshCw,
    title: 'Billing day without the panic.',
    copy: 'Quotes convert to active contracts, invoices generate from the plan, taxes and discounts apply on their own. Nobody types an invoice by hand.',
    points: ['One-click billing run', 'Duplicate-proof periods', 'Renewal notices at 14/7/3/1'],
  },
  {
    index: '03',
    role: 'Your customers',
    access: 'Self-serve',
    icon: Users,
    title: 'A portal that ends the email chain.',
    copy: 'Customers see their plans, usage and invoices, and can pause or upgrade without a support ticket. Access is scoped to their account only.',
    points: ['Active plans & receipts', 'Upgrade / pause requests', 'Invoice history'],
  },
];

const pillars = [
  {
    title: 'Discounts that end on time',
    copy: 'Fixed or percentage rules with usage caps, minimum spend and expiry dates — applied to the next invoice automatically.',
    icon: Percent,
  },
  {
    title: 'Payments that reconcile',
    copy: 'Card, ACH, wire and bank transfer recorded against the right invoice, with retries and receipts.',
    icon: CreditCard,
  },
  {
    title: 'Roles that hold the line',
    copy: 'Admins configure. Staff fulfil. Customers see only themselves. Enforced at the data layer.',
    icon: ShieldCheck,
  },
];

const insights = [
  {
    tone: 'risk' as const,
    title: 'Duplicate collaboration tools',
    vendor: 'Notion + Confluence',
    savings: 12_480,
  },
  {
    tone: 'opportunity' as const,
    title: 'Unassigned Slack seats',
    vendor: '30 of 240 provisioned',
    savings: 8_640,
  },
  {
    tone: 'risk' as const,
    title: 'Zombie subscription',
    vendor: 'Loom · 63 days idle',
    savings: 6_120,
  },
];

export default function Landing() {
  return (
    <div className="grain relative min-h-screen overflow-x-hidden bg-[#08080a] text-zinc-300">
      <LandingNav />

      <main>
        <Hero />

        <div className="border-y border-white/8 bg-[#0a0a0d]">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-5 sm:px-8 lg:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="px-2 py-7 sm:px-6">
                <p className="font-mono text-xl text-zinc-100 sm:text-2xl">
                  {m.value}
                </p>
                <p className="mt-2 max-w-40 text-[11px] leading-snug text-zinc-500">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section id="platform" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal>
            <p className="eyebrow">Who it's for</p>
            <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <h2 className="max-w-xl text-3xl font-medium text-balance sm:text-4xl">
                One system. Three very different{' '}
                <span className="font-serif italic text-brand-200">days.</span>
              </h2>
              <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                Brightloop is built around the roles that actually touch
                subscriptions — not a generic admin panel.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {personas.map((persona, i) => {
              const Icon = persona.icon;
              return (
                <Reveal key={persona.role} delay={i * 0.08}>
                  <article className="panel panel-hover group relative flex h-full flex-col overflow-hidden p-6">
                    <div className="absolute -top-16 -right-16 size-40 rounded-full bg-brand-500/5 blur-2xl transition-opacity duration-500 group-hover:bg-brand-500/10" />
                    <div className="flex items-start justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-brand-300">
                        <Icon className="size-[18px]" strokeWidth={1.6} />
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.16em] text-zinc-600 uppercase">
                        {persona.index}
                      </span>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <h3 className="text-[15px] font-medium text-zinc-100">
                        {persona.role}
                      </h3>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
                        {persona.access}
                      </span>
                    </div>
                    <p className="mt-2 text-lg leading-snug text-zinc-200">
                      {persona.title}
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
                      {persona.copy}
                    </p>
                    <ul className="mt-6 space-y-2 border-t border-white/8 pt-5">
                      {persona.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-center gap-2 text-xs text-zinc-400"
                        >
                          <Check className="size-3.5 text-mint-400" strokeWidth={2} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section id="product" className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8 sm:pb-32">
          <Reveal>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">The platform</p>
                <h2 className="mt-3 max-w-lg text-3xl font-medium text-balance sm:text-4xl">
                  The boring parts, made{' '}
                  <span className="font-serif italic text-brand-200">invisible.</span>
                </h2>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
                Every workflow below ships with an audit trail, because finance
                teams get asked "why" more often than "what".
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 lg:grid-cols-6">
            <Reveal className="lg:col-span-3" delay={0.04}>
              <article className="panel panel-hover flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-brand-300">
                    <Zap className="size-4" strokeWidth={1.7} />
                  </span>
                  <span className="rounded-full border border-mint-500/30 bg-mint-500/10 px-2.5 py-1 font-mono text-[9px] tracking-wider text-mint-400 uppercase">
                    Automated
                  </span>
                </div>
                <h3 className="mt-5 text-lg text-zinc-100">Billing day, in one click</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                  Every due subscription becomes an invoice with taxes, discounts
                  and line items filled in. Period hashes stop double-billing.
                </p>
                <div className="mt-6 space-y-2 rounded-xl border border-white/8 bg-black/30 p-3">
                  {[
                    ['Northwind Retail', 'Platinum · Yearly', '$12,480', 'Generated'],
                    ['Halcyon Labs', 'Enterprise · Monthly', '$8,900', 'Generated'],
                    ['Aster & Co.', 'Storage add-on', '$640', 'Skipped'],
                  ].map(([name, plan, amount, status]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[11px] transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-zinc-300">{name}</p>
                        <p className="truncate font-mono text-[10px] text-zinc-600">
                          {plan}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-400">{amount}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[9px] ${
                            status === 'Skipped'
                              ? 'bg-white/5 text-zinc-500'
                              : 'bg-mint-500/10 text-mint-400'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-zinc-600">
                  <span>Run #1042 · 412 invoices</span>
                  <span>0 duplicates</span>
                </div>
              </article>
            </Reveal>

            <Reveal className="lg:col-span-3" delay={0.08}>
              <article className="panel panel-hover flex h-full flex-col p-6">
                <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-brand-300">
                  <FileCheck2 className="size-4" strokeWidth={1.7} />
                </span>
                <h3 className="mt-5 text-lg text-zinc-100">Renewals nobody has to remember</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                  Four reminders, escalating dunning, and an open log. If a card
                  fails on the renewal date, the chase starts on its own.
                </p>
                <div className="mt-6 grid grid-cols-4 gap-2">
                  {[
                    ['14d', 'Heads up'],
                    ['7d', 'Review invoice'],
                    ['3d', 'Confirm charge'],
                    ['Day 0', 'Receipt'],
                  ].map(([when, what], index) => (
                    <div key={when} className="relative rounded-lg border border-white/8 bg-black/25 p-3">
                      <div
                        className={`mb-2 h-0.5 w-full rounded-full ${
                          index === 3 ? 'bg-brand-400' : 'bg-white/15'
                        }`}
                      />
                      <p className="font-mono text-[11px] text-zinc-200">{when}</p>
                      <p className="mt-1 text-[10px] leading-tight text-zinc-500">
                        {what}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-auto pt-5 font-mono text-[10px] text-zinc-600">
                  23 renewals due in the next 30 days
                </p>
              </article>
            </Reveal>

            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <Reveal key={pillar.title} className="lg:col-span-2" delay={0.04 * i}>
                  <article className="panel panel-hover flex h-full flex-col p-6">
                    <span className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-brand-300">
                      <Icon className="size-4" strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-5 text-[15px] font-medium text-zinc-100">
                      {pillar.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">
                      {pillar.copy}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <ScrollLifecycle />

        <section id="insights" className="relative border-y border-white/8 bg-[#0a0a0d]">
          <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="eyebrow">Smart insights</p>
              <h2 className="mt-3 text-3xl font-medium text-balance sm:text-4xl">
                An AI that reads your invoices, not your{' '}
                <span className="font-serif italic text-brand-200">vibes.</span>
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
                Every billing run, Gemini audits the portfolio for duplicate
                tools, unused seats and monthly plans that should be annual.
                Each finding arrives with a dollar figure and a drafted letter.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  ['Duplicate tooling', 'Overlapping stacks across teams'],
                  ['Zombie subscriptions', 'Zero logins, still renewing'],
                  ['Seat wastage', 'Provisioned but never assigned'],
                  ['Annual savings', 'Monthly terms with better yearly pricing'],
                ].map(([title, detail]) => (
                  <li key={title} className="flex gap-3">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-300" strokeWidth={1.6} />
                    <div>
                      <p className="text-[13px] font-medium text-zinc-200">{title}</p>
                      <p className="text-xs text-zinc-500">{detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/app"
                className="group mt-9 inline-flex items-center gap-2 text-sm text-brand-200 transition-colors hover:text-brand-100"
              >
                Open the live drawer
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="panel relative overflow-hidden p-1.5">
                <div className="rounded-[13px] border border-white/8 bg-[#0b0b10] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint-400/60" />
                        <span className="relative inline-flex size-2 rounded-full bg-mint-400" />
                      </span>
                      <p className="text-xs font-medium text-zinc-200">Smart insights</p>
                    </div>
                    <span className="font-mono text-[9px] tracking-wider text-zinc-600 uppercase">
                      gemini-3.8-flash
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/12 to-transparent p-4">
                    <p className="font-mono text-[9px] tracking-[0.16em] text-brand-300 uppercase">
                      Annual savings found
                    </p>
                    <p className="mt-1 font-mono text-3xl text-white">
                      {usd(31_560)}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Across 4 findings · 1,248 subscriptions audited
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {insights.map((insight) => (
                      <div
                        key={insight.title}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/12"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${
                              insight.tone === 'risk' ? 'bg-ember-400' : 'bg-mint-400'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[12px] text-zinc-200">
                              {insight.title}
                            </p>
                            <p className="truncate text-[10px] text-zinc-500">
                              {insight.vendor}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-mint-400">
                          +{usd(insight.savings, { compact: true })}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/8 px-3 py-2.5">
                    <span className="font-mono text-[10px] text-zinc-600">›</span>
                    <span className="text-[11px] text-zinc-500">
                      Which renewal should I cancel first?
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 py-28 text-center sm:px-8 sm:py-36">
            <Reveal>
              <p className="eyebrow">Start quietly</p>
              <h2 className="mx-auto mt-5 max-w-2xl text-4xl leading-[1.05] font-medium text-balance sm:text-5xl">
                Give your month-end{' '}
                <span className="font-serif italic text-brand-200">back.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-400">
                Bring 1,000 subscriptions or 10. Brightloop is priced on active
                contracts, never on the number of people who need to look at
                them.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-3 text-sm font-medium text-[#0b0b0e] transition-colors hover:bg-white"
                >
                  Create an account
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
                >
                  Sign in
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <Brand />
              <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                Subscription management and spend optimisation for teams who'd
                rather not discuss invoices twice.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-600 uppercase">
                  Product
                </p>
                <ul className="mt-3 space-y-2 text-xs text-zinc-400">
                  <li><a className="hover:text-zinc-100" href="#product">Billing day</a></li>
                  <li><a className="hover:text-zinc-100" href="#lifecycle">Lifecycle</a></li>
                  <li><a className="hover:text-zinc-100" href="#insights">Insights</a></li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-600 uppercase">
                  Workspace
                </p>
                <ul className="mt-3 space-y-2 text-xs text-zinc-400">
                  <li><Link className="hover:text-zinc-100" to="/app">Dashboard</Link></li>
                  <li><Link className="hover:text-zinc-100" to="/app/portal">Customer portal</Link></li>
                  <li><Link className="hover:text-zinc-100" to="/login">Sign in</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-600 uppercase">
                  Company
                </p>
                <ul className="mt-3 space-y-2 text-xs text-zinc-400">
                  <li><a className="hover:text-zinc-100" href="#platform">Who it's for</a></li>
                  <li><Link className="hover:text-zinc-100" to="/signup">Get started</Link></li>
                  <li><Link className="hover:text-zinc-100" to="/404-demo">404</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t border-white/8 pt-6 sm:flex-row">
            <p className="font-mono text-[10px] text-zinc-600">
              © 2026 Brightloop Software
            </p>
            <p className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
              <Building2 className="size-3" /> Built for recurring business
              <Landmark className="ml-3 size-3" />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  LayoutDashboard,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Users,
  X,
  Menu,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Brand } from '../Brand';
import { useAssistant } from './AssistantContext';
import { useToast } from '../ui/Toast';

const navItems = [
  { label: 'Overview', to: '/app', hash: '', icon: LayoutDashboard },
  { label: 'Revenue', to: '/app#revenue', hash: '#revenue', icon: TrendingUp },
  { label: 'Receivables', to: '/app#receivables', hash: '#receivables', icon: ReceiptText },
  { label: 'Customer portal', to: '/app/portal', hash: '', icon: Users },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { open } = useAssistant();
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Brand />
      </div>

      <div className="px-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-2.5 text-left transition hover:border-white/14 hover:bg-white/[0.04]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-semibold text-white">
            AC
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-zinc-200">
              Aster &amp; Co.
            </span>
            <span className="block truncate text-[10px] text-zinc-500">
              Finance workspace
            </span>
          </span>
          <ChevronDown className="size-3.5 text-zinc-600" />
        </button>
      </div>

      <nav className="mt-6 flex-1 px-3" aria-label="Workspace">
        <p className="px-2 font-mono text-[9px] tracking-[0.18em] text-zinc-600 uppercase">
          Workspace
        </p>
        <ul className="mt-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to === '/app/portal'
                ? location.pathname === '/app/portal'
                : location.pathname === '/app' &&
                  (location.hash === item.hash ||
                    (!location.hash && item.hash === ''));
            return (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition ${
                    active
                      ? 'bg-white/[0.06] text-zinc-100'
                      : 'text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-200'
                  }`}
                >
                  <Icon
                    className={`size-4 ${active ? 'text-brand-300' : 'text-zinc-600'}`}
                    strokeWidth={1.7}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto size-1 rounded-full bg-brand-400" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <p className="mt-7 px-2 font-mono text-[9px] tracking-[0.18em] text-zinc-600 uppercase">
          Assistant
        </p>
        <button
          type="button"
          onClick={() => {
            open();
            onNavigate?.();
          }}
          className="group mt-2 w-full rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-transparent p-3 text-left transition hover:border-brand-400/40"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-brand-300" />
            <span className="text-[12px] text-zinc-200">Smart insights</span>
            <ArrowUpRight className="ml-auto size-3.5 text-zinc-600 transition group-hover:text-brand-300" />
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-500">
            4 findings · $31,560 a year in recoverable spend
          </p>
        </button>
      </nav>

      <div className="border-t border-white/8 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
          <span className="relative flex size-7 items-center justify-center rounded-full bg-white/8 text-[10px] font-medium text-zinc-300">
            MC
            <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-[#0a0a0d] bg-mint-400" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-zinc-300">Maya Chen</p>
            <p className="truncate text-[10px] text-zinc-600">Finance lead</p>
          </div>
          <Link
            to="/login"
            className="rounded-md px-2 py-1 text-[10px] text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}

interface AppShellProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open } = useAssistant();
  const { push } = useToast();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    setMobileOpen(false);
  }, [title]);

  return (
    <div className="grain min-h-screen bg-[#08080a]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-white/8 bg-[#0a0a0d] lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-white/8 bg-[#0a0a0d] lg:hidden"
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="absolute top-4 right-3 rounded-md p-1.5 text-zinc-500 hover:bg-white/5"
              >
                <X className="size-4" />
              </button>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/8 bg-[#08080a]/85 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-zinc-200">{title}</p>
            <p className="hidden truncate text-[10px] text-zinc-600 sm:block">
              {subtitle}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1.5 font-mono text-[9px] tracking-wider text-zinc-500 uppercase sm:inline-flex">
              <span className="size-1.5 rounded-full bg-mint-400" />
              Ledger live
            </span>
            <button
              type="button"
              onClick={() =>
                push({
                  tone: 'info',
                  title: 'You are all caught up',
                  description: '3 notifications were cleared by the last billing run.',
                })
              }
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-ember-400" />
            </button>
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1.5 text-[11px] text-brand-200 transition hover:border-brand-400/50 hover:bg-brand-500/15"
            >
              <Sparkles className="size-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
              <kbd className="ml-1 hidden rounded border border-white/10 px-1 font-mono text-[9px] text-zinc-500 md:inline">
                ⌘K
              </kbd>
            </button>
            <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-white/8 text-[10px] font-medium text-zinc-300">
              MC
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 sm:py-9">
          {actions && <div className="mb-6">{actions}</div>}
          {children}
        </main>
      </div>
    </div>
  );
}

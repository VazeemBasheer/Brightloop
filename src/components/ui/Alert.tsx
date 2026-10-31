import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Info,
  ShieldAlert,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error' | 'critical';

interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const tones: Record<
  AlertTone,
  { wrapper: string; title: string; body: string; icon: ReactNode }
> = {
  info: {
    wrapper: 'border-brand-500/35 bg-brand-500/[0.07]',
    title: 'text-brand-200',
    body: 'text-brand-200/70',
    icon: <Info className="size-5 text-brand-300" />,
  },
  success: {
    wrapper: 'border-mint-500/35 bg-mint-500/[0.07]',
    title: 'text-mint-400',
    body: 'text-mint-400/70',
    icon: <CheckCircle2 className="size-5 text-mint-400" />,
  },
  warning: {
    wrapper: 'border-amber-soft/35 bg-amber-soft/[0.07]',
    title: 'text-amber-soft',
    body: 'text-amber-soft/70',
    icon: <TriangleAlert className="size-5 text-amber-soft" />,
  },
  error: {
    wrapper: 'border-ember-500/35 bg-ember-500/[0.07]',
    title: 'text-ember-400',
    body: 'text-ember-400/70',
    icon: <XCircle className="size-5 text-ember-400" />,
  },
  critical: {
    wrapper: 'border-ember-500/50 bg-ember-500/10',
    title: 'text-ember-400',
    body: 'text-ember-400/75',
    icon: <ShieldAlert className="size-5 text-ember-400" />,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  className = '',
}: AlertProps) {
  const style = tones[tone];
  return (
    <div
      role={tone === 'critical' || tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 ${style.wrapper} ${className}`}
    >
      <span className="mt-px shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${style.title}`}>{title}</p>
        {children && (
          <div className={`mt-1 text-sm leading-relaxed ${style.body}`}>
            {children}
          </div>
        )}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

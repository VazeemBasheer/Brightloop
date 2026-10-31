import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  push: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<
  ToastTone,
  { icon: ReactNode; ring: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="size-5" />,
    ring: 'border-mint-500/40 bg-mint-500/10',
    iconColor: 'text-mint-400',
  },
  error: {
    icon: <XCircle className="size-5" />,
    ring: 'border-ember-500/40 bg-ember-500/10',
    iconColor: 'text-ember-400',
  },
  warning: {
    icon: <TriangleAlert className="size-5" />,
    ring: 'border-amber-soft/40 bg-amber-soft/10',
    iconColor: 'text-amber-soft',
  },
  info: {
    icon: <Info className="size-5" />,
    ring: 'border-brand-500/40 bg-brand-500/10',
    iconColor: 'text-brand-300',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-3), { ...toast, id }]);
      window.setTimeout(() => remove(id), 5200);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const tone = toneStyles[toast.tone];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`pointer-events-auto w-full rounded-xl border bg-[#0f0f14]/95 p-3.5 shadow-2xl shadow-black/40 backdrop-blur ${tone.ring}`}
              >
                <div className="flex gap-3">
                  <span className={`mt-0.5 ${tone.iconColor}`}>{tone.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {toast.title}
                    </p>
                    {toast.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                        {toast.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(toast.id)}
                    aria-label="Dismiss notification"
                    className="rounded-md p-1 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

import { Check } from 'lucide-react';

interface StepsProps {
  steps: string[];
  current: number;
  className?: string;
}

export function Steps({ steps, current, className = '' }: StepsProps) {
  return (
    <ol aria-label="Progress" className={`flex items-center ${className}`}>
      {steps.map((label, index) => {
        const step = index + 1;
        const done = current > step;
        const active = current === step;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex size-8 flex-none items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                  done
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : active
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-white/12 bg-white/[0.02]'
                }`}
              >
                {done ? (
                  <Check className="size-4" strokeWidth={2.4} />
                ) : active ? (
                  <span className="size-2.5 rounded-full bg-brand-400" />
                ) : (
                  <span className="font-mono text-[10px] text-zinc-600">
                    {step}
                  </span>
                )}
              </div>
              <span
                className={`hidden text-[10px] font-medium whitespace-nowrap sm:block ${
                  active ? 'text-zinc-200' : done ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <hr
                className={`mb-5 w-full border-t transition-colors duration-300 ${
                  done ? 'border-brand-500' : 'border-white/10'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

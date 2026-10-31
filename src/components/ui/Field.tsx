import type { InputHTMLAttributes, ReactNode } from 'react';

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-brand-500/60 focus:bg-white/[0.05] aria-[invalid=true]:border-ember-500/60';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function Field({ label, error, hint, id, className = '', ...props }: FieldProps) {
  const fieldId = id ?? props.name;
  return (
    <div>
      <label htmlFor={fieldId} className="text-[12px] font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={fieldId}
        className={`mt-1.5 ${inputClass} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-[11px] text-ember-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-zinc-600">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={() => onChange(!checked)}
        className={`relative size-4.5 shrink-0 rounded border transition-colors ${
          checked
            ? 'border-brand-500 bg-brand-500'
            : 'border-white/15 bg-white/[0.03] hover:border-white/30'
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 12 12"
            className="absolute inset-0 m-auto size-3 text-white"
            fill="none"
          >
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <span id={`${id}-label`} className="text-xs text-zinc-400">
        {label}
      </span>
    </div>
  );
}

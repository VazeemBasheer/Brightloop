import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { WarpField } from './WarpField';
import { LoopMark } from './Brand';

interface AuthShellProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: AuthShellProps) {
  return (
    <div className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#08080a] px-4 py-14">
      <WarpField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,transparent_22%,#08080a_88%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#08080a] to-transparent" />

      <main className={`relative z-10 w-full ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
        <div className="flex flex-col items-center text-center">
          <Link
            to="/"
            data-auth-logo
            aria-label="Brightloop home"
            className="group flex items-center gap-2.5"
          >
            <LoopMark className="size-8 transition-transform duration-500 group-hover:rotate-180" />
            <span className="text-base font-semibold tracking-[-0.02em] text-zinc-100">
              brightloop
            </span>
          </Link>
          <h1 className="mt-8 text-2xl font-medium text-balance text-white sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{subtitle}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/8 bg-[#0b0b10]/80 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-7">
          {children}
        </div>

        <div className="mt-6 text-center text-xs text-zinc-500">{footer}</div>
      </main>

      <p className="relative z-10 mt-10 font-mono text-[9px] tracking-[0.2em] text-zinc-700 uppercase">
        Recurring revenue, under control
      </p>
    </div>
  );
}

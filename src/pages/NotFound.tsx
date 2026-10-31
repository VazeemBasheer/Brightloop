import { Link } from 'react-router-dom';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { LoopMark } from '../components/Brand';

export default function NotFound() {
  return (
    <main className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#08080a] px-5 text-center">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(520px circle at 50% 45%, rgba(124,109,235,0.12), transparent 70%)',
        }}
      />

      <div className="relative">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5"
          aria-label="Brightloop home"
        >
          <LoopMark className="size-8 transition-transform duration-500 group-hover:rotate-180" />
          <span className="text-sm font-semibold tracking-[-0.02em] text-zinc-200">
            brightloop
          </span>
        </Link>

        <p className="mt-10 font-mono text-[11px] tracking-[0.28em] text-brand-300 uppercase">
          404 · off the ledger
        </p>
        <h1 className="mt-4 font-serif text-7xl leading-none text-white italic sm:text-8xl">
          Page not found
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-zinc-500">
          This page does not exist, has been moved, or the invoice you were
          chasing was already settled.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 text-[12px] font-medium text-[#0b0b0e] transition hover:bg-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to Brightloop
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-[12px] text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            Open dashboard
          </Link>
        </div>

        <p className="mt-10 inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.16em] text-zinc-700 uppercase">
          <LifeBuoy className="size-3" /> Need help? support@brightloop.io
        </p>
      </div>
    </main>
  );
}

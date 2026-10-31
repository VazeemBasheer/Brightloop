import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { GridRipple } from '../GridRipple';

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-20 sm:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]">
          <GridRipple />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(600px circle at 50% 42%, rgba(124,109,235,0.10), transparent 70%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#08080a] to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <motion.a
          href="#insights"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pr-3 pl-1 text-xs text-zinc-400 backdrop-blur transition-colors hover:border-white/20 hover:text-zinc-200"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-brand-200 uppercase">
            <Sparkles className="size-3" />
            New
          </span>
          Spend audits, powered by Gemini
          <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.08, ease }}
          className="mt-7 text-[2.6rem] leading-[1.04] font-medium text-balance text-white sm:text-6xl lg:text-7xl"
        >
          Recurring revenue,
          <br />
          finally{' '}
          <span className="font-serif text-[1.08em] font-normal italic text-brand-200">
            under control.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.18, ease }}
          className="mt-7 max-w-xl text-[15px] leading-relaxed text-pretty text-zinc-400 sm:text-base"
        >
          Brightloop runs plans, billing days, renewals and collections in one
          calm system — then quietly finds the subscriptions draining your
          budget.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.28, ease }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link
            to="/app"
            className="group inline-flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-3 text-sm font-medium text-[#0b0b0e] shadow-[0_0_40px_-12px_rgba(124,109,235,0.7)] transition-all hover:bg-white hover:shadow-[0_0_50px_-8px_rgba(124,109,235,0.6)]"
          >
            Open the dashboard
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#product"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-12 font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase"
        >
          1,248 subscriptions live · 1,200-record month-end in under 2s
        </motion.p>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex">
        <span className="font-mono text-[9px] tracking-[0.24em] text-zinc-600 uppercase">
          Scroll
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <motion.span
            className="absolute inset-x-0 top-0 h-4 bg-brand-400/80"
            animate={{ y: [-16, 40] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
      </div>
    </section>
  );
}

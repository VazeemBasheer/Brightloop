import { useEffect, useRef } from 'react';
import { animate, onScroll } from 'animejs';
import { FileText, Send, CheckCheck, Activity, Archive } from 'lucide-react';

const stages = [
  { label: 'Draft', note: 'Lines & variants', icon: FileText },
  { label: 'Quotation', note: 'Validity window', icon: Send },
  { label: 'Confirmed', note: 'Terms agreed', icon: CheckCheck },
  { label: 'Active', note: 'Billing every cycle', icon: Activity },
  { label: 'Closed', note: 'Paused or expired', icon: Archive },
];

/**
 * The lifecycle rail: a glowing marker travels the quotation FSM as the section
 * scrolls, using the anime.js `onScroll` sync pattern.
 */
export function ScrollLifecycle() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const mark = markRef.current;
    if (!section || !track || !mark) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animation: { revert: () => void } | null = null;

    const build = () => {
      const dots = track.querySelectorAll<HTMLElement>('[data-fsm-dot]');
      if (!dots.length) return;
      const first = dots[0];
      const last = dots[dots.length - 1];
      const start = first.offsetLeft + first.offsetWidth / 2;
      const end = last.offsetLeft + last.offsetWidth / 2;
      const markWidth = mark.offsetWidth;

      animation?.revert();
      animation = animate(mark, {
        x: [start - markWidth / 2, end - markWidth / 2],
        ease: 'linear',
        autoplay: onScroll({
          target: section,
          axis: 'y',
          enter: 'bottom bottom',
          leave: 'top 25%',
        }),
      });
    };

    build();

    const observer = new ResizeObserver(build);
    observer.observe(track);

    return () => {
      observer.disconnect();
      animation?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="lifecycle"
      className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">The lifecycle</p>
          <h2 className="mt-3 max-w-lg text-3xl font-medium text-balance sm:text-4xl">
            From a draft quote to a closed contract, everyone sees{' '}
            <span className="font-serif italic text-brand-200">stage five.</span>
          </h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
          One state machine for every subscription. No status calls, no
          spreadsheet archaeology.
        </p>
      </div>

      <div ref={trackRef} className="relative mt-16">
        <div className="absolute top-3 right-0 left-0 h-px bg-gradient-to-r from-brand-500/50 via-white/15 to-white/5" />
        <div
          ref={markRef}
          aria-hidden
          className="absolute top-0 left-0 size-6 -translate-y-1/2 rounded-full border border-brand-300/70 bg-brand-500/25 shadow-[0_0_30px_6px_rgba(124,109,235,0.35)] backdrop-blur"
        />
        <ol className="relative grid grid-cols-5">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <li key={stage.label} className="flex flex-col items-center text-center">
                <span
                  data-fsm-dot
                  className="size-2.5 rounded-full border border-white/30 bg-[#0b0b0e]"
                />
                <div className="mt-5 flex items-center gap-1.5 text-zinc-600">
                  <Icon className="size-3.5 text-brand-300" strokeWidth={1.6} />
                  <span className="font-mono text-[10px]">0{index + 1}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-200 sm:text-[15px]">
                  {stage.label}
                </p>
                <p className="mt-1 hidden max-w-24 text-xs leading-snug text-zinc-500 sm:block">
                  {stage.note}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

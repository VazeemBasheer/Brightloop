import { useEffect, useRef } from 'react';
import { createAnimatable } from 'animejs';

/**
 * Lagging ring + precise dot cursor, mounted globally.
 *
 * The ring eases toward the pointer with anime.js animatable values while the
 * dot tracks exactly. Under `prefers-reduced-motion` the same cursor is drawn
 * with no lag instead of disappearing, and touch-only devices keep their native
 * pointer because the `cursor-custom` class is only applied for fine pointers.
 */
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const anim = reduced
      ? null
      : createAnimatable(ring, {
          x: 520,
          y: 520,
          scale: 380,
          ease: 'out(3)',
        });

    let visible = false;

    const place = (x: number, y: number) => {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (anim) {
        anim.x(x);
        anim.y(y);
      } else {
        ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const show = () => {
      if (visible) return;
      visible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };

    const hide = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    const onMove = (e: MouseEvent) => {
      place(e.clientX, e.clientY);
      show();
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const interactive = target?.closest(
        'a, button, [role="button"], input, textarea, select, summary, [data-cursor]',
      );
      if (anim) anim.scale(interactive ? 1.7 : 1);
      ring.dataset.hover = interactive ? 'true' : 'false';
    };

    const onDown = () => {
      if (anim) anim.scale(0.82);
    };
    const onUp = () => {
      if (anim) anim.scale(ring.dataset.hover === 'true' ? 1.7 : 1);
    };

    // Start centred so the first movement eases in instead of jumping.
    place(window.innerWidth / 2, window.innerHeight / 2);

    document.documentElement.classList.add('cursor-custom');
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);

    return () => {
      document.documentElement.classList.remove('cursor-custom');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', hide);
      window.removeEventListener('blur', hide);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      <div
        ref={ringRef}
        data-cursor-ring
        style={{ opacity: 0, willChange: 'transform' }}
        className="fixed top-0 left-0 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 transition-[border-color,background-color] duration-300 data-[hover=true]:border-brand-400 data-[hover=true]:bg-brand-500/10"
      />
      <div
        ref={dotRef}
        data-cursor-dot
        style={{ opacity: 0, willChange: 'transform' }}
        className="fixed top-0 left-0 -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-brand-300 shadow-[0_0_12px_2px_rgba(124,109,235,0.55)]"
      />
    </div>
  );
}

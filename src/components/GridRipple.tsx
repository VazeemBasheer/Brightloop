import { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  born: number;
  strength: number;
}

/**
 * The hero's dot grid: each dot is pushed outward by an expanding wavefront.
 * Ripples are emitted from the pointer and, when idle, from the centre so the
 * hero never looks frozen. Parameters mirror the design config
 * (gap 36, amplitude 22, frequency 0.02, dot 2.6).
 */
export function GridRipple({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GAP = 34;
    const AMP = 22;
    const FREQ = 0.02;
    const DOT = 2.6;
    const SPEED = 420;
    const LIFETIME = 2400;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let ripples: Ripple[] = [];
    let lastEmit = 0;
    let pointer = { x: 0, y: 0, inside: false };
    let frameTime = performance.now();
    let elapsed = 0;

    const emit = (x: number, y: number, strength = 1) => {
      ripples.push({ x, y, born: elapsed, strength });
      if (ripples.length > 10) ripples.shift();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ripples = [];
      pointer = { x: width / 2, y: height * 0.55, inside: false };
      if (reduced) {
        draw(0);
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const offsetX = (width % GAP) / 2;
      const offsetY = (height % GAP) / 2;

      for (let x = offsetX; x < width; x += GAP) {
        for (let y = offsetY; y < height; y += GAP) {
          let dx = 0;
          let dy = 0;
          let glow = 0;

          for (const ripple of ripples) {
            const age = (time - ripple.born) / 1000;
            if (age < 0 || age > LIFETIME / 1000) continue;
            const rx = x - ripple.x;
            const ry = y - ripple.y;
            const dist = Math.hypot(rx, ry) || 1;
            const delta = dist - age * SPEED;
            const envelope =
              Math.exp(-(delta * delta) / (2 * 74 * 74)) *
              Math.exp(-age * 1.15) *
              ripple.strength;
            if (envelope < 0.01) continue;
            const force = envelope * AMP;
            dx += (rx / dist) * force;
            dy += (ry / dist) * force;
            glow = Math.max(glow, envelope);
          }

          // faint living baseline so the grid breathes between ripples
          const breathe =
            Math.sin(x * FREQ + time * 0.0006) *
            Math.cos(y * FREQ - time * 0.00045) *
            0.9;

          const alpha = 0.1 + glow * 0.62 + breathe * 0.018;
          const radius = DOT * 0.5 + glow * 1.5;
          const tint = glow > 0.35 ? '154, 143, 244' : '255, 255, 255';

          ctx.beginPath();
          ctx.fillStyle = `rgba(${tint}, ${alpha.toFixed(3)})`;
          ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // inner glow around the most recent ripple
      const latest = ripples[ripples.length - 1];
      if (latest) {
        const age = (time - latest.born) / 1000;
        if (age < 1.6) {
          const grad = ctx.createRadialGradient(
            latest.x,
            latest.y,
            0,
            latest.x,
            latest.y,
            240,
          );
          grad.addColorStop(0, `rgba(124, 109, 235, ${0.1 * (1 - age / 1.6)})`);
          grad.addColorStop(1, 'rgba(124, 109, 235, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(latest.x - 240, latest.y - 240, 480, 480);
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(now - frameTime, 48);
      frameTime = now;
      elapsed += dt;

      const idleDue = elapsed - lastEmit > 2600;
      if (idleDue) {
        lastEmit = elapsed;
        const drift = Math.sin(elapsed / 5200) * width * 0.22;
        emit(
          pointer.inside ? pointer.x : width / 2 + drift,
          pointer.inside ? pointer.y : height * 0.5,
          pointer.inside ? 0.9 : 1.1,
        );
      }

      ripples = ripples.filter((r) => elapsed - r.born < LIFETIME + 100);
      draw(elapsed);
      raf = requestAnimationFrame(tick);
    };

    const toLocal = (e: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerMove = (e: PointerEvent) => {
      const p = toLocal(e);
      if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) return;
      pointer = { ...p, inside: true };
      if (elapsed - lastEmit > 130) {
        lastEmit = elapsed;
        emit(p.x, p.y, 0.75);
      }
    };

    const onPointerLeave = () => {
      pointer.inside = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      const p = toLocal(e);
      emit(p.x, p.y, 1.5);
    };

    resize();
    emit(width / 2, height * 0.5, 1.2);

    if (!reduced) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      canvas.addEventListener('pointerleave', onPointerLeave);
      canvas.addEventListener('pointerdown', onPointerDown);
      raf = requestAnimationFrame(tick);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-auto size-full ${className}`}
    />
  );
}

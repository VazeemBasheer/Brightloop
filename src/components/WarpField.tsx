import { useEffect, useRef } from 'react';

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  trail: number;
  tint: string;
}

/**
 * Auth backdrop: particles streaming outward from the wordmark, with a slow
 * expansion wave and a soft central glow. Adapted from the warp config
 * (warp 1.3, spread 1.5, streak 0.45, white/brand palette).
 */
export function WarpField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let particles: Particle[] = [];

    const WARP = 1.3;
    const STREAK = 0.45;
    const SPREAD = 1.5;

    const palette = ['rgba(255,255,255,', 'rgba(182,173,249,', 'rgba(124,109,235,'];

    const spawn = (p: Particle, initial = false): Particle => {
      p.angle = Math.random() * Math.PI * 2;
      p.radius = initial ? Math.random() * 420 : Math.random() * 18;
      p.speed = (0.25 + Math.random() * 1.6) * WARP;
      p.trail = 6 + Math.random() * 26 * STREAK * 2;
      p.tint = palette[Math.random() < 0.72 ? 0 : Math.random() < 0.6 ? 1 : 2];
      return p;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(680, Math.max(220, Math.floor((width * height) / 2600)));
      particles = Array.from({ length: count }, () => spawn({} as Particle, true));
      if (reduced) paintStatic();
    };

    const paintStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      for (const p of particles) {
        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius * 0.72;
        ctx.beginPath();
        ctx.fillStyle = `${p.tint}0.28)`;
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    let elapsed = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 40);
      last = now;
      elapsed += dt;

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.hypot(width, height) * 0.62;

      // central bloom
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.5);
      bloom.addColorStop(0, 'rgba(124,109,235,0.16)');
      bloom.addColorStop(0.45, 'rgba(124,109,235,0.04)');
      bloom.addColorStop(1, 'rgba(8,8,10,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(cx, cy);
      ctx.scale(1, 0.72);

      for (const p of particles) {
        p.radius += p.speed * (dt / 16) * SPREAD;
        if (p.radius > maxR) {
          spawn(p);
          continue;
        }
        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;
        const px = Math.cos(p.angle) * Math.max(0, p.radius - p.trail * p.speed);
        const py = Math.sin(p.angle) * Math.max(0, p.radius - p.trail * p.speed);
        const fade = 1 - p.radius / maxR;

        ctx.beginPath();
        ctx.strokeStyle = `${p.tint}${(fade * 0.5).toFixed(3)})`;
        ctx.lineWidth = 0.6 + fade * 1.3;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // expansion waves from the centre mark
      for (let i = 0; i < 2; i++) {
        const phase = ((elapsed / 5200 + i * 0.5) % 1);
        const r = phase * maxR * 0.9;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(154,143,244,${(0.16 * (1 - phase)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.arc(0, 0, r, -Math.PI * 0.62, Math.PI * 0.62);
        ctx.stroke();
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    };

    resize();
    if (!reduced) raf = requestAnimationFrame(frame);

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}

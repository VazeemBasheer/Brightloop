import { useEffect, useMemo, useRef } from 'react';

export interface WarpAnimationConfig {
  speed: {
    mode: string;
    value: number;
  };
  size: {
    mode: string;
    value: number;
  };
  zoom: {
    mode: string;
    value: number;
  };
  rotation: {
    mode: string;
    value: number;
  };
  logoSize: {
    mode: string;
    value: number;
  };
  count: {
    mode: string;
    value: number;
  };
  warp: {
    mode: string;
    value: number;
  };
  streak: {
    mode: string;
    value: number;
  };
  spread: {
    mode: string;
    value: number;
  };
  turb: {
    mode: string;
    value: number;
  };
  fromLogo: boolean;
  color: string;
  colorMode: string;
  __color?: {
    mode: string;
    active: number;
    palette: string[];
  };
  trail: number;
}

export const DEFAULT_WARP_CONFIG: WarpAnimationConfig = {
  speed: {
    mode: 'static',
    value: 1,
  },
  size: {
    mode: 'static',
    value: 1,
  },
  zoom: {
    mode: 'static',
    value: 1,
  },
  rotation: {
    mode: 'static',
    value: 0,
  },
  logoSize: {
    mode: 'static',
    value: 1,
  },
  count: {
    mode: 'static',
    value: 1400,
  },
  warp: {
    mode: 'static',
    value: 1.3,
  },
  streak: {
    mode: 'static',
    value: 0.45,
  },
  spread: {
    mode: 'static',
    value: 1.5,
  },
  turb: {
    mode: 'static',
    value: 0,
  },
  fromLogo: true,
  color: '#FFFFFF',
  colorMode: 'solid',
  __color: {
    mode: 'solid',
    active: 0,
    palette: [
      '#FFFFFF',
      '#101111',
      '#7C6DEB',
      '#1E9E76',
      '#E05A30',
    ],
  },
  trail: 0.335,
};

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  streak: number;
  color: string;
  baseAlpha: number;
  seed: number;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '255, 255, 255';
}

export interface WarpFieldProps {
  config?: Partial<WarpAnimationConfig>;
  className?: string;
}

/**
 * Auth backdrop: 1400 particles streaming outward at warp speed from the
 * brand logo with streak persistence, radial warp acceleration, and soft aura glow.
 */
export function WarpField({ config: userConfig, className }: WarpFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cfg = useMemo<WarpAnimationConfig>(
    () => ({
      ...DEFAULT_WARP_CONFIG,
      ...userConfig,
      speed: { ...DEFAULT_WARP_CONFIG.speed, ...userConfig?.speed },
      size: { ...DEFAULT_WARP_CONFIG.size, ...userConfig?.size },
      zoom: { ...DEFAULT_WARP_CONFIG.zoom, ...userConfig?.zoom },
      rotation: { ...DEFAULT_WARP_CONFIG.rotation, ...userConfig?.rotation },
      logoSize: { ...DEFAULT_WARP_CONFIG.logoSize, ...userConfig?.logoSize },
      count: { ...DEFAULT_WARP_CONFIG.count, ...userConfig?.count },
      warp: { ...DEFAULT_WARP_CONFIG.warp, ...userConfig?.warp },
      streak: { ...DEFAULT_WARP_CONFIG.streak, ...userConfig?.streak },
      spread: { ...DEFAULT_WARP_CONFIG.spread, ...userConfig?.spread },
      turb: { ...DEFAULT_WARP_CONFIG.turb, ...userConfig?.turb },
      __color: userConfig?.__color
        ? {
            mode: userConfig.__color.mode ?? DEFAULT_WARP_CONFIG.__color?.mode ?? 'solid',
            active: userConfig.__color.active ?? DEFAULT_WARP_CONFIG.__color?.active ?? 0,
            palette: userConfig.__color.palette ?? DEFAULT_WARP_CONFIG.__color?.palette ?? [],
          }
        : DEFAULT_WARP_CONFIG.__color,
    }),
    [userConfig]
  );

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

    const speedVal = Math.max(0.05, cfg.speed.value);
    const sizeVal = Math.max(0.1, cfg.size.value);
    const zoomVal = Math.max(0.1, cfg.zoom.value);
    const rotationVal = cfg.rotation.value;
    const logoSize = Math.max(0.1, cfg.logoSize.value);
    const countVal = Math.max(10, cfg.count.value);
    const warpVal = Math.max(0, cfg.warp.value);
    const streakVal = Math.max(0.01, cfg.streak.value);
    const spreadVal = Math.max(0.1, cfg.spread.value);
    const turbVal = cfg.turb.value;
    const trailVal = Math.max(0.01, Math.min(0.99, cfg.trail));

    const spawn = (p: Particle, initial = false): Particle => {
      p.angle = Math.random() * Math.PI * 2;
      p.seed = Math.random() * 1000;

      const minR = cfg.fromLogo ? Math.max(8, 18 * logoSize) : 4;
      const maxR = Math.hypot(width, height) * 0.75;

      p.radius = initial ? minR + Math.random() * (maxR - minR) : minR + Math.random() * 8;
      p.speed = (0.28 + Math.random() * 1.55) * speedVal;
      p.streak = (12 + Math.random() * 28) * streakVal;

      if (cfg.colorMode === 'solid') {
        const roll = Math.random();
        if (roll < 0.82) {
          p.color = hexToRgb(cfg.color);
        } else if (roll < 0.92) {
          p.color = '182, 173, 249'; // Brand 300
        } else if (roll < 0.97) {
          p.color = '124, 109, 235'; // Brand 500
        } else {
          p.color = '62, 199, 154';  // Mint accent
        }
      } else {
        const pal = cfg.__color?.palette || ['#FFFFFF', '#7C6DEB', '#1E9E76', '#E05A30'];
        const chosen = pal[Math.floor(Math.random() * pal.length)];
        p.color = hexToRgb(chosen);
      }

      p.baseAlpha = 0.35 + Math.random() * 0.65;
      return p;
    };

    const getOrigin = () => {
      let cx = width / 2;
      let cy = height * 0.32;

      if (cfg.fromLogo) {
        const logoEl =
          canvas.parentElement?.querySelector('[data-auth-logo]') ||
          document.querySelector('[data-auth-logo]');
        if (logoEl) {
          const lRect = logoEl.getBoundingClientRect();
          const cRect = canvas.getBoundingClientRect();
          cx = lRect.left + lRect.width / 2 - cRect.left;
          cy = lRect.top + lRect.height / 2 - cRect.top;
        }
      }
      return { cx, cy };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pre-fill canvas with dark canvas background to avoid flicker
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, width, height);

      particles = Array.from({ length: countVal }, () => spawn({} as Particle, true));
      if (reduced) paintStatic();
    };

    const paintStatic = () => {
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, width, height);

      const { cx, cy } = getOrigin();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoomVal, zoomVal);

      const maxR = Math.hypot(width, height) * 0.75;
      for (const p of particles) {
        const x = Math.cos(p.angle) * p.radius * spreadVal;
        const y = Math.sin(p.angle) * p.radius;
        const fade =
          Math.min(1, p.radius / (35 * logoSize)) * Math.max(0, 1 - p.radius / maxR);

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.color}, ${(p.baseAlpha * fade * 0.6).toFixed(3)})`;
        ctx.arc(x, y, 0.9 * sizeVal, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    let elapsed = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(now - last, 45);
      last = now;
      elapsed += dt;

      // Trail persistence: fill with semi-transparent canvas color
      // for smooth motion decay instead of harsh full clear
      ctx.globalCompositeOperation = 'source-over';
      const decayAlpha = Math.max(0.12, Math.min(0.85, 1 - trailVal * 1.55));
      ctx.fillStyle = `rgba(8, 8, 10, ${decayAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);

      const { cx, cy } = getOrigin();
      const maxR = Math.hypot(width, height) * 0.72;

      // Central bloom around logo origin
      const bloomRadius = 180 * logoSize * zoomVal;
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomRadius);
      bloom.addColorStop(0, 'rgba(124, 109, 235, 0.18)');
      bloom.addColorStop(0.35, 'rgba(124, 109, 235, 0.07)');
      bloom.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
      bloom.addColorStop(1, 'rgba(8, 8, 10, 0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, bloomRadius, 0, Math.PI * 2);
      ctx.fill();

      // Expansion shockwave rings
      for (let i = 0; i < 2; i++) {
        const phase = ((elapsed / 5000 + i * 0.5) % 1);
        const r = phase * maxR * 0.85;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(154, 143, 244, ${(0.14 * (1 - phase)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.arc(cx, cy, r, -Math.PI * 0.65, Math.PI * 0.65);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);

      if (rotationVal !== 0) {
        ctx.rotate((elapsed * 0.0005 * rotationVal) % (Math.PI * 2));
      }
      ctx.scale(zoomVal, zoomVal);

      ctx.globalCompositeOperation = 'lighter';

      for (const p of particles) {
        const progress = Math.min(1, p.radius / maxR);

        // Warp acceleration: exponential boost outward
        const warpFactor = 1 + Math.pow(progress, 1.25) * (warpVal * 2.2);

        const dr = p.speed * (dt / 16) * spreadVal * warpFactor;
        p.radius += dr;

        let angle = p.angle;
        if (turbVal > 0) {
          angle += Math.sin(p.radius * 0.015 + elapsed * 0.002 + p.seed) * turbVal * 0.25;
        }

        if (p.radius > maxR) {
          spawn(p);
          continue;
        }

        // Streak length scaling with warp factor and trail
        const streakLength = (8 + p.streak) * streakVal * warpFactor * (0.8 + trailVal * 0.6);
        const tailRadius = Math.max(0, p.radius - streakLength);

        const x = Math.cos(angle) * p.radius * spreadVal;
        const y = Math.sin(angle) * p.radius;
        const px = Math.cos(angle) * tailRadius * spreadVal;
        const py = Math.sin(angle) * tailRadius;

        const fadeIn = Math.min(1, p.radius / (35 * logoSize));
        const fadeOut = Math.max(0, 1 - p.radius / maxR);
        const alpha = p.baseAlpha * fadeIn * fadeOut;

        if (alpha <= 0.01) continue;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(${p.color}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = (0.5 + fadeOut * 1.2) * sizeVal;
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Subtle head spark for brighter particles at warp
        if (progress > 0.35 && p.baseAlpha > 0.75) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.8).toFixed(3)})`;
          ctx.arc(x, y, 0.8 * sizeVal, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

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
  }, [cfg]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={className || 'pointer-events-none absolute inset-0 size-full'}
    />
  );
}

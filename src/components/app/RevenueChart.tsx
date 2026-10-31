import { useMemo, useState } from 'react';
import type { RevenuePoint } from '../../lib/data';
import { usd } from '../../lib/format';

const W = 680;
const H = 240;
const PAD = { top: 18, right: 16, bottom: 26, left: 46 };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { max, points, area, line } = useMemo(() => {
    const values = data.flatMap((d) => [d.mrr, d.collected]);
    const maxValue = Math.ceil(Math.max(...values) / 50_000) * 50_000;
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / maxValue) * innerH;

    const pts = data.map((d, i) => ({ ...d, x: x(i), y: y(d.mrr), cy: y(d.collected) }));
    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${H - PAD.bottom} L${pts[0].x.toFixed(1)},${H - PAD.bottom} Z`;

    return { max: maxValue, points: pts, area: areaPath, line: linePath };
  }, [data]);

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((t) => max * (1 - t));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const innerW = W - PAD.left - PAD.right;
    const ratio = (relX - PAD.left) / innerW;
    const index = Math.round(ratio * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, index)));
  };

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Monthly recurring revenue over the last twelve months"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="mrr-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c6deb" stopOpacity="0.34" />
            <stop offset="60%" stopColor="#7c6deb" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7c6deb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mrr-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6152d6" />
            <stop offset="60%" stopColor="#9a8ff4" />
            <stop offset="100%" stopColor="#c4bcff" />
          </linearGradient>
        </defs>

        {gridValues.map((value, i) => {
          const y = PAD.top + ((H - PAD.top - PAD.bottom) / 4) * i;
          return (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="#ffffff"
                strokeOpacity={i === 4 ? 0.14 : 0.06}
                strokeDasharray={i === 4 ? undefined : '3 5'}
              />
              <text
                x={PAD.left - 10}
                y={y + 3}
                textAnchor="end"
                className="fill-zinc-600 font-mono"
                fontSize="9"
              >
                {usd(value, { compact: true })}
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#mrr-fill)" />
        <path
          d={line}
          fill="none"
          stroke="url(#mrr-stroke)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.month}
            cx={p.x}
            cy={p.cy}
            r="2.4"
            fill="#0d0d11"
            stroke="#3ec79a"
            strokeWidth="1.4"
            opacity={hover === null || hover === i ? 1 : 0.35}
          />
        ))}

        {data.map((d, i) => {
          if (data.length > 8 && i % 2 !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={d.month}
              x={points[i].x}
              y={H - 8}
              textAnchor="middle"
              className="fill-zinc-600 font-mono"
              fontSize="9"
            >
              {d.month}
            </text>
          );
        })}

        {active && (
          <g>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="#ffffff"
              strokeOpacity="0.16"
            />
            <circle cx={active.x} cy={active.y} r="4" fill="#c4bcff" />
            <circle cx={active.x} cy={active.cy} r="3" fill="#3ec79a" />
          </g>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-[#15151b]/95 px-3 py-2 shadow-xl backdrop-blur"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.y / H) * 100}%`,
            marginTop: -70,
          }}
        >
          <p className="font-mono text-[9px] tracking-wider text-zinc-500 uppercase">
            {active.month} 2026
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-100">
            <span className="size-1.5 rounded-full bg-brand-400" />
            {usd(active.mrr)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="size-1.5 rounded-full bg-mint-400" />
            {usd(active.collected)} collected
          </p>
        </div>
      )}

      <div className="mt-1 flex items-center gap-5 pl-10">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="h-1.5 w-3 rounded-full bg-brand-400" /> MRR
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="h-1.5 w-3 rounded-full bg-mint-400" /> Collected
        </span>
      </div>
    </div>
  );
}

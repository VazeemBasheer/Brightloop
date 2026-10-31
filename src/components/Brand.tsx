import { Link } from 'react-router-dom';

export function LoopMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="loop-a" x1="4" y1="6" x2="28" y2="26">
          <stop stopColor="#c4bcff" />
          <stop offset="0.55" stopColor="#7c6deb" />
          <stop offset="1" stopColor="#3ec79a" />
        </linearGradient>
      </defs>
      <circle cx="11.5" cy="16" r="7.5" stroke="url(#loop-a)" strokeWidth="2" />
      <circle
        cx="20.5"
        cy="16"
        r="7.5"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <circle cx="20.5" cy="16" r="2" fill="#c4bcff" />
    </svg>
  );
}

export function Brand({ to = '/' }: { to?: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2.5"
      aria-label="Brightloop home"
    >
      <LoopMark className="size-7 transition-transform duration-500 group-hover:rotate-180" />
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-100">
        brightloop
      </span>
    </Link>
  );
}

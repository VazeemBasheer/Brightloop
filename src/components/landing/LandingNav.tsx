import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Brand } from '../Brand';

const links = [
  { label: 'Product', href: '#product' },
  { label: 'Platform', href: '#platform' },
  { label: 'Insights', href: '#insights' },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-white/8 bg-[#08080a]/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Brand />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] text-zinc-400 transition-colors hover:text-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-full px-3.5 py-2 text-[13px] text-zinc-300 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="group inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-2 text-[13px] font-medium text-[#0b0b0e] transition-colors hover:bg-white"
          >
            Get started
            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/8 bg-[#08080a]/95 px-5 py-5 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex gap-2 border-t border-white/8 pt-4">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full border border-white/12 px-4 py-2.5 text-center text-sm text-zinc-200"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full bg-zinc-100 px-4 py-2.5 text-center text-sm font-medium text-[#0b0b0e]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

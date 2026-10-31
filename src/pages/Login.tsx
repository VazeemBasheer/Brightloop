import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Alert } from '../components/ui/Alert';
import { Checkbox, Field } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';

const roles = [
  { id: 'admin', label: 'Admin' },
  { id: 'staff', label: 'Staff' },
  { id: 'customer', label: 'Customer' },
] as const;

type Role = (typeof roles)[number]['id'];

export default function Login() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [role, setRole] = useState<Role>('admin');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Enter a valid email address.';
    }
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      const destination = role === 'customer' ? '/app/portal' : '/app';
      push({
        tone: 'success',
        title: role === 'customer' ? 'Welcome back to your portal' : 'Signed in to Brightloop',
        description:
          role === 'customer'
            ? 'Showing Aster & Co. subscriptions and invoices.'
            : 'Demo workspace — Maya Chen, Finance Lead.',
      });
      navigate(destination);
    }, 650);
  };

  const sendReset = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Enter the email on your account.' });
      return;
    }
    setErrors({});
    setResetSent(`https://app.brightloop.io/reset?token=bl_${Math.random().toString(36).slice(2, 14)}`);
  };

  return (
    <AuthShell
      title={mode === 'login' ? 'Welcome back' : 'Reset your password'}
      subtitle={
        mode === 'login'
          ? 'Sign in to run billing, renewals and spend audits.'
          : 'We will send a single-use link to your registered email.'
      }
      footer={
        mode === 'login' ? (
          <>
            New to Brightloop?{' '}
            <Link to="/signup" className="font-medium text-brand-300 hover:text-brand-200">
              Create an account
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setResetSent(null);
            }}
            className="font-medium text-brand-300 hover:text-brand-200"
          >
            Back to sign in
          </button>
        )
      }
    >
      {mode === 'login' ? (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between pt-1">
            <Checkbox
              id="remember"
              checked={remember}
              onChange={setRemember}
              label="Remember me"
            />
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setErrors({});
              }}
              className="text-xs text-brand-300 transition hover:text-brand-200"
            >
              Forgot password?
            </button>
          </div>

          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <p className="font-mono text-[9px] tracking-[0.16em] text-zinc-600 uppercase">
              Demo role
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  aria-pressed={role === r.id}
                  className={`rounded-md border px-2 py-1.5 text-[11px] transition ${
                    role === r.id
                      ? 'border-brand-500/60 bg-brand-500/15 text-brand-200'
                      : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-[#0b0b0e] transition hover:bg-white disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                Sign in <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-white/8" />
            <span className="font-mono text-[9px] tracking-wider text-zinc-600 uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-white/8" />
          </div>

          <button
            type="button"
            onClick={() =>
              push({
                tone: 'info',
                title: 'Google sign-in is not wired yet',
                description: 'Auth provider setup lands with the backend integration.',
              })
            }
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04]"
          >
            <svg className="size-4" viewBox="0 0 48 48" aria-hidden>
              <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.3-.4-4.9H24.5v9.2h12.9c-.5 3-2.3 5.6-4.8 7.3v6h7.8c4.5-4.2 7.1-10.4 7.1-17.6Z" />
              <path fill="#34A853" d="M24.5 48c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.1 1.5-4.9 2.3-8.1 2.3-6.3 0-11.6-4.2-13.5-9.9H3.1v6.2C7.2 42.9 15.4 48 24.5 48Z" />
              <path fill="#FBBC04" d="M11 28.6a14.4 14.4 0 0 1 0-9.2v-6.2H3.1a24 24 0 0 0 0 21.6L11 28.6Z" />
              <path fill="#EA4335" d="M24.5 9.5c3.4 0 6.5 1.2 9 3.5l6.7-6.7C36.1 2.3 30.5 0 24.5 0 15.4 0 7.2 5.1 3.1 13.2L11 19.4c1.9-5.7 7.2-9.9 13.5-9.9Z" />
            </svg>
            Continue with Google
          </button>
        </form>
      ) : resetSent ? (
        <div className="space-y-4">
          <Alert tone="success" title="Reset link generated">
            <p>
              A single-use link was sent to <span className="text-zinc-200">{email}</span>.
              It expires in 30 minutes.
            </p>
            <p className="mt-2 truncate rounded-md border border-white/8 bg-black/40 px-2 py-1.5 font-mono text-[10px] text-brand-200">
              {resetSent}
            </p>
          </Alert>
          <p className="text-xs leading-relaxed text-zinc-500">
            This is a simulated inbox for the demo. No production email is
            dispatched until the mail service is connected.
          </p>
        </div>
      ) : (
        <form onSubmit={sendReset} className="space-y-4" noValidate>
          <div className="flex items-start gap-2.5 rounded-lg border border-brand-500/25 bg-brand-500/[0.06] p-3">
            <MailCheck className="mt-0.5 size-4 text-brand-300" />
            <p className="text-xs leading-relaxed text-brand-200/80">
              Enter your account email. Each email belongs to exactly one
              Brightloop account.
            </p>
          </div>
          <Field
            label="Email"
            name="reset-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-[#0b0b0e] transition hover:bg-white"
          >
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}

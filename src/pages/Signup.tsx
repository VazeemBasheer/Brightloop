import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { AuthShell } from '../components/AuthShell';
import { Steps } from '../components/ui/Steps';
import { Alert } from '../components/ui/Alert';
import { Field } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { api, setCurrentCustomer } from '../lib/api';

const stepLabels = ['Account', 'Workspace', 'Plan', 'Ready'];

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$49',
    cadence: 'per month',
    detail: 'Up to 100 active subscriptions. Cancel anytime.',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$39',
    cadence: 'per month, billed yearly',
    detail: 'Save 20%. Up to 500 active subscriptions.',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual contract',
    detail: 'Unlimited subscriptions, SSO and dedicated support.',
  },
] as const;

const teamSizes = ['Just me', '2–10', '11–50', '50+'];
const roles = ['Finance lead', 'Billing & ops', 'Founder'];

export default function Signup() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicate, setDuplicate] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [account, setAccount] = useState({
    name: '',
    email: '',
  });
  const [workspace, setWorkspace] = useState({
    company: '',
    size: '2–10',
    role: 'Finance lead',
  });
  const [plan, setPlan] = useState<string>('yearly');

  const accountValid =
    account.name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim());

  const next = async () => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (account.name.trim().length < 2) e.name = 'Tell us your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email))
        e.email = 'Enter a valid email address.';
      setErrors(e);
      if (Object.keys(e).length) return;
      setDuplicate(false);
      setStep(2);
      return;
    }

    if (step === 2) {
      const e: Record<string, string> = {};
      if (workspace.company.trim().length < 2)
        e.company = 'Enter your company or workspace name.';
      setErrors(e);
      if (Object.keys(e).length) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      setBusy(true);
      setSignupError(null);
      try {
        const { customer } = await api.createCustomer({
          name: account.name.trim(),
          email: account.email.trim(),
          company: workspace.company.trim(),
        });
        setCurrentCustomer(customer.id);
        setStep(4);
        push({
          tone: 'success',
          title: 'Billing account created',
          description: `${workspace.company} is now linked to the billing service.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The billing service did not create the account.';
        if (message.toLowerCase().includes('already registered')) {
          setDuplicate(true);
          setErrors({ email: message });
          setStep(1);
        } else {
          setSignupError(message);
        }
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <AuthShell
      wide
      title={step === 4 ? 'Billing profile created' : 'Set up your workspace'}
      subtitle={
        step === 4
          ? 'Your customer profile is saved in the billing service.'
          : 'Create a customer profile and preview the setup flow.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-300 hover:text-brand-200">
            Sign in
          </Link>
        </>
      }
    >
      <Steps steps={stepLabels} current={step === 4 ? 5 : step} className="mb-7" />

      {duplicate && (
        <Alert
          tone="error"
          title="That email already has an account"
          onDismiss={() => setDuplicate(false)}
          className="mb-4"
          action={
            <Link
              to="/login"
              className="rounded-md border border-ember-500/40 px-3 py-1.5 text-xs text-ember-400 transition hover:bg-ember-500/10"
            >
              Sign in instead
            </Link>
          }
        >
          This email already has a billing profile. Use the customer sign-in demo
          with this email to open its portal.
        </Alert>
      )}
      {signupError && (
        <Alert
          tone="error"
          title="Could not create billing account"
          onDismiss={() => setSignupError(null)}
          className="mb-4"
        >
          {signupError}
        </Alert>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field
            label="Full name"
            name="name"
            autoComplete="name"
            placeholder="Maya Chen"
            value={account.name}
            error={errors.name}
            onChange={(e) => setAccount({ ...account, name: e.target.value })}
          />
          <Field
            label="Work email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={account.email}
            error={errors.email}
            onChange={(e) => {
              setAccount({ ...account, email: e.target.value });
              setErrors((current) => ({ ...current, email: '' }));
              setDuplicate(false);
            }}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Field
            label="Workspace name"
            name="company"
            placeholder="Aster & Co."
            value={workspace.company}
            error={errors.company}
            onChange={(e) => setWorkspace({ ...workspace, company: e.target.value })}
          />
          <div>
            <p className="text-[12px] font-medium text-zinc-300">Team size</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {teamSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setWorkspace({ ...workspace, size })}
                  aria-pressed={workspace.size === size}
                  className={`rounded-lg border px-2 py-2 text-[11px] transition ${
                    workspace.size === size
                      ? 'border-brand-500/60 bg-brand-500/15 text-brand-200'
                      : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-medium text-zinc-300">Your role</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setWorkspace({ ...workspace, role })}
                  aria-pressed={workspace.role === role}
                  className={`rounded-lg border px-2 py-2 text-[11px] transition ${
                    workspace.role === role
                      ? 'border-brand-500/60 bg-brand-500/15 text-brand-200'
                      : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <Building2 className="mt-0.5 size-4 shrink-0 text-zinc-500" />
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Only the company name is saved to your customer profile. Workspace
              isolation and staff invitations are not available in this demo.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          {plans.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPlan(option.id)}
              aria-pressed={plan === option.id}
              className={`flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition ${
                plan === option.id
                  ? 'border-brand-500/60 bg-brand-500/[0.08]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/16'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100">{option.name}</p>
                  {'highlight' in option && option.highlight && (
                    <span className="rounded-full bg-mint-500/15 px-2 py-0.5 font-mono text-[9px] tracking-wider text-mint-400 uppercase">
                      Best value
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                  {option.detail}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-lg text-zinc-100">{option.price}</p>
                <p className="text-[10px] text-zinc-600">{option.cadence}</p>
              </div>
            </button>
          ))}
          <p className="pt-1 text-[11px] leading-relaxed text-zinc-600">
            This is a demo selection only; a subscription is not provisioned or billed.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-mint-500/25 bg-mint-500/[0.06] p-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-mint-500/15 text-mint-400">
              <Check className="size-5" strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-100">
                {workspace.company} is live
              </p>
              <p className="text-[11px] text-zinc-500">
                {account.email} · {workspace.size} · {workspace.role}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8">
            {[
              ['Selected plan', plan.charAt(0).toUpperCase() + plan.slice(1)],
              ['Provisioning', 'Not enabled in this demo'],
              ['Next step', 'Open your customer portal'],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`flex items-center justify-between px-4 py-3 text-xs ${
                  index !== 2 ? 'border-b border-white/6' : ''
                }`}
              >
                <span className="text-zinc-500">{label}</span>
                <span className="text-zinc-300">{value}</span>
              </div>
            ))}
          </div>

          <Alert tone="info" title="A note on this demo">
            Your customer profile is saved in the billing database. Password authentication,
            workspace isolation and subscription-plan provisioning are not configured.
          </Alert>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-[#0b0b0e] transition hover:bg-white"
            >
              Open dashboard <ArrowRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/portal')}
              className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              View customer portal
            </button>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (step === 1 ? navigate('/login') : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-zinc-500 transition hover:text-zinc-200"
          >
            <ArrowLeft className="size-3.5" />
            {step === 1 ? 'Back to sign in' : 'Back'}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={busy || (step === 1 && !accountValid)}
            className="group inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-[#0b0b0e] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Creating…
              </>
            ) : step === 3 ? (
              <>
                <Sparkles className="size-4" /> Create billing profile
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      )}
    </AuthShell>
  );
}

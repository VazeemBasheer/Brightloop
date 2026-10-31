import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  Bot,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import type {
  AssistantAnalysis,
  AssistantMessage,
  Insight,
} from '../../lib/data';
import { api } from '../../lib/api';
import { usd } from '../../lib/format';
import { useToast } from '../ui/Toast';
import { Alert } from '../ui/Alert';

interface AssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

const toneStyles = {
  risk: { dot: 'bg-ember-400', label: 'text-ember-400', chip: 'bg-ember-500/10' },
  opportunity: {
    dot: 'bg-mint-400',
    label: 'text-mint-400',
    chip: 'bg-mint-500/10',
  },
  neutral: { dot: 'bg-brand-400', label: 'text-brand-300', chip: 'bg-brand-500/10' },
};

const suggestions = [
  'What should I cancel first?',
  'How much is overdue right now?',
  'Where can we cut spend this quarter?',
];

let messageId = 0;

export function AssistantDrawer({ open, onClose }: AssistantDrawerProps) {
  const { push } = useToast();
  const [analysis, setAnalysis] = useState<AssistantAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [handled, setHandled] = useState<string[]>([]);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'm-0',
      role: 'assistant',
      content:
        'Ask me to review subscription usage, find savings opportunities, or explain the billing data connected to this workspace.',
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    setAnalysis(null);
    try {
      const result = await api.getAnalysis();
      setAnalysis(result);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || loadedOnce.current) return;
    loadedOnce.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, thinking]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((current) => [
      ...current,
      { id: `m-${++messageId}`, role: 'user', content: trimmed },
    ]);
    setInput('');
    setThinking(true);
    try {
      const { reply } = await api.askAssistant(trimmed);
      setMessages((current) => [
        ...current,
        { id: `m-${++messageId}`, role: 'assistant', content: reply },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `m-${++messageId}`,
          role: 'assistant',
          content:
            'The assistant endpoint is not responding. The portfolio numbers above are still live from the finance store.',
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const act = async (insight: Insight) => {
    try {
      const { emailDraft } = await api.draftEmail(insight);
      setHandled((current) => [...current, insight.id]);
      setMessages((current) => [
        ...current,
        { id: `m-${++messageId}`, role: 'assistant', content: `${insight.vendor} email draft:\n\n${emailDraft}` },
      ]);
      push({
        tone: 'success',
        title: 'Draft prepared',
        description: `${insight.vendor} · review the draft in this conversation before sending.`,
      });
    } catch (error) {
      push({
        tone: 'error',
        title: 'Could not draft email',
        description: error instanceof Error ? error.message : 'The AI service did not complete the request.',
      });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px]"
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Smart insights assistant"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[440px] flex-col border-l border-white/10 bg-[#0a0a0e] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-white/8 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-300">
                    <Sparkles className="size-3.5" />
                  </span>
                  <h2 className="text-sm font-medium text-zinc-100">
                    Smart insights
                  </h2>
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] tracking-wider uppercase ${
                    analysis ? 'bg-mint-500/10 text-mint-400' : 'bg-white/5 text-zinc-500'
                  }`}>
                    {analysis ? 'Live' : 'Connected'}
                  </span>
                </div>
                <p className="mt-1.5 max-w-[300px] text-[11px] leading-relaxed text-zinc-500">
                  Gemini audits subscriptions, seats and renewals. Nothing is
                  charged or cancelled without you.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                  aria-label="Re-run analysis"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200 disabled:opacity-40"
                >
                  <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close assistant"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
              {failed && (
                <Alert tone="warning" title="Analysis is unavailable" className="mb-4">
                  {failed
                    ? 'Gemini analysis is unavailable. Check that the AI service is running and GEMINI_API_KEY is configured.'
                    : 'Analysis could not be loaded.'}
                </Alert>
              )}

              {loading && !analysis ? (
                <div className="space-y-3">
                  <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-xl bg-white/[0.03]"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              ) : analysis ? (
                <>
                  <div className="relative overflow-hidden rounded-xl border border-brand-500/25 bg-gradient-to-br from-brand-500/14 via-brand-500/5 to-transparent p-4">
                    <p className="font-mono text-[9px] tracking-[0.18em] text-brand-300 uppercase">
                      Annual savings found
                    </p>
                    <p className="mt-1.5 font-mono text-[28px] leading-none text-white">
                      {usd(analysis.annualSavings)}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                      {analysis.summary}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 border-t border-white/8 pt-2.5 font-mono text-[9px] text-zinc-600">
                      <span className="size-1 rounded-full bg-mint-400" />
                      {analysis.model} · {analysis.insights.length} findings ·
                      analysed just now
                    </p>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {analysis.insights.map((insight) => {
                      const tone = toneStyles[insight.tone];
                      const done = handled.includes(insight.id);
                      return (
                        <article
                          key={insight.id}
                          className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5 transition hover:border-white/14"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <span
                                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${tone.dot}`}
                              />
                              <div className="min-w-0">
                                <p className="text-[12px] leading-snug font-medium text-zinc-100">
                                  {insight.title}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                                  {insight.vendor}
                                </p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-[10px] text-mint-400 ${tone.chip}`}>
                              +{usd(insight.savingsPerYear, { compact: true })}/yr
                            </span>
                          </div>
                          <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-500">
                            {insight.detail}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                                <div
                                  className="h-full rounded-full bg-brand-400"
                                  style={{ width: `${insight.confidence * 100}%` }}
                                />
                              </div>
                              <span className="font-mono text-[9px] text-zinc-600">
                                {Math.round(insight.confidence * 100)}% confidence
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => void act(insight)}
                              disabled={done}
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] transition ${
                                done
                                  ? 'border-mint-500/30 bg-mint-500/10 text-mint-400'
                                  : 'border-white/12 text-zinc-300 hover:border-brand-400/50 hover:bg-brand-500/10 hover:text-brand-200'
                              }`}
                            >
                              <Wand2 className="size-3" />
                              {done ? 'Draft ready' : insight.action}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : null}

              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/8" />
                <span className="font-mono text-[9px] tracking-[0.16em] text-zinc-600 uppercase">
                  Ask the portfolio
                </span>
                <span className="h-px flex-1 bg-white/8" />
              </div>

              <div className="mt-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-brand-300">
                        <Bot className="size-3.5" />
                      </span>
                    )}
                    <p
                      className={`max-w-[86%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-brand-500/20 text-brand-100'
                          : 'border border-white/8 bg-white/[0.03] text-zinc-300'
                      }`}
                    >
                      {message.content}
                    </p>
                  </div>
                ))}

                {thinking && (
                  <div className="flex items-center gap-2 pl-8 text-[11px] text-zinc-500">
                    <Loader2 className="size-3 animate-spin" />
                    Reading invoices and usage…
                  </div>
                )}
              </div>

              {messages.length <= 1 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void send(suggestion)}
                      className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-400 transition hover:border-brand-400/40 hover:text-brand-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={submit}
              className="border-t border-white/8 bg-[#0a0a0e] px-4 py-3"
            >
              <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pl-3 focus-within:border-brand-500/50">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about renewals, waste or cash…"
                  aria-label="Message the assistant"
                  className="min-w-0 flex-1 bg-transparent py-1.5 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || thinking}
                  aria-label="Send message"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[#0b0b0e] transition hover:bg-white disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" strokeWidth={2.5} />
                </button>
              </div>
              <p className="mt-2 text-center font-mono text-[9px] text-zinc-700">
                Runs server-side · API key never reaches the browser
              </p>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

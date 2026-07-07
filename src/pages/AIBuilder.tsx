import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Send, AlertCircle, RefreshCw, CheckCircle2, User, Sparkles } from 'lucide-react';
import { useAppDispatch } from '../store';
import { submitCustomOrderThunk } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { callAiDesign } from '../lib/repo';
import { fmt } from '../lib/utils';
import { Btn } from '../components/ui/shared';
import type { ChatMessage, AIDesignResult } from '../types';

const EXAMPLES = [
  'A steel almirah with 3 doors, mirror, matte black',
  'L-shaped office desk with cable management',
  'School furniture set for 30 students',
  'Warehouse rack, 6-tier, heavy duty',
];

const VIEW_TABS: { key: keyof AIDesignResult['images']; label: string }[] = [
  { key: 'front', label: 'Front' }, { key: 'side', label: 'Side' },
  { key: 'top', label: 'Top' }, { key: 'inside', label: 'Inside' },
];

export default function AIBuilder() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const notify    = useNotification();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm your SteelCraft design consultant. Tell me what you'd like to build — an almirah, wardrobe, office desk, rack, locker, bed, or school furniture — and I'll ask a few quick questions to nail down the design." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIDesignResult | null>(null);
  const [activeView, setActiveView] = useState<keyof AIDesignResult['images']>('front');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, result]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending || result) return;
    setError(null);
    const historyForCall = messages;
    setMessages(m => [...m, { role: 'user', content }]);
    setInput('');
    setSending(true);
    try {
      const res = await callAiDesign(historyForCall, content);
      if (res.type === 'error') {
        setError(res.message);
      } else if (res.type === 'question') {
        setMessages(res.history);
      } else if (res.type === 'complete') {
        setMessages(res.history);
        setResult(res);
        setActiveView('front');
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function startOver() {
    setMessages([{ role: 'assistant', content: "Let's design another piece! What would you like to build?" }]);
    setResult(null); setError(null); setInput('');
  }

  async function handleSubmitToAdmin() {
    const designId = result?.id;
    if (!designId) return;
    setSubmittingOrder(true);
    try {
      await dispatch(submitCustomOrderThunk(designId)).unwrap();
      notify('Sent to our team for review! 🎉 Track it in your Dashboard → Custom Orders.');
      navigate('/dashboard');
    } catch (err: any) {
      notify(err.message ?? 'Could not submit design', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className="animate-up">
      {/* Hero */}
      <section className="bg-[var(--dk)] py-[clamp(36px,5vw,52px)] px-5">
        <div className="max-w-[640px] mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-[rgba(200,130,10,.16)] border border-[rgba(200,130,10,.35)]
                          text-[var(--ac2)] text-[11px] font-bold px-3.5 py-1 rounded-full tracking-widest uppercase mb-3">
            <Wand2 size={12} />AI-Powered Design
          </div>
          <h1 className="text-[clamp(1.6rem,4vw,2.4rem)] font-black text-white leading-tight mb-2">
            Custom Furniture <em className="not-italic text-[var(--ac2)]">Builder</em>
          </h1>
          <p className="text-white/63 leading-relaxed text-[14px]">
            Chat with our AI consultant — get real dimensioned drawings and an instant price.
          </p>
        </div>
      </section>

      <div className="max-w-[760px] mx-auto px-4 py-7">
        {!result && (
          <>
            {/* Chat window */}
            <div ref={scrollRef} className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-4 mb-3
                                             h-[min(58vh,460px)] overflow-y-auto flex flex-col gap-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[var(--dk)] flex items-center justify-center flex-shrink-0">
                      <Sparkles size={13} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-[13.5px] leading-relaxed
                                   ${m.role === 'user' ? 'bg-[var(--dk)] text-white' : 'bg-[var(--bg2)] text-[var(--tx)]'}`}>
                    {m.content}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-[var(--ac)] flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-[var(--dk)] flex items-center justify-center flex-shrink-0">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div className="bg-[var(--bg2)] rounded-[14px] px-3.5 py-2.5 flex gap-1 items-center">
                    {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--tx3)] animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[13px] p-3 flex gap-2 mb-3 text-red-700 text-[13px]">
                <AlertCircle size={17} className="flex-shrink-0" />{error}
              </div>
            )}

            {/* Examples — only before the conversation has started */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => send(ex)}
                    className="text-[11.5px] px-3 py-1.5 bg-[var(--bg2)] border border-[var(--br)] rounded-full
                               text-[var(--tx2)] hover:bg-[var(--dk)] hover:text-white hover:border-[var(--dk)] transition-all text-left">
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') send(); }}
                placeholder="Describe what you want, or answer the question above…"
                disabled={sending}
                className="flex-1 px-3.5 py-3 border border-[var(--br)] rounded-[12px] text-[14px] bg-[var(--sf)]
                           text-[var(--tx)] outline-none focus:border-[var(--dk)] transition-colors disabled:opacity-60"
              />
              <button onClick={() => send()} disabled={sending || !input.trim()}
                className="flex items-center justify-center gap-1.5 bg-[var(--dk)] hover:bg-[var(--dk2)] text-white
                           font-bold px-4 rounded-[12px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Send size={16} />
              </button>
            </div>
          </>
        )}

        {/* ── Result: spec sheet ── */}
        {result && (
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-5 animate-up">
            {!result.savedToAccount && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-[12.5px] rounded-[10px] px-3 py-2 mb-4">
                You're not signed in — this design won't be saved. <button onClick={() => navigate('/login', { state: { from: '/ai' } })} className="font-bold underline">Sign in</button> to save it and send it to our team.
              </div>
            )}

            {/* View tabs */}
            <div className="flex gap-1.5 mb-3">
              {VIEW_TABS.map(t => (
                <button key={t.key} onClick={() => setActiveView(t.key)}
                  className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-colors
                              ${activeView === t.key ? 'bg-[var(--dk)] text-white' : 'bg-[var(--bg2)] text-[var(--tx2)]'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="rounded-[14px] overflow-hidden border border-[var(--br)] mb-4 bg-[#F8FAFC]">
              <img src={result.images[activeView]} alt={`${activeView} view`} className="w-full h-auto block" />
            </div>

            <h2 className="text-[19px] font-black text-[var(--tx)] mb-1">{result.spec.label}</h2>
            <p className="text-[13px] text-[var(--tx2)] mb-4">
              {result.spec.widthIn}"×{result.spec.heightIn}"×{result.spec.depthIn}" · {result.spec.doors} door(s) · {result.spec.shelves} shelf/shelves
              {result.spec.drawers > 0 && ` · ${result.spec.drawers} drawer(s)`} · {result.spec.gaugeMM}mm steel
            </p>

            {/* Price breakdown */}
            <div className="bg-[var(--bg2)] rounded-[13px] p-4 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--tx)] mb-2.5">Price Breakdown</div>
              <div className="space-y-1.5 text-[13px]">
                {[['Steel (material)', result.pricing.materialCost], ['Hardware (locks, hinges…)', result.pricing.hardwareCost],
                  ['Finishing / powder coat', result.pricing.finishCost], ['Labor & overhead', result.pricing.laborCost]].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between text-[var(--tx2)]">
                    <span>{k}</span><span className="font-semibold text-[var(--tx)]">{fmt(v as number)}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-[var(--tx3)] mt-2">
                {result.pricing.totalSqft} sq ft of steel · ~{result.pricing.weightKg} kg total weight
              </div>
            </div>

            {/* CTA */}
            <div className="bg-[var(--dk)] rounded-[13px] px-4 py-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-white/50 text-[12px] mb-0.5">Estimated Price (excl. GST)</div>
                <div className="text-white text-[20px] font-black">
                  {fmt(result.pricing.estimateMin)} – {fmt(result.pricing.estimateMax)}
                </div>
              </div>
              <div className="flex gap-2">
                {result.savedToAccount && !submittingOrder && (
                  <button onClick={handleSubmitToAdmin}
                    className="flex items-center gap-1.5 bg-[var(--ac)] text-white font-bold text-[14px] px-4 py-2.5 rounded-[10px]">
                    <CheckCircle2 size={15} />Send for Review
                  </button>
                )}
                {submittingOrder && (
                  <span className="text-white/70 text-[13px] px-3 py-2.5">Submitting…</span>
                )}
                <button onClick={startOver}
                  className="flex items-center gap-1.5 bg-white/10 border border-white/20 text-white font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px]">
                  <RefreshCw size={15} />New Design
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

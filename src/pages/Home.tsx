// ════════════════════════════════════════════════════════════════
// Home.tsx — redesigned with breathing room + inline filters
//
// Design principles:
//   • ONE focal point per section — not everything at once
//   • Left/right split hero — text vs visual, not wall of text
//   • Inline filter chips on products and testimonials
//   • Journey picker as a tab (not 3 heavy cards)
//   • Stats get their own breathable row — not crammed into hero
// ════════════════════════════════════════════════════════════════
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Building2, Wand2, ArrowRight,
  Phone, ChevronRight, Star,
} from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { CompareBar } from '../components/ui/shared';
import { STATS, JOURNEYS, B2B_SECTORS, TRUST, TESTIMONIALS } from '../data/constants';
import { useAppDispatch, useAppSelector } from '../store';
import { uiActions } from '../store/slices';

// ─── Tiny reusable chip ──────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-all',
        active
          ? 'bg-[var(--dk)] text-white shadow-s1'
          : 'bg-[var(--sf)] border border-[var(--br)] text-[var(--tx2)] hover:border-[var(--dk)] hover:text-[var(--dk)]',
      ].join(' ')}>
      {label}
    </button>
  );
}

export default function Home() {
  const navigate   = useNavigate();
  const dispatch   = useAppDispatch();
  const categories = useAppSelector(s => s.catalog.categories);
  const products   = useAppSelector(s => s.catalog.products);
  const recentlyViewed = useAppSelector(s => s.ui.recentlyViewed);

  // ── filter states ──────────────────────────────────────────
  const [activeJourney, setActiveJourney] = useState(0);
  const [activeCat,     setActiveCat]     = useState('all');
  const [activeReview,  setActiveReview]  = useState('All');
  const reviewRef = useRef<HTMLDivElement>(null);

  const journey = JOURNEYS[activeJourney];

  // product filter
  const visibleProducts = activeCat === 'all'
    ? products.slice(0, 8)
    : products.filter(p => p.cat === activeCat).slice(0, 8);

  // testimonial filter
  const reviewTabs = ['All', 'B2B', 'B2C · Retail', 'B2C · Custom'];
  const visibleReviews = activeReview === 'All'
    ? TESTIMONIALS
    : TESTIMONIALS.filter(t => t.tag.startsWith(activeReview));

  return (
    <div className="animate-up">

      {/* ══════════════════════════════════════════════════════
          1. HERO — split layout, single focal point each side
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[var(--dk)] min-h-[88vh] flex items-center relative overflow-hidden">

        {/* Subtle background grain */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        {/* Accent glow — top right */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at top right, rgba(200,130,10,.12) 0%, transparent 60%)' }} />

        <div className="max-w-[1200px] mx-auto w-full px-5 py-16 grid md:grid-cols-2 gap-8 lg:gap-16 relative z-10">

          {/* LEFT — the message */}
          <div className="flex flex-col justify-center">

            {/* Eyebrow — small, one line, no pill border overload */}
            <div className="flex items-center gap-2 mb-6">
              <span className="w-6 h-[2px] bg-[var(--ac)]" />
              <span className="text-[11px] font-bold tracking-[.18em] uppercase text-[var(--ac)]">
                Direct Factory · No Middlemen
              </span>
            </div>

            {/* Headline — short, bold, two lines max */}
            <h1 className="text-[clamp(2.1rem,5vw,3.2rem)] font-black text-white leading-[1.06] tracking-tight mb-5">
              Steel Furniture<br />
              <span className="text-[var(--ac)]">Built for you.</span><br />
              Delivered India-wide.
            </h1>

            {/* Who it's for — 3 lines, scannable at a glance */}
            <div className="flex flex-col gap-2 mb-8">
              {[
                { who: 'Home buyers',       what: '500+ ready-to-ship SKUs from ₹3,200',              icon: '🏠' },
                { who: 'Custom orders',     what: 'AI-designed spec sheet, we fabricate to it',        icon: '✏️' },
                { who: 'Bulk & B2B',        what: 'Tiered pricing, GST invoice, fleet delivery',       icon: '🏭' },
              ].map(r => (
                <div key={r.who} className="flex items-center gap-3">
                  <span className="text-base leading-none">{r.icon}</span>
                  <span className="text-white/90 text-[14px]">
                    <strong className="font-bold">{r.who}</strong>
                    <span className="text-white/50 mx-1.5">—</span>
                    <span className="text-white/65">{r.what}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Primary CTA — one bold action */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/store')}
                className="inline-flex items-center justify-center gap-2 bg-[var(--ac)] hover:bg-[var(--ac2)]
                           text-white font-bold text-[15px] px-7 py-3.5 rounded-[12px]
                           transition-all hover:-translate-y-px shadow-[0_4px_20px_rgba(200,130,10,.35)]">
                <ShoppingBag size={18} />
                Browse Catalog
              </button>
              <div className="flex items-center gap-4 sm:pl-2">
                <button onClick={() => navigate('/ai')}
                  className="text-[13.5px] font-semibold text-white/65 hover:text-[var(--ac2)]
                             transition-colors flex items-center gap-1">
                  <Wand2 size={14} /> AI Design
                </button>
                <span className="w-px h-4 bg-white/20" />
                <button onClick={() => navigate('/wholesale')}
                  className="text-[13.5px] font-semibold text-white/65 hover:text-[#67D5E8]
                             transition-colors flex items-center gap-1">
                  <Building2 size={14} /> Bulk Quote
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — visual anchor: "what will I get?" card */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full max-w-[380px] bg-white/[.05] border border-white/10 rounded-[22px] overflow-hidden">

              {/* card header */}
              <div className="px-5 pt-5 pb-4 border-b border-white/[.08]">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[var(--ac)]" />
                  <span className="text-[11px] font-bold text-white/40 tracking-wider uppercase">
                    AI Spec Sheet · Live Preview
                  </span>
                </div>
                <div className="text-[17px] font-extrabold text-white">3-Door Steel Almirah</div>
                <div className="text-[12px] text-white/40 mt-0.5">78″ H × 48″ W × 20″ D · 0.6mm CR Steel</div>
              </div>

              {/* 4-view SVG grid */}
              <div className="grid grid-cols-2 gap-px bg-white/[.05] p-px">
                {[
                  { label: 'Front', lines: [[14,8,30,8],[14,8,14,36],[30,8,30,36],[14,36,30,36],[14,22,30,22],[22,8,22,22]] },
                  { label: 'Side',  lines: [[14,8,22,8],[14,8,14,36],[22,8,22,36],[14,36,22,36],[14,22,22,22]] },
                  { label: 'Top',   lines: [[8,14,36,14],[8,14,8,26],[36,14,36,26],[8,26,36,26],[22,14,22,26]] },
                  { label: 'Inside',lines: [[14,8,30,8],[14,8,14,36],[30,8,30,36],[14,36,30,36],[17,12,27,18],[17,22,27,28]] },
                ].map(v => (
                  <div key={v.label} className="bg-white/[.04] flex flex-col items-center justify-center py-4 gap-2">
                    <svg viewBox="0 0 44 44" width="52" height="52" fill="none">
                      {v.lines.map(([x1,y1,x2,y2], i) => (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                              stroke="rgba(200,130,10,.7)" strokeWidth="1.2" strokeLinecap="round" />
                      ))}
                    </svg>
                    <span className="text-[9.5px] font-bold text-white/30 tracking-wider uppercase">{v.label}</span>
                  </div>
                ))}
              </div>

              {/* spec rows */}
              <div className="px-5 py-4 space-y-2">
                {[
                  ['Doors',    '3 · Key Lock'],
                  ['Shelves',  '4 adjustable'],
                  ['Colour',   'Slate Grey'],
                  ['Estimate', '₹14,800 – ₹17,200'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[12px]">
                    <span className="text-white/35">{k}</span>
                    <span className={k === 'Estimate'
                      ? 'font-extrabold text-[var(--ac2)]'
                      : 'font-semibold text-white/75'}>{v}</span>
                  </div>
                ))}
                <button onClick={() => navigate('/ai')}
                  className="w-full mt-3 py-2.5 rounded-[10px] text-[13px] font-bold
                             bg-[var(--ac)] hover:bg-[var(--ac2)] text-white transition-colors">
                  Design yours →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          2. STATS — own section, not crammed into hero
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[var(--bg2)] border-b border-[var(--br)]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[var(--br)]">
            {STATS.map(({ n, l, sub }) => (
              <div key={l} className="px-6 py-6 flex flex-col gap-0.5">
                <div className="text-[2rem] font-black text-[var(--dk)] leading-none">{n}</div>
                <div className="text-[13px] font-bold text-[var(--tx)]">{l}</div>
                <div className="text-[11px] text-[var(--tx3)]">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          3. HOW TO BUY — tab switcher, not 3 heavy cards
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[var(--bg)]">
        <div className="max-w-[960px] mx-auto px-5">

          {/* section label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-[2px] bg-[var(--ac)]" />
            <span className="text-[11px] font-bold tracking-[.16em] uppercase text-[var(--ac)]">How to buy</span>
          </div>
          <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold text-[var(--tx)] mb-6 leading-tight">
            Pick your path
          </h2>

          {/* tab switcher */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {JOURNEYS.map((j, i) => (
              <button key={j.tag}
                onClick={() => setActiveJourney(i)}
                className={[
                  'px-5 py-2 rounded-[10px] text-[13.5px] font-bold transition-all',
                  activeJourney === i
                    ? 'text-white shadow-s1'
                    : 'bg-[var(--sf)] border border-[var(--br)] text-[var(--tx2)] hover:border-[var(--br2)]',
                ].join(' ')}
                style={activeJourney === i ? { background: j.accent } : {}}>
                {j.title}
              </button>
            ))}
          </div>

          {/* active journey content — clean 2-col */}
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] overflow-hidden shadow-s1">
            <div className="grid md:grid-cols-2">

              {/* steps */}
              <div className="p-6 md:p-8 flex flex-col gap-5">
                {journey.steps.map((s, i) => (
                  <div key={s.n} className="flex gap-4">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[11px]
                                    font-extrabold text-white flex-shrink-0"
                         style={{ background: journey.accent }}>
                      {i + 1}
                    </div>
                    <div className="pt-0.5">
                      <div className="text-[14px] font-bold text-[var(--tx)] mb-0.5">{s.t}</div>
                      <div className="text-[12.5px] text-[var(--tx3)] leading-relaxed">{s.d}</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate(journey.path)}
                  className="mt-2 self-start inline-flex items-center gap-1.5 font-bold text-[13.5px]
                             px-5 py-2.5 rounded-[10px] text-white transition-all hover:-translate-y-px"
                  style={{ background: journey.accent }}>
                  {journey.cta} <ArrowRight size={14} />
                </button>
              </div>

              {/* visual panel */}
              <div className="hidden md:flex items-center justify-center p-8 border-l border-[var(--br)]"
                   style={{ background: journey.accent + '08' }}>
                {activeJourney === 0 && (
                  <div className="text-center">
                    <div className="text-[56px] mb-3">🛋️</div>
                    <div className="text-[18px] font-extrabold text-[var(--tx)] mb-1">500+ SKUs</div>
                    <div className="text-[12.5px] text-[var(--tx3)]">Almirahs, Wardrobes, Desks, Racks, School sets</div>
                    <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                      {['COD available', '3–7 day delivery', 'Free returns'].map(f => (
                        <span key={f} className="text-[10.5px] font-semibold bg-[var(--bg2)]
                                                  border border-[var(--br)] text-[var(--tx2)]
                                                  px-2.5 py-1 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {activeJourney === 1 && (
                  <div className="text-center">
                    <div className="text-[56px] mb-3">✏️</div>
                    <div className="text-[18px] font-extrabold text-[var(--tx)] mb-1">AI-Powered Design</div>
                    <div className="text-[12.5px] text-[var(--tx3)] mb-4">Describe it in plain language — get a full spec sheet</div>
                    <div className="bg-[var(--bg2)] border border-[var(--br)] rounded-[12px] p-3 text-left text-[12px] text-[var(--tx2)] italic">
                      "I need a 6-foot wardrobe with 2 doors,<br/>a mirror on one side, navy blue colour,<br/>and a digital lock…"
                    </div>
                  </div>
                )}
                {activeJourney === 2 && (
                  <div className="text-center">
                    <div className="text-[56px] mb-3">🏭</div>
                    <div className="text-[18px] font-extrabold text-[var(--tx)] mb-1">Quote in 4 Hours</div>
                    <div className="text-[12.5px] text-[var(--tx3)] mb-4">Share your requirement — we send tiered pricing</div>
                    <div className="flex flex-col gap-2 text-left">
                      {['10–49 units — Standard bulk rate', '50–199 units — Volume discount', '200+ units — Custom contract pricing'].map(t => (
                        <div key={t} className="flex items-center gap-2 text-[12px] text-[var(--tx2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] flex-shrink-0" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          4. PRODUCTS — with inline category filter
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[var(--bg2)]">
        <div className="max-w-[1200px] mx-auto px-5">

          {/* header + filter chips */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-[2px] bg-[var(--ac)]" />
                <span className="text-[11px] font-bold tracking-[.16em] uppercase text-[var(--ac)]">Catalog</span>
              </div>
              <h2 className="text-[clamp(1.3rem,2.8vw,1.75rem)] font-extrabold text-[var(--tx)]">Browse Products</h2>
            </div>
            <button onClick={() => navigate('/store')}
              className="text-[13px] font-semibold text-[var(--tx3)] hover:text-[var(--dk)]
                         flex items-center gap-1 transition-colors self-start sm:self-auto shrink-0">
              View all <ChevronRight size={14} />
            </button>
          </div>

          {/* filter chips — scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-6">
            <Chip
              label="All"
              active={activeCat === 'all'}
              onClick={() => setActiveCat('all')}
            />
            {categories.filter(c => c.id !== 'all').map(c => (
              <Chip
                key={c.id}
                label={c.n}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
              />
            ))}
          </div>

          {/* product grid */}
          {visibleProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {visibleProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="py-14 text-center text-[var(--tx3)] text-[13.5px]">
              No products in this category yet.
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          5. B2B STRIP — compact, horizontal, single CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[var(--bg)]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col md:flex-row md:items-center gap-8">

            {/* left — copy */}
            <div className="md:w-72 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-[2px] bg-[#0891B2]" />
                <span className="text-[11px] font-bold tracking-[.16em] uppercase text-[#0891B2]">B2B & Institutional</span>
              </div>
              <h2 className="text-[1.5rem] font-extrabold text-[var(--tx)] mb-3 leading-tight">
                Serving every industry at scale
              </h2>
              <button onClick={() => navigate('/wholesale')}
                className="inline-flex items-center gap-1.5 bg-[#0891B2] hover:bg-[#0779A0]
                           text-white font-bold text-[13.5px] px-5 py-2.5 rounded-[10px] transition-all">
                <Building2 size={15} />Get Bulk Quote
              </button>
            </div>

            {/* right — sector tiles, scrollable on mobile */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 flex-1">
              {B2B_SECTORS.map(s => (
                <button key={s.label}
                  onClick={() => navigate('/wholesale')}
                  className="flex-shrink-0 bg-[var(--sf)] border border-[var(--br)] rounded-[14px]
                             px-4 py-4 text-left min-w-[140px] hover:border-[#0891B2]
                             hover:-translate-y-0.5 hover:shadow-s2 transition-all group">
                  <i className={`ti ${s.ic} text-[24px] text-[var(--dk)] group-hover:text-[#0891B2]
                                  transition-colors block mb-2`} />
                  <div className="text-[12.5px] font-extrabold text-[var(--tx)]">{s.label}</div>
                  <div className="text-[11px] font-black text-[#0891B2] mt-1">{s.n}</div>
                  <div className="text-[9.5px] text-[var(--tx3)]">{s.unit}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          6. TRUST — horizontal strip, not a card grid
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[var(--dk)] py-10">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {TRUST.map(({ ic, t, d }) => (
              <div key={t} className="flex items-center gap-3 flex-shrink-0 py-1">
                <div className="w-9 h-9 rounded-[10px] bg-[rgba(200,130,10,.15)] flex items-center justify-center flex-shrink-0">
                  <i className={`ti ${ic} text-[18px] text-[var(--ac2)]`} />
                </div>
                <div>
                  <div className="text-[12.5px] font-bold text-white whitespace-nowrap">{t}</div>
                  <div className="text-[11px] text-white/45 whitespace-nowrap">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          7. TESTIMONIALS — with B2B / B2C filter tabs
      ══════════════════════════════════════════════════════ */}
      <section className="py-16 bg-[var(--bg2)]">
        <div className="max-w-[1200px] mx-auto px-5">

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-[2px] bg-[var(--ac)]" />
                <span className="text-[11px] font-bold tracking-[.16em] uppercase text-[var(--ac)]">Reviews</span>
              </div>
              <h2 className="text-[clamp(1.3rem,2.8vw,1.75rem)] font-extrabold text-[var(--tx)]">What customers say</h2>
            </div>

            {/* filter tabs */}
            <div ref={reviewRef} className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {reviewTabs.map(tab => (
                <Chip
                  key={tab}
                  label={tab}
                  active={activeReview === tab}
                  onClick={() => setActiveReview(tab)}
                />
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {visibleReviews.map(t => (
              <div key={t.n}
                className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-5
                           flex flex-col gap-3 hover:shadow-s2 hover:-translate-y-0.5 transition-all">

                {/* stars + segment tag */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13}
                            className={i < t.r ? 'text-amber-400 fill-amber-400' : 'text-[var(--br2)]'} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-[var(--tx3)] bg-[var(--bg2)]
                                   border border-[var(--br)] px-2 py-0.5 rounded-full">
                    {t.tag}
                  </span>
                </div>

                {/* quote */}
                <p className="text-[13px] text-[var(--tx2)] leading-[1.7] flex-1">"{t.t}"</p>

                {/* reviewer */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-[var(--br)]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center
                                  text-white text-[12px] font-extrabold flex-shrink-0"
                       style={{ background: t.bg }}>
                    {t.a}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold text-[var(--tx)]">{t.n}</div>
                    <div className="text-[10.5px] text-[var(--tx3)] leading-tight">{t.ro}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          8. RECENTLY VIEWED
      ══════════════════════════════════════════════════════ */}
      {recentlyViewed.length > 0 && (
        <section className="py-14 bg-[var(--bg)]">
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[1.1rem] font-extrabold text-[var(--tx)]">Continue where you left off</h2>
              <button onClick={() => dispatch(uiActions.clearRecentlyViewed())}
                className="text-[12px] text-[var(--tx3)] hover:text-[var(--re)] transition-colors">
                Clear
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {recentlyViewed.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          9. FINAL CTA — single, clean, not a two-col split
      ══════════════════════════════════════════════════════ */}
      <section className="bg-[var(--dk)] py-16">
        <div className="max-w-[720px] mx-auto px-5 text-center">
          <div className="text-[11px] font-bold tracking-[.18em] uppercase text-[var(--ac)] mb-4">
            Ready to order?
          </div>
          <h2 className="text-[clamp(1.5rem,4vw,2.2rem)] font-black text-white mb-3 leading-tight">
            Factory-direct pricing.<br />No showroom markup.
          </h2>
          <p className="text-white/50 text-[14px] mb-8 leading-relaxed">
            Retail, custom-built, or bulk institutional — one platform handles all three.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => navigate('/store')}
              className="inline-flex items-center gap-2 bg-[var(--ac)] hover:bg-[var(--ac2)]
                         text-white font-bold text-[14.5px] px-7 py-3.5 rounded-[12px]
                         transition-all hover:-translate-y-px shadow-[0_4px_20px_rgba(200,130,10,.35)]">
              <ShoppingBag size={17} />Shop Now
            </button>
            <button onClick={() => navigate('/wholesale')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/16
                         text-white font-bold text-[14.5px] px-7 py-3.5 rounded-[12px]
                         border border-white/20 transition-all">
              <Building2 size={17} />Bulk Quote
            </button>
            <a href="tel:18001234567"
              className="inline-flex items-center gap-2 text-white/65 hover:text-white
                         font-semibold text-[14px] px-4 py-3.5 transition-colors">
              <Phone size={16} />Call us
            </a>
          </div>
        </div>
      </section>

      <CompareBar />
    </div>
  );
}

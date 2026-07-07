import { useNavigate } from 'react-router-dom';
import {
  Factory, ShoppingBag, Mail, BadgeCheck as Certificate,
  Truck, Award, Zap, RefreshCw, Headphones,
} from 'lucide-react';

const WHY = [
  { Icon: Certificate,  t: 'Quality First',     d: 'Strict quality checks before every shipment.' },
  { Icon: Headphones,   t: 'Customer Centric',  d: 'Continuous improvement based on feedback.' },
  { Icon: RefreshCw,    t: 'Sustainable',        d: 'Eco-friendly powder coatings throughout.' },
  { Icon: Zap,          t: 'Made in India',      d: '100% manufactured locally.' },
  { Icon: Truck,        t: 'Own Logistics',      d: 'Safe, on-time delivery fleet.' },
  { Icon: Award,        t: 'After-Sales',        d: 'Dedicated support 6 days a week.' },
];

const TIMELINE = [
  ['2009', 'Founded in Hyderabad with 5 employees and a small workshop in Balanagar.'],
  ['2012', 'Launched wholesale division for schools, hospitals and government bodies.'],
  ['2015', 'Expanded to 20,000 sq. ft. facility. Reached 10 cities across South India.'],
  ['2018', 'Launched e-commerce platform and AI Custom Furniture Builder.'],
  ['2021', 'Crossed 50,000+ units sold. Expanded to 50+ cities nationwide.'],
  ['2024', '15-year anniversary. New premium product line and upgraded platform.'],
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="animate-up">
      {/* ── HERO ── */}
      <section className="bg-[var(--dk)] py-[clamp(44px,6vw,68px)] px-5">
        <div className="max-w-[640px] mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-[rgba(200,130,10,.16)] border border-[rgba(200,130,10,.35)]
                          text-[var(--ac2)] text-[11px] font-bold px-3.5 py-1 rounded-full tracking-widest uppercase mb-4">
            <Factory size={12} />About SteelCraft
          </div>
          <h1 className="text-[clamp(1.8rem,4.5vw,2.8rem)] font-black text-white leading-tight mb-3">
            Built on Steel.<br />
            <em className="not-italic text-[var(--ac2)]">Driven by Trust.</em>
          </h1>
          <p className="text-white/63 leading-relaxed">
            India's premier steel furniture manufacturer since 2009. Quality for every space.
          </p>
          <div className="flex gap-2.5 justify-center mt-6 flex-wrap">
            <button onClick={() => navigate('/store')}
              className="flex items-center gap-1.5 bg-[var(--ac)] hover:bg-[var(--ac2)] text-white
                         font-bold text-[14.5px] px-6 py-3 rounded-[11px] transition-all">
              <ShoppingBag size={17} />Shop Now
            </button>
            <button onClick={() => navigate('/contact')}
              className="flex items-center gap-1.5 bg-transparent border border-white/27 text-white
                         font-semibold text-sm px-5 py-2.5 rounded-[11px] hover:bg-white/9 transition-all">
              <Mail size={17} />Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[var(--sf)] border-b border-[var(--br)]">
        <div className="max-w-[820px] mx-auto px-4 py-4 grid grid-cols-4 gap-3">
          {[['📅','2009','Founded'],['👥','10,000+','Customers'],['🏅','500+','Products'],['📍','50+','Cities']].map(([em,n,l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl mb-1">{em}</div>
              <div className="text-[20px] font-black text-[var(--tx)] leading-none">{n}</div>
              <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="py-[clamp(38px,6vw,62px)] bg-[var(--bg)]">
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ac)] mb-2">Our Story</div>
          <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold text-[var(--tx)] mb-5">
            15 Years of Craftsmanship
          </h2>
          <p className="text-[15px] text-[var(--tx2)] leading-[1.8] mb-4">
            SteelCraft was founded in Hyderabad in 2009 with a simple mission: deliver high-quality,
            affordable steel furniture to every Indian household and business. From a small workshop
            with 5 employees, we've grown to a 50,000 sq. ft. facility with 200+ skilled craftsmen.
          </p>
          <p className="text-[15px] text-[var(--tx2)] leading-[1.8]">
            Today we serve retail customers, bulk buyers, schools, hospitals and government institutions
            across 50+ cities in India. Every product passes strict quality checks before leaving our facility.
          </p>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-[var(--dk)] py-[clamp(44px,6vw,68px)]">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ac2)] mb-2">Our Values</div>
            <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold text-white">What we stand for</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WHY.map(({ Icon, t, d }) => (
              <div key={t}
                className="bg-white/[.055] border border-white/[.09] rounded-2xl p-5 text-center hover:bg-white/10 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[rgba(200,130,10,.18)] flex items-center justify-center mx-auto mb-2.5">
                  <Icon size={22} className="text-[var(--ac2)]" />
                </div>
                <div className="text-[13px] font-bold text-white mb-1">{t}</div>
                <div className="text-[11.5px] text-white/48 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="py-[clamp(38px,6vw,62px)] bg-[var(--bg2)]">
        <div className="max-w-[800px] mx-auto px-4">
          <div className="text-center mb-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ac)] mb-2">Journey</div>
            <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold text-[var(--tx)]">Our Milestones</h2>
          </div>
          {TIMELINE.map(([yr, ev], i) => (
            <div key={yr} className="flex gap-3.5 mb-5 items-start">
              <span className="text-[13px] font-extrabold text-[var(--ac)] min-w-[38px] text-right flex-shrink-0 pt-0.5">
                {yr}
              </span>
              <div className="flex flex-col items-center flex-shrink-0 self-stretch">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0
                                 ${i === TIMELINE.length - 1 ? 'bg-[var(--ac)]' : 'bg-[var(--dk)]'}`} />
                {i < TIMELINE.length - 1 && (
                  <div className="w-[2px] flex-1 bg-[var(--br)] mt-1" />
                )}
              </div>
              <p className="text-[14px] text-[var(--tx2)] leading-[1.65] pb-4">{ev}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[var(--ac)] py-[clamp(36px,5vw,52px)] px-5 text-center">
        <h2 className="text-[clamp(1.3rem,3vw,1.75rem)] font-black text-white mb-2">
          Ready to work with us?
        </h2>
        <p className="text-sm text-white/88 mb-5 max-w-[460px] mx-auto leading-relaxed">
          Whether buying for home or ordering in bulk, we've got you covered.
        </p>
        <button
          onClick={() => navigate('/contact')}
          className="inline-flex items-center gap-1.5 bg-white text-[var(--ac)] font-extrabold
                     text-[14.5px] px-7 py-3 rounded-[11px] hover:bg-white/90 hover:-translate-y-px transition-all">
          📩 Get in Touch
        </button>
      </section>
    </div>
  );
}

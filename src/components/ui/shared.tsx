// ════════════════════════════════════════════════════════════════
// Shared UI primitives — design tokens enforced here so the rest
// of the codebase can stay clean.
// ════════════════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import { compareActions } from '../../store/slices';
import { stars, fmt, pct } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

// ─── EMPTY STATE ─────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: { label: string; to: string };
}
export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  const navigate = useNavigate();
  return (
    <div className="max-w-[340px] mx-auto mt-12 px-4 text-center">
      <div className="w-[68px] h-[68px] bg-[var(--bg2)] border border-[var(--br)] rounded-[20px]
                      flex items-center justify-center mx-auto mb-4 shadow-s1">
        <Icon size={32} className="text-[var(--tx3)]" />
      </div>
      <div className="text-[18px] font-extrabold text-[var(--tx)] mb-1.5">{title}</div>
      {subtitle && (
        <div className="text-[13px] text-[var(--tx2)] mb-5 leading-relaxed">{subtitle}</div>
      )}
      {action && (
        <Btn onClick={() => navigate(action.to)}>{action.label}</Btn>
      )}
    </div>
  );
}

// ─── STAR RATING ─────────────────────────────────────────────
export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {stars(rating).map((filled, i) => (
        <svg key={i} viewBox="0 0 20 20"
             className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-[var(--br2)]'}`}
             fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {count !== undefined && (
        <span className="text-[11px] text-[var(--tx3)] ml-1.5">({count})</span>
      )}
    </div>
  );
}

// ─── QUANTITY CONTROL ────────────────────────────────────────
export function QuantityControl({ value, onInc, onDec }: { value: number; onInc: () => void; onDec: () => void }) {
  return (
    <div className="flex items-center border border-[var(--br)] rounded-[10px] overflow-hidden shadow-s1">
      <button onClick={onDec}
              className="px-3.5 py-2.5 text-lg font-bold text-[var(--tx)]
                         bg-[var(--bg2)] hover:bg-[var(--bg3)] transition-colors leading-none">−</button>
      <span className="px-4 font-extrabold text-[15px] text-[var(--tx)] min-w-[44px] text-center">{value}</span>
      <button onClick={onInc}
              className="px-3.5 py-2.5 text-lg font-bold text-[var(--tx)]
                         bg-[var(--bg2)] hover:bg-[var(--bg3)] transition-colors leading-none">+</button>
    </div>
  );
}

// ─── COMPARE BAR ─────────────────────────────────────────────
export function CompareBar() {
  const dispatch = useAppDispatch();
  const compare  = useAppSelector(s => s.compare);
  const navigate = useNavigate();
  if (!compare.length) return null;

  return (
    <div className="fixed bottom-[62px] md:bottom-0 left-0 right-0 z-[180] animate-up">
      <div className="glass border-t border-white/15 px-4 py-3 flex items-center gap-3 flex-wrap
                      bg-[rgba(13,40,71,.92)] dark:bg-[rgba(6,14,28,.95)]">
        <span className="text-[13px] font-bold text-white/90 flex-shrink-0">
          Compare ({compare.length}/3)
        </span>
        <div className="flex gap-2 flex-1 flex-wrap">
          {compare.map(p => (
            <span key={p.id}
                  className="bg-white/12 border border-white/20 text-white/80 text-[11.5px]
                             px-2.5 py-1 rounded-[8px] flex items-center gap-1.5">
              {p.n.slice(0, 18)}{p.n.length > 18 && '…'}
              <button onClick={() => dispatch(compareActions.toggleCompare(p))}
                      className="text-white/50 hover:text-white transition-colors ml-0.5 text-base leading-none">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => navigate('/compare')}
                  className="bg-[var(--ac)] hover:bg-[var(--ac2)] text-white text-[12.5px]
                             font-bold px-4 py-2 rounded-[9px] transition-all">
            Compare →
          </button>
          <button onClick={() => dispatch(compareActions.clearCompare())}
                  className="bg-white/10 border border-white/20 text-white/80 text-[12px]
                             px-3 py-2 rounded-[9px] hover:bg-white/18 transition-all">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────
interface SHProps { tag?: string; title: string; sub?: string; center?: boolean; }
export function SectionHeader({ tag, title, sub, center }: SHProps) {
  return (
    <div className={`mb-6 md:mb-8 ${center ? 'text-center' : ''}`}>
      {tag && (
        <div className={`text-[10.5px] font-extrabold uppercase tracking-[.14em]
                          text-[var(--ac)] mb-2 flex items-center gap-1.5
                          ${center ? 'justify-center' : ''}`}>
          <span className="inline-block w-4 h-[1.5px] bg-[var(--ac)] opacity-60" />
          {tag}
          <span className="inline-block w-4 h-[1.5px] bg-[var(--ac)] opacity-60" />
        </div>
      )}
      <h2 className="text-[clamp(1.35rem,3vw,1.8rem)] font-extrabold text-[var(--tx)] leading-tight">{title}</h2>
      {sub && (
        <p className="text-[.875rem] text-[var(--tx2)] max-w-[440px] leading-relaxed mt-1.5
                      ${center ? 'mx-auto' : ''}">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── PRICE DISPLAY ───────────────────────────────────────────
export function PriceDisplay({ price, original }: { price: number; original: number }) {
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span className="text-[18px] font-black text-[var(--tx)]">{fmt(price)}</span>
      <span className="text-[12px] text-[var(--tx3)] line-through">{fmt(original)}</span>
      <span className="text-[10px] font-bold bg-[rgba(200,130,10,.12)] text-[var(--ac)]
                       border border-[rgba(200,130,10,.28)] px-2 py-0.5 rounded-[7px]">
        {pct(original, price)}% OFF
      </span>
    </div>
  );
}

// ─── INPUT FIELD ─────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
}
export const Field = ({ label, error, hint, className = '', ...props }: InputProps) => (
  <div className={className}>
    {label && (
      <label className="block text-[12px] font-bold text-[var(--tx2)] mb-1 uppercase tracking-wide">
        {label}
      </label>
    )}
    <input
      className={`sc-input ${error ? 'error' : ''}`}
      {...props}
    />
    {hint && !error && <p className="text-[11px] text-[var(--tx3)] mt-1">{hint}</p>}
    {error && <p className="text-[11px] text-[var(--re)] mt-1 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

// ─── SELECT FIELD ────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}
export const SelectField = ({ label, error, children, className = '', ...props }: SelectProps) => (
  <div className={className}>
    {label && (
      <label className="block text-[12px] font-bold text-[var(--tx2)] mb-1 uppercase tracking-wide">
        {label}
      </label>
    )}
    <select className={`sc-input ${error ? 'error' : ''}`} {...props}>
      {children}
    </select>
    {error && <p className="text-[11px] text-[var(--re)] mt-1">⚠ {error}</p>}
  </div>
);

// ─── TEXTAREA ────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}
export const Textarea = ({ label, error, className = '', ...props }: TextareaProps) => (
  <div className={className}>
    {label && (
      <label className="block text-[12px] font-bold text-[var(--tx2)] mb-1 uppercase tracking-wide">
        {label}
      </label>
    )}
    <textarea
      className={`sc-input resize-y min-h-[90px] ${error ? 'error' : ''}`}
      {...props}
    />
    {error && <p className="text-[11px] text-[var(--re)] mt-1">⚠ {error}</p>}
  </div>
);

// ─── PRIMARY BUTTON ──────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  fullWidth?: boolean;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export const Btn = ({
  variant = 'primary', fullWidth, children,
  className = '', size = 'md', ...props
}: BtnProps) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-bold rounded-[10px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]';

  const sizes = {
    sm: 'text-[12px] px-3 py-1.5',
    md: 'text-[13.5px] px-4 py-2.5',
    lg: 'text-[15px] px-6 py-3',
  }[size];

  const variants = {
    primary:   'bg-[var(--dk)] hover:bg-[var(--dk2)] text-white shadow-s1 hover:shadow-s2 hover:-translate-y-px',
    accent:    'bg-[var(--ac)] hover:bg-[var(--ac2)] text-white shadow-s1 hover:shadow-s2 hover:-translate-y-px',
    secondary: 'bg-[var(--bg2)] text-[var(--tx)] border border-[var(--br)] hover:border-[var(--dk)] hover:text-[var(--dk)] hover:bg-[var(--bg3)]',
    outline:   'bg-transparent border-[1.5px] border-[var(--br2)] text-[var(--tx2)] hover:border-[var(--dk)] hover:text-[var(--dk)]',
    ghost:     'bg-transparent text-[var(--tx2)] hover:bg-[var(--bg3)] hover:text-[var(--tx)]',
    danger:    'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300',
  }[variant];

  return (
    <button
      className={[base, sizes, variants, fullWidth ? 'w-full' : '', className].join(' ')}
      {...props}>
      {children}
    </button>
  );
};

// ─── INFO CARD ───────────────────────────────────────────────
// Reusable metric / KPI card used in dashboards
interface InfoCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: string;
  onClick?: () => void;
}
export function InfoCard({ label, value, sub, icon, accent = 'var(--dk)', onClick }: InfoCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--sf)] border border-[var(--br)] rounded-[16px] p-4
                  shadow-s1 transition-all
                  ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-s2 hover:border-[var(--br2)]' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        {icon && (
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
               style={{ background: accent + '18', color: accent }}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-[22px] font-black text-[var(--tx)] leading-none">{value}</div>
      <div className="text-[12.5px] font-semibold text-[var(--tx2)] mt-1">{label}</div>
      {sub && <div className="text-[11px] text-[var(--tx3)] mt-0.5">{sub}</div>}
    </div>
  );
}

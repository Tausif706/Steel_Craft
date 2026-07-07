import { useNavigate } from 'react-router-dom';
import { Columns, ShoppingCart, Eye } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { compareActions, cartActions } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { BADGE_CLS } from '../data/constants';
import { fmt, pct, stars, catIC } from '../lib/utils';
import { EmptyState, Btn } from '../components/ui/shared';

export default function Compare() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notify   = useNotification();
  const compare  = useAppSelector(s => s.compare);
  const categories = useAppSelector(s => s.catalog.categories);

  if (compare.length < 2) return (
    <EmptyState
      icon={Columns}
      title="Select Products to Compare"
      subtitle="Tap the ⊞ icon on any product card to add up to 3 products."
      action={{ label: '🛍 Browse Store', to: '/store' }}
    />
  );

  type RowFn = (p: typeof compare[0]) => React.ReactNode;
  const ROWS: [string, RowFn][] = [
    ['Price', p => (
      <div>
        <span className="text-[17px] font-black text-[var(--tx)]">{fmt(p.p)}</span>{' '}
        <span className="text-[11px] text-[var(--tx3)] line-through">{fmt(p.o)}</span>{' '}
        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1">{pct(p.o, p.p)}% OFF</span>
      </div>
    )],
    ['Rating', p => (
      <div className="flex items-center gap-0.5 flex-wrap">
        {stars(p.r).map((f, i) => (
          <svg key={i} viewBox="0 0 20 20" className={`w-3.5 h-3.5 ${f ? 'text-amber-400' : 'text-[var(--br2)]'}`} fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-[11.5px] text-[var(--tx3)] ml-1">({p.rv})</span>
      </div>
    )],
    ['Material',   p => <span className="text-[13px] text-[var(--tx)]">{p.mat}</span>],
    ['Dimensions', p => <span className="text-[13px] text-[var(--tx)]">{p.dim}</span>],
    ['Weight',     p => <span className="text-[13px] text-[var(--tx)]">{p.wt}</span>],
    ['Warranty',   p => <span className="text-[13px] text-[var(--tx)]">{p.wa}</span>],
    ['Features', p => (
      <ul className="space-y-0.5">
        {p.f.map(f => (
          <li key={f} className="flex items-center gap-1 text-[12px] text-[var(--tx2)]">
            <span className="text-[var(--gr)] font-bold flex-shrink-0">✓</span>{f}
          </li>
        ))}
      </ul>
    )],
    ['Action', p => (
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => { dispatch(cartActions.addToCart(p)); notify('Added to cart! 🛒'); }}
          className="flex items-center gap-1 bg-[var(--dk)] text-white font-bold text-[11.5px] px-2.5 py-1.5 rounded-[7px] hover:bg-[var(--dk2)] transition-colors">
          <ShoppingCart size={13} />Add
        </button>
        <button
          onClick={() => navigate(`/product/${p.id}`)}
          className="flex items-center gap-1 bg-[var(--bg2)] border border-[var(--br)] text-[var(--tx2)] text-[11.5px] px-2.5 py-1.5 rounded-[7px] hover:border-[var(--dk)] transition-colors">
          <Eye size={13} />View
        </button>
      </div>
    )],
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-2.5 mb-5">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ac)] mb-1">
            Comparing {compare.length} Products
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold text-[var(--tx)]">Side-by-side</h1>
        </div>
        <Btn variant="secondary" onClick={() => dispatch(compareActions.clearCompare())}>Clear All</Btn>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table
          className="w-full border-collapse"
          style={{ minWidth: `${200 + compare.length * 200}px` }}>
          <thead>
            <tr>
              <th className="w-[130px] p-3 bg-[var(--bg2)] text-left text-[11px] font-bold uppercase
                             text-[var(--tx3)] rounded-tl-xl" />
              {compare.map((p) => (
                <th key={p.id} className="p-3 bg-[var(--sf)] border border-[var(--br)] text-left align-top">
                  {/* Product header cell */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-2"
                       style={{ background: p.bg }}>
                    <i className={`ti ${catIC(categories, p.cat)} text-[26px] text-white/35`} />
                  </div>
                  <div className="text-[13.5px] font-bold text-[var(--tx)] leading-tight mb-1">{p.n}</div>
                  {p.b && (
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${BADGE_CLS[p.b] ?? ''}`}>
                      {p.b}
                    </span>
                  )}
                  <button
                    onClick={() => dispatch(compareActions.toggleCompare(p))}
                    className="block mt-1 bg-red-100 border border-red-200 text-red-600
                               text-[11px] font-semibold px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors">
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, valFn], ri) => (
              <tr key={label}>
                <td className="p-3 bg-[var(--bg2)] text-[12px] font-bold text-[var(--tx2)] border border-[var(--br)]">
                  {label}
                </td>
                {compare.map((p) => (
                  <td key={p.id}
                    className="p-3 border border-[var(--br)] align-top"
                    style={{ background: ri % 2 === 0 ? 'var(--sf)' : 'var(--bg2)' }}>
                    {valFn(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

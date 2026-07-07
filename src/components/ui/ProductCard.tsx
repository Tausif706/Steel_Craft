// ════════════════════════════════════════════════════════════════
// ProductCard — elevated card design
//
// Visual language:
//   • Layered shadow (s1 resting → card-glow on hover)
//   • Image zone: gradient overlay + icon at correct size
//   • Discount pill bottom-right of image
//   • Wishlist heart top-right — fills red on save
//   • Action row: View + Add to Cart + Wish + Compare
//   • Hover: lift 3px, accent border glow
// ════════════════════════════════════════════════════════════════
import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingCart, Heart, Columns, Check } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { cartActions, wishActions, compareActions } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { fmt, pct, stars, catIC, catN } from '../../lib/utils';
import { BADGE_CLS } from '../../data/constants';
import type { Product } from '../../types';

interface Props { product: Product; }

export default function ProductCard({ product: p }: Props) {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const notify     = useNotification();
  const categories = useAppSelector(s => s.catalog.categories);
  const isWished   = useAppSelector(s => s.wish.items.some(i => i.id === p.id));
  const isCmp      = useAppSelector(s => s.compare.some(i => i.id === p.id));
  const cmpCount   = useAppSelector(s => s.compare.length);

  const handleWish = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(wishActions.toggleWish(p));
    notify(isWished ? 'Removed from wishlist' : 'Saved! ❤️', isWished ? 'info' : 'ok');
  };

  const handleCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(cartActions.addToCart(p));
    notify('Added to cart 🛒');
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCmp && cmpCount >= 3) { notify('Max 3 for comparison', 'info'); return; }
    dispatch(compareActions.toggleCompare(p));
  };

  const discount = pct(p.o, p.p);
  const starArr  = stars(p.r);

  return (
    <article
      onClick={() => navigate(`/product/${p.id}`)}
      className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] overflow-hidden
                 flex flex-col cursor-pointer shadow-s1 group
                 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[var(--card-glow)]
                 hover:border-[rgba(200,130,10,.32)]">

      {/* ── Image / colour block ─────────────────────────────── */}
      <div className="relative h-[168px] overflow-hidden" style={{ background: p.bg }}>
        {/* gradient overlay — makes icon + badges readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-[1]" />

        {p.img ? (
          <img src={p.img} alt={p.n}
               className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
        ) : (
          <i className={`ti ${catIC(categories, p.cat)} absolute inset-0 flex items-center justify-center
                         text-[56px] text-white/20 group-hover:text-white/30 group-hover:scale-110
                         transition-all duration-300`}
             style={{ display: 'flex' }} />
        )}

        {/* Category badge top-left */}
        {p.b && (
          <span className={`absolute top-2.5 left-2.5 z-[2] text-[10px] font-bold px-2.5 py-0.5
                            rounded-full shadow-s1 ${BADGE_CLS[p.b] ?? 'bg-amber-100 text-amber-800'}`}>
            {p.b}
          </span>
        )}

        {/* Discount pill bottom-right */}
        {discount > 0 && (
          <span className="absolute bottom-2.5 right-2.5 z-[2] bg-[var(--re)] text-white
                           text-[10px] font-extrabold px-1.5 py-0.5 rounded-[7px] shadow-s1">
            −{discount}%
          </span>
        )}

        {/* Wishlist heart top-right */}
        <button
          onClick={handleWish}
          title={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute top-2 right-2 z-[2] w-[30px] h-[30px] rounded-[9px]
                      flex items-center justify-center shadow-s1 transition-all
                      ${isWished
                        ? 'bg-red-100 text-red-500'
                        : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'}`}>
          <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Card body ────────────────────────────────────────── */}
      <div className="p-3.5 flex-1 flex flex-col gap-1">

        {/* Category label */}
        <div className="text-[9.5px] font-extrabold uppercase tracking-[.12em] text-[var(--tx3)]">
          {catN(categories, p.cat)}
        </div>

        {/* Product name */}
        <div className="text-[13.5px] font-bold text-[var(--tx)] leading-snug line-clamp-2">{p.n}</div>

        {/* Star rating */}
        <div className="flex items-center gap-0.5 mt-0.5">
          {starArr.map((filled, i) => (
            <svg key={i} viewBox="0 0 20 20"
                 className={`w-3 h-3 ${filled ? 'text-amber-400' : 'text-[var(--bg3)]'}`}
                 fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-[10.5px] text-[var(--tx3)] ml-1">({p.rv})</span>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-[17px] font-black text-[var(--tx)]">{fmt(p.p)}</span>
          <span className="text-[11.5px] text-[var(--tx3)] line-through">{fmt(p.o)}</span>
        </div>

        {/* Thin divider */}
        <div className="h-px bg-[var(--br)] my-1" />

        {/* Action row */}
        <div className="flex gap-1.5 mt-auto">
          {/* View */}
          <button
            onClick={e => { e.stopPropagation(); navigate(`/product/${p.id}`); }}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-[9px]
                       bg-[var(--bg2)] border border-[var(--br)] text-[11.5px] font-semibold
                       text-[var(--tx2)] hover:border-[var(--dk)] hover:text-[var(--dk)] transition-all">
            <Eye size={13} />View
          </button>

          {/* Add to cart — primary */}
          <button
            onClick={handleCart}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-[9px]
                       bg-[var(--dk)] hover:bg-[var(--dk2)] text-white text-[11.5px] font-bold
                       transition-all hover:shadow-s2 active:scale-[.98]">
            <ShoppingCart size={13} />Add
          </button>

          {/* Compare */}
          <button
            onClick={handleCompare}
            title="Compare"
            className={`w-8 flex items-center justify-center rounded-[9px] border transition-all
                        ${isCmp
                          ? 'bg-[var(--dk)] border-[var(--dk)] text-white'
                          : 'border-[var(--br)] text-[var(--tx3)] hover:border-[var(--ac)] hover:text-[var(--ac)]'}`}>
            {isCmp ? <Check size={13} /> : <Columns size={13} />}
          </button>
        </div>
      </div>
    </article>
  );
}

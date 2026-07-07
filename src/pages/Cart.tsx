import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ShoppingCartIcon, Shield } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { cartActions } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { catIC, catN, fmt } from '../lib/utils';
import { EmptyState, Btn } from '../components/ui/shared';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notify   = useNotification();
  const cart     = useAppSelector(s => s.cart.items);
  const categories = useAppSelector(s => s.catalog.categories);

  if (!cart.length) return (
    <EmptyState icon={ShoppingCartIcon} title="Cart is empty" subtitle="Browse our collection and add items."
      action={{ label: '🛍 Browse Store', to: '/store' }} />
  );

  const sub  = cart.reduce((s, i) => s + i.p * i.qty, 0);
  const gst  = Math.round(sub * 0.18);
  const ship = sub >= 10000 ? 0 : 599;
  const total = sub + gst + ship;

  return (
    <div className="max-w-[1040px] mx-auto px-4 py-6 animate-up">
      <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-extrabold text-[var(--tx)] mb-5">
        Cart <span className="text-[.6em] text-[var(--tx3)] font-normal">{cart.length} items</span>
      </h1>

      <div className="grid md:grid-cols-[2fr_1fr] gap-4 items-start">
        {/* Items */}
        <div>
          {cart.map(it => (
            <div key={it.id}
              className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] px-3.5 py-3 flex gap-3
                         items-center flex-wrap mb-2 hover:shadow-s2 transition-shadow">
              <div className="w-[58px] h-[58px] rounded-[11px] flex items-center justify-center flex-shrink-0"
                   style={{ background: it.bg }}>
                <i className={`ti ${catIC(categories, it.cat)} text-[25px] text-white/40`} />
              </div>
              <div className="flex-1 min-w-[90px]">
                <div className="text-[10px] font-bold uppercase text-[var(--tx3)] tracking-wider mb-0.5">{catN(categories, it.cat)}</div>
                <div className="text-[13px] font-bold text-[var(--tx)]">{it.n}</div>
                <div className="text-[13px] font-bold text-[var(--tx)] mt-0.5">
                  {fmt(it.p)} <span className="text-[11px] text-[var(--tx3)] line-through font-normal">{fmt(it.o)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center border border-[var(--br)] rounded-[9px] overflow-hidden">
                  <button onClick={() => dispatch(cartActions.updateQty({ id: it.id, delta: -1 }))}
                    className="px-2.5 py-1.5 bg-[var(--bg2)] text-base font-bold hover:bg-[var(--br2)] transition-colors">−</button>
                  <span className="px-3 font-bold text-[14px] text-[var(--tx)] min-w-[32px] text-center">{it.qty}</span>
                  <button onClick={() => dispatch(cartActions.updateQty({ id: it.id, delta: 1 }))}
                    className="px-2.5 py-1.5 bg-[var(--bg2)] text-base font-bold hover:bg-[var(--br2)] transition-colors">+</button>
                </div>
                <span className="font-extrabold text-[14.5px] text-[var(--tx)] min-w-[70px] text-right">
                  {fmt(it.p * it.qty)}
                </span>
                <button onClick={() => { dispatch(cartActions.removeFromCart(it.id)); notify('Removed', 'info'); }}
                  className="p-1.5 rounded-[7px] text-[var(--tx3)] hover:bg-red-100 hover:text-red-500 transition-all">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl p-4.5 sticky top-20">
          <h2 className="text-[16px] font-extrabold text-[var(--tx)] mb-4">Order Summary</h2>
          {[['Subtotal', fmt(sub)], ['GST (18%)', fmt(gst)], ['Shipping', ship === 0 ? 'Free ✓' : fmt(ship)]].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center mb-2.5 text-[13.5px]">
              <span className="text-[var(--tx2)]">{k}</span>
              <span className={`font-semibold ${v === 'Free ✓' ? 'text-[var(--gr)]' : 'text-[var(--tx)]'}`}>{v}</span>
            </div>
          ))}

          {ship > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-[12px] text-yellow-800 mb-3">
              Add {fmt(10000 - sub)} more for free shipping
            </div>
          )}

          <div className="border-t-2 border-[var(--br)] pt-3 my-3 flex justify-between items-center">
            <span className="text-[14.5px] font-extrabold text-[var(--tx)]">Total incl. GST</span>
            <span className="text-[20px] font-black text-[var(--tx)]">{fmt(total)}</span>
          </div>

          <Btn fullWidth onClick={() => navigate('/checkout')} className="mb-2 py-3 text-[14.5px]">
            Proceed to Checkout →
          </Btn>
          <Btn fullWidth variant="secondary" onClick={() => navigate('/store')} className="py-3">
            <ShoppingBag size={16} />Continue Shopping
          </Btn>

          <div className="flex items-center justify-center gap-1 mt-3 text-[11.5px] text-[var(--tx3)]">
            <Shield size={13} />Secure · GST Invoice included
          </div>
        </div>
      </div>
    </div>
  );
}

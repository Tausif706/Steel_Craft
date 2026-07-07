import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Columns, Check, Truck, Shield, RefreshCw, ChevronRight, Star } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { cartActions, wishActions, compareActions, uiActions } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { BADGE_CLS } from '../data/constants';
import { catIC, catN, stars } from '../lib/utils';
import { fetchProductReviews, submitReview } from '../lib/repo';
import { StarRating, CompareBar, PriceDisplay, Btn, Textarea } from '../components/ui/shared';
import ProductCard from '../components/ui/ProductCard';
import type { Review } from '../types';
import { SkeletonProductDetail } from '../components/ui/Skeleton';

export default function ProductDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const notify    = useNotification();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(5);
  const [myReviewText, setMyReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const products  = useAppSelector(s => s.catalog.products);
  const catalogStatus = useAppSelector(s => s.catalog.status);
  const categories = useAppSelector(s => s.catalog.categories);
  const userId     = useAppSelector(s => s.auth.userId);
  const p          = products.find(p => p.id === Number(id));
  const isWish   = useAppSelector(s => s.wish.items.some(i => i.id === p?.id));
  const isCmp    = useAppSelector(s => s.compare.some(i => i.id === p?.id));
  const cmpCount = useAppSelector(s => s.compare.length);

  useEffect(() => {
    if (p) dispatch(uiActions.addRecentlyViewed(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  useEffect(() => {
    setActiveImg(0);
    if (p) fetchProductReviews(p.id).then(setReviews).catch(() => {});
  }, [p?.id]);

  if (!p && catalogStatus === 'loading') return <SkeletonProductDetail />;

  if (!p) return (
    <div className="text-center py-20">
      <p className="text-[var(--tx2)] mb-4">Product not found.</p>
      <Link to="/store" className="text-[var(--ac)] font-bold">← Back to Store</Link>
    </div>
  );

  const related = products.filter(r => r.id !== p.id && r.cat === p.cat).slice(0, 4);
  const gallery = p.images && p.images.length > 0 ? p.images : (p.img ? [p.img] : []);
  const outOfStock = p.stock !== undefined && p.stock <= 0;

  const handleCart = () => {
    if (!p) return;
    if (outOfStock) { notify('This item is currently out of stock', 'error'); return; }
    for (let i = 0; i < qty; i++) dispatch(cartActions.addToCart(p));
    notify(`Added ${qty}× ${p.n} to cart! 🛒`);
  };
  const handleWish = () => {
    if (!p) return;
    dispatch(wishActions.toggleWish(p));
    notify(isWish ? 'Removed from wishlist' : 'Saved to wishlist! ❤️', isWish ? 'info' : 'ok');
  };
  const handleCompare = () => {
    if (!p) return;
    if (!isCmp && cmpCount >= 3) { notify('Max 3 products for comparison', 'info'); return; }
    dispatch(compareActions.toggleCompare(p));
  };

  async function handleSubmitReview() {
    if (!p) return;
    if (!myReviewText.trim()) { notify('Write a few words about the product', 'info'); return; }
    setSubmittingReview(true);
    try {
      await submitReview(p.id, myRating, '', myReviewText.trim());
      notify('Thanks for your review!');
      setMyReviewText('');
      setReviews(await fetchProductReviews(p.id));
    } catch (err: any) {
      notify(err.message ?? 'Could not submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="max-w-[1040px] mx-auto px-4 py-6 animate-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-[var(--tx3)] mb-5 flex-wrap">
        <Link to="/" className="text-[var(--tx2)] hover:text-[var(--ac)] transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/store" className="text-[var(--tx2)] hover:text-[var(--ac)] transition-colors">Store</Link>
        <ChevronRight size={12} />
        <span className="text-[var(--tx)] font-semibold">{p.n}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Image block */}
        <div>
          <div className="rounded-[20px] h-[280px] md:h-[330px] flex items-center justify-center relative overflow-hidden"
               style={{ background: p.bg }}>
            {gallery.length > 0 ? (
              <img src={gallery[activeImg]} alt={p.n} className="w-full h-full object-cover" />
            ) : (
              <i className={`ti ${catIC(categories, p.cat)} text-[80px] text-white/20`} />
            )}
            {p.b && (
              <span className={`absolute top-3.5 left-3.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${BADGE_CLS[p.b] ?? ''}`}>
                {p.b}
              </span>
            )}
            {outOfStock && (
              <span className="absolute top-3.5 right-3.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 text-white">
                Out of Stock
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar">
              {gallery.map((src, i) => (
                <button key={src} onClick={() => setActiveImg(i)}
                  className={`w-14 h-14 rounded-[10px] overflow-hidden flex-shrink-0 border-2 transition-colors
                              ${i === activeImg ? 'border-[var(--ac)]' : 'border-transparent opacity-70'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-3.5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ac)] mb-2 flex items-center gap-1">
              <i className={`ti ${catIC(categories, p.cat)}`} />{catN(categories, p.cat)}
            </div>
            <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-black text-[var(--tx)] leading-tight mb-2">{p.n}</h1>
            <div className="flex items-center gap-1.5">
              <StarRating rating={p.r} count={p.rv} />
              <span className="text-[14px] font-bold text-[var(--tx)]">{p.r}</span>
            </div>
          </div>

          <PriceDisplay price={p.p} original={p.o} />

          <p className="bg-[var(--bg2)] rounded-[11px] px-3.5 py-3 text-[13.5px] text-[var(--tx2)] leading-[1.7]">
            {p.d}
          </p>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-2">
            {([['Material', p.mat], ['Dimensions', p.dim], ['Weight', p.wt], ['Warranty', p.wa]] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-[var(--bg2)] rounded-[10px] px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--tx3)]">{k}</div>
                <div className="text-[13px] font-bold text-[var(--tx)] mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div>
            <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--tx)] mb-2">Features</div>
            <div className="grid grid-cols-2 gap-1">
              {p.f.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[12.5px] text-[var(--tx2)]">
                  <Check size={14} className="text-[var(--gr)] flex-shrink-0" />{f}
                </div>
              ))}
            </div>
          </div>

          {/* Qty + actions */}
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center border border-[var(--br)] rounded-[9px] overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2.5 bg-[var(--bg2)] text-lg font-bold text-[var(--tx)] hover:bg-[var(--br2)] transition-colors">−</button>
              <span className="px-4 font-bold text-[15px] text-[var(--tx)] min-w-[40px] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="px-3 py-2.5 bg-[var(--bg2)] text-lg font-bold text-[var(--tx)] hover:bg-[var(--br2)] transition-colors">+</button>
            </div>
            <button onClick={handleCart} disabled={outOfStock}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 bg-[var(--dk)] hover:bg-[var(--dk2)]
                         text-white font-bold text-[13.5px] px-5 py-2.5 rounded-[10px] transition-colors disabled:opacity-50">
              <ShoppingCart size={16} />{outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button onClick={handleWish}
              className={`p-2.5 rounded-[10px] border transition-all
                          ${isWish ? 'bg-red-100 border-red-200' : 'bg-[var(--bg2)] border-[var(--br)] hover:border-red-300'}`}>
              <Heart size={19} fill={isWish ? 'currentColor' : 'none'} className={isWish ? 'text-red-500' : 'text-[var(--tx3)]'} />
            </button>
            <button onClick={handleCompare} title="Compare"
              className={`p-2.5 rounded-[10px] border transition-all
                          ${isCmp ? 'bg-[var(--dk)] border-[var(--dk)]' : 'bg-[var(--bg2)] border-[var(--br)] hover:border-[var(--ac)]'}`}>
              <Columns size={19} className={isCmp ? 'text-white' : 'text-[var(--tx3)]'} />
            </button>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap gap-4 text-[12px] text-[var(--tx3)]">
            <span className="flex items-center gap-1"><Truck size={14} />Free delivery above ₹10,000</span>
            <span className="flex items-center gap-1"><Shield size={14} />{p.wa}</span>
            <span className="flex items-center gap-1"><RefreshCw size={14} />30-day Returns</span>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mb-9">
        <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-4">Customer Reviews ({reviews.length})</h2>

        {userId && (
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 mb-4">
            <div className="text-[12.5px] font-bold text-[var(--tx)] mb-2">Write a review</div>
            <div className="flex gap-1 mb-2.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setMyRating(n)}>
                  <Star size={20} className={n <= myRating ? 'text-amber-400 fill-amber-400' : 'text-[var(--br2)]'} />
                </button>
              ))}
            </div>
            <Textarea value={myReviewText} onChange={e => setMyReviewText(e.target.value)}
              placeholder="How did this product work out for you?" rows={3} />
            <Btn className="mt-2.5" disabled={submittingReview} onClick={handleSubmitReview}>
              {submittingReview ? 'Submitting…' : 'Submit Review'}
            </Btn>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-[13px] text-[var(--tx3)]">No reviews yet — be the first to share your experience.</p>
        ) : (
          <div className="space-y-2.5">
            {reviews.map(r => (
              <div key={r.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-[var(--tx)]">{r.userName}</span>
                  <div className="flex gap-0.5">
                    {stars(r.rating).map((f, i) => (
                      <Star key={i} size={13} className={f ? 'text-amber-400 fill-amber-400' : 'text-[var(--br2)]'} />
                    ))}
                  </div>
                </div>
                <p className="text-[13px] text-[var(--tx2)] leading-relaxed">{r.review}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-4">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {related.map(r => <ProductCard key={r.id} product={r} />)}
          </div>
        </div>
      )}
      <CompareBar />
    </div>
  );
}

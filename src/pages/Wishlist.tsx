import { Heart } from 'lucide-react';
import { useAppSelector } from '../store';
import ProductCard from '../components/ui/ProductCard';
import { EmptyState } from '../components/ui/shared';

export default function Wishlist() {
  const wish = useAppSelector(s => s.wish.items);

  if (!wish.length) return (
    <EmptyState
      icon={Heart}
      title="Wishlist Empty"
      subtitle="Tap ❤️ on any product to save it here."
      action={{ label: '🛍 Browse Store', to: '/store' }}
    />
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-extrabold text-[var(--tx)] mb-5">
        Wishlist{' '}
        <span className="text-[.6em] text-[var(--tx3)] font-normal">{wish.length} saved</span>
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
        {wish.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

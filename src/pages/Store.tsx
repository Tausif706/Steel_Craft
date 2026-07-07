import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { SkeletonStorePage } from '../components/ui/Skeleton';
import { CompareBar, EmptyState } from '../components/ui/shared';
import { useAppSelector } from '../store';

export default function Store() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const cat = searchParams.get('cat') ?? 'all';
  const compare = useAppSelector(s => s.compare);
  const products = useAppSelector(s => s.catalog.products);
  const categories = useAppSelector(s => s.catalog.categories);
  const catalogStatus = useAppSelector(s => s.catalog.status);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      (cat === 'all' || p.cat === cat) &&
      (!q || p.n.toLowerCase().includes(q) || p.d.toLowerCase().includes(q))
    );
  }, [cat, search, products]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      <div className="mb-4">
        <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-extrabold text-[var(--tx)]">Steel Furniture Store</h1>
        <p className="text-[.87rem] text-[var(--tx3)] mt-0.5">{filtered.length} products</p>
      </div>

      {/* Compare banner */}
      {compare.length > 0 && (
        <div className="bg-[var(--dk)] rounded-[13px] px-4 py-3 mb-3.5 flex items-center gap-2.5 flex-wrap">
          <span className="text-[13px] font-bold text-white">{compare.length} selected for comparison</span>
          <a href="/compare" className="ml-auto bg-[var(--ac)] text-white text-[12.5px] font-bold px-3.5 py-1.5 rounded-lg">
            Compare →
          </a>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tx3)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search furniture..."
          className="w-full pl-10 pr-4 py-2.5 border border-[var(--br)] rounded-[11px] text-[14px]
                     bg-[var(--sf)] text-[var(--tx)] outline-none focus:border-[var(--dk)] transition-colors"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {categories.map(c => (
          <button key={c.id}
            onClick={() => setSearchParams(c.id === 'all' ? {} : { cat: c.id })}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12.5px] font-semibold
                        whitespace-nowrap flex-shrink-0 transition-all
                        ${cat === c.id
                          ? 'bg-[var(--dk)] border-[var(--dk)] text-white'
                          : 'bg-[var(--sf)] border-[var(--br)] text-[var(--tx2)] hover:border-[var(--dk)] hover:text-[var(--dk)]'}`}>
            <i className={`ti ${c.ic} text-sm`} />
            {c.n}
          </button>
        ))}
      </div>

      {/* Grid */}
      {catalogStatus === 'loading' && products.length === 0 ? (
        <SkeletonStorePage />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No results" subtitle="Try a different keyword or category." action={{ label: 'Clear filters', to: '/store' }} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      <CompareBar />
    </div>
  );
}

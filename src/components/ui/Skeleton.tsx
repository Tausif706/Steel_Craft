// ════════════════════════════════════════════════════════════════
// Skeleton.tsx — shimmer placeholder library
//
// Every component here mirrors the exact shape of the real content
// it replaces, so the layout doesn't shift when data arrives.
// All use the .shimmer CSS class (defined in index.css) which
// runs a left→right gradient sweep animation.
//
// Usage:
//   import { SkeletonProductGrid } from '../components/ui/Skeleton';
//   if (status === 'loading') return <SkeletonProductGrid />;
// ════════════════════════════════════════════════════════════════

// ─── Primitives ───────────────────────────────────────────────
const S = 'shimmer rounded-[6px]'; // shorthand for inline use

/** Inline text line placeholder */
export function SkLine({ w = 'w-full', h = 'h-3', className = '' }: { w?: string; h?: string; className?: string }) {
  return <div className={`${S} ${w} ${h} ${className}`} />;
}

/** Rectangular block placeholder */
export function SkBox({ className = '' }: { className?: string }) {
  return <div className={`${S} ${className}`} />;
}

/** Circle placeholder (avatars, icons) */
export function SkCircle({ size = 'w-10 h-10' }: { size?: string }) {
  return <div className={`${S} ${size} rounded-full`} />;
}

// ─── Product card skeleton ─────────────────────────────────────
export function SkeletonProductCard() {
  return (
    <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] overflow-hidden shadow-s1">
      {/* image zone */}
      <div className="shimmer h-[168px] w-full" />
      {/* body */}
      <div className="p-3.5 flex flex-col gap-2.5">
        <SkLine w="w-20" h="h-2.5" />
        <SkLine w="w-full" h="h-3.5" />
        <SkLine w="w-3/4" h="h-3.5" />
        {/* stars */}
        <div className="flex gap-1 mt-0.5">
          {[...Array(5)].map((_, i) => <SkBox key={i} className="w-3 h-3 rounded-sm" />)}
          <SkLine w="w-10" h="h-3" className="ml-1" />
        </div>
        {/* price */}
        <div className="flex gap-2 items-baseline">
          <SkLine w="w-24" h="h-5" />
          <SkLine w="w-16" h="h-3" />
        </div>
        {/* action row */}
        <div className="h-px bg-[var(--br)] my-0.5" />
        <div className="flex gap-1.5">
          <SkBox className="w-16 h-8 rounded-[9px]" />
          <SkBox className="flex-1 h-8 rounded-[9px]" />
          <SkBox className="w-8 h-8 rounded-[9px]" />
        </div>
      </div>
    </div>
  );
}

/** Grid of n product card skeletons — matches Store / Home grid */
export function SkeletonProductGrid({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
      {[...Array(n)].map((_, i) => <SkeletonProductCard key={i} />)}
    </div>
  );
}

// ─── Home page skeleton ────────────────────────────────────────
export function SkeletonHero() {
  return (
    <section className="bg-[var(--dk)] px-4 py-[clamp(52px,8vw,96px)]">
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-5">
        {/* eyebrow */}
        <SkBox className="w-64 h-6 rounded-full bg-white/10" />
        {/* headline */}
        <SkBox className="w-full max-w-[700px] h-12 rounded-[10px] bg-white/10" />
        <SkBox className="w-4/5 max-w-[500px] h-12 rounded-[10px] bg-white/10" />
        {/* sub-headline */}
        <SkBox className="w-3/4 max-w-[500px] h-4 rounded-[6px] bg-white/10 mt-1" />
        <SkBox className="w-2/3 max-w-[400px] h-4 rounded-[6px] bg-white/10" />
        {/* CTA buttons */}
        <div className="flex gap-3 mt-2">
          <SkBox className="w-36 h-11 rounded-[11px] bg-[var(--ac)] opacity-50" />
          <SkBox className="w-36 h-11 rounded-[11px] bg-white/10" />
          <SkBox className="w-32 h-11 rounded-[11px] bg-white/10" />
        </div>
        {/* stat band */}
        <div className="grid grid-cols-4 gap-px w-full mt-4 bg-white/[.07] rounded-[16px] overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/[.03] px-4 py-4 flex flex-col items-center gap-1.5">
              <SkBox className="w-16 h-7 rounded-[8px] bg-white/10" />
              <SkBox className="w-20 h-3 rounded bg-white/10" />
              <SkBox className="w-14 h-2.5 rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section header placeholder */
export function SkeletonSectionHeader({ center = false }: { center?: boolean }) {
  return (
    <div className={`mb-6 flex flex-col gap-2 ${center ? 'items-center' : ''}`}>
      <SkLine w="w-24" h="h-2.5" />
      <SkLine w="w-64" h="h-7" />
    </div>
  );
}

// ─── Category chips skeleton ───────────────────────────────────
export function SkeletonCategoryGrid({ n = 5 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
      {[...Array(n)].map((_, i) => (
        <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl p-4 flex flex-col items-center gap-2">
          <SkBox className="w-10 h-10 rounded-[10px]" />
          <SkLine w="w-20" h="h-3" />
          <SkLine w="w-12" h="h-2.5" />
        </div>
      ))}
    </div>
  );
}

// ─── Product detail page skeleton ─────────────────────────────
export function SkeletonProductDetail() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 animate-up">
      {/* breadcrumb */}
      <div className="flex gap-2 items-center mb-6">
        <SkLine w="w-12" h="h-3" />
        <SkLine w="w-3" h="h-3" />
        <SkLine w="w-16" h="h-3" />
        <SkLine w="w-3" h="h-3" />
        <SkLine w="w-32" h="h-3" />
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        {/* image column */}
        <div>
          <SkBox className="w-full aspect-square rounded-[18px]" />
          <div className="flex gap-2 mt-3">
            {[...Array(4)].map((_, i) => (
              <SkBox key={i} className="w-16 h-16 rounded-[12px]" />
            ))}
          </div>
        </div>
        {/* details column */}
        <div className="flex flex-col gap-4">
          <SkLine w="w-28" h="h-3" />
          <SkLine w="w-full" h="h-8" />
          <SkLine w="w-4/5" h="h-8" />
          {/* stars */}
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => <SkBox key={i} className="w-4 h-4 rounded-sm" />)}
            <SkLine w="w-20" h="h-4" className="ml-2" />
          </div>
          {/* price */}
          <div className="flex gap-3 items-baseline mt-1">
            <SkLine w="w-32" h="h-9" />
            <SkLine w="w-20" h="h-5" />
            <SkBox className="w-16 h-6 rounded-[7px]" />
          </div>
          <div className="h-px bg-[var(--br)] my-1" />
          {/* specs */}
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <SkLine w="w-28" h="h-3.5" />
                <SkLine w="w-40" h="h-3.5" />
              </div>
            ))}
          </div>
          <div className="h-px bg-[var(--br)] my-1" />
          {/* qty + cart */}
          <div className="flex gap-3">
            <SkBox className="w-32 h-11 rounded-[10px]" />
            <SkBox className="flex-1 h-11 rounded-[10px]" />
            <SkBox className="w-11 h-11 rounded-[10px]" />
          </div>
          {/* trust badges */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[var(--bg2)] border border-[var(--br)] rounded-[12px] p-2.5 flex flex-col gap-1.5 items-center">
                <SkCircle size="w-6 h-6" />
                <SkLine w="w-16" h="h-2.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* description + reviews section */}
      <div className="mt-12 grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <SkLine w="w-40" h="h-6" />
          {[...Array(6)].map((_, i) => (
            <SkLine key={i} w={i % 3 === 2 ? 'w-4/5' : 'w-full'} h="h-3" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <SkLine w="w-28" h="h-6" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <SkCircle size="w-8 h-8" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <SkLine w="w-28" h="h-3" />
                  <div className="flex gap-1">{[...Array(5)].map((_, j) => <SkBox key={j} className="w-3 h-3 rounded-sm" />)}</div>
                </div>
              </div>
              <SkLine w="w-full" h="h-3" />
              <SkLine w="w-4/5" h="h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Store page sidebar + grid ─────────────────────────────────
export function SkeletonStorePage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-6">
      {/* sidebar — desktop */}
      <aside className="hidden md:flex flex-col gap-4 w-56 shrink-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <SkLine w="w-20" h="h-4" />
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <SkBox className="w-4 h-4 rounded-sm" />
                <SkLine w="w-24" h="h-3" />
              </div>
            ))}
          </div>
        ))}
      </aside>
      {/* grid */}
      <div className="flex-1">
        {/* filter chips row */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[...Array(5)].map((_, i) => (
            <SkBox key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <SkeletonProductGrid n={8} />
      </div>
    </div>
  );
}

// ─── Dashboard tab skeleton ────────────────────────────────────
/** Matches the order-card shape in Dashboard > Orders */
export function SkeletonOrderCard() {
  return (
    <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1.5">
          <SkLine w="w-28" h="h-4" />
          <SkLine w="w-20" h="h-3" />
        </div>
        <SkBox className="w-20 h-5 rounded-[8px]" />
      </div>
      <SkLine w="w-full" h="h-3" className="mb-1.5" />
      <div className="flex justify-between items-center mt-2">
        <SkLine w="w-20" h="h-5" />
        <SkBox className="w-24 h-7 rounded-[9px]" />
      </div>
    </div>
  );
}

export function SkeletonDashboardOrders({ n = 4 }: { n?: number }) {
  return (
    <div>
      <SkLine w="w-40" h="h-5" className="mb-3" />
      {[...Array(n)].map((_, i) => <SkeletonOrderCard key={i} />)}
    </div>
  );
}

/** Matches custom-order card shape */
export function SkeletonCustomOrderCard() {
  return (
    <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-4 mb-3">
      <div className="flex gap-3">
        <SkBox className="w-20 h-20 rounded-[10px] shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <SkLine w="w-40" h="h-4" />
          <SkLine w="w-28" h="h-3" />
          <div className="flex gap-2 mt-1">
            <SkBox className="w-24 h-5 rounded-[8px]" />
            <SkBox className="w-20 h-5 rounded-[8px]" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[...Array(3)].map((_, i) => <SkBox key={i} className="h-3 rounded-[6px]" />)}
      </div>
    </div>
  );
}

/** Generic dashboard tab loading state */
export function SkeletonDashboardTab({ shape = 'orders' }: { shape?: 'orders' | 'custom' | 'profile' | 'payments' }) {
  if (shape === 'custom') return (
    <div>
      <SkLine w="w-48" h="h-5" className="mb-3" />
      {[...Array(3)].map((_, i) => <SkeletonCustomOrderCard key={i} />)}
    </div>
  );

  if (shape === 'profile') return (
    <div className="flex flex-col gap-4 max-w-[480px]">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <SkLine w="w-24" h="h-3" />
          <SkBox className="w-full h-10 rounded-[10px]" />
        </div>
      ))}
      <SkBox className="w-36 h-10 rounded-[10px] mt-2" />
    </div>
  );

  if (shape === 'payments') return (
    <div className="flex flex-col gap-2">
      <SkLine w="w-48" h="h-5" className="mb-1" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 flex justify-between items-start">
          <div className="flex flex-col gap-1.5">
            <SkLine w="w-32" h="h-4" />
            <SkLine w="w-24" h="h-3" />
            <SkBox className="w-28 h-4 rounded-full mt-1" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <SkLine w="w-20" h="h-6" />
            <SkBox className="w-16 h-5 rounded-[8px]" />
          </div>
        </div>
      ))}
    </div>
  );

  // default: orders
  return <SkeletonDashboardOrders />;
}

// ─── Admin Overview skeleton ───────────────────────────────────
export function SkeletonAdminOverview() {
  return (
    <div className="space-y-6 animate-up">
      {/* KPI cards */}
      <div>
        <SkLine w="w-48" h="h-4" className="mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 flex flex-col gap-3">
              <div className="flex justify-between">
                <SkBox className="w-9 h-9 rounded-[10px]" />
                <SkBox className="w-12 h-5 rounded-full" />
              </div>
              <SkLine w="w-20" h="h-6" />
              <div className="flex flex-col gap-1">
                <SkLine w="w-24" h="h-3" />
                <SkLine w="w-16" h="h-2.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* alert band */}
      <div>
        <SkLine w="w-32" h="h-4" className="mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-[12px] px-3.5 py-3 flex items-center gap-3">
              <SkBox className="w-7 h-7 rounded-[8px] shrink-0" />
              <SkLine w="flex-1" h="h-3.5" />
              <SkLine w="w-6" h="h-5" />
            </div>
          ))}
        </div>
      </div>
      {/* charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4">
          <SkLine w="w-32" h="h-5" className="mb-1" />
          <SkLine w="w-48" h="h-3" className="mb-4" />
          <SkBox className="w-full h-[180px] rounded-[10px]" />
        </div>
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4">
          <SkLine w="w-28" h="h-5" className="mb-1" />
          <SkLine w="w-36" h="h-3" className="mb-3" />
          <SkCircle size="w-[170px] h-[170px] mx-auto" />
          <div className="mt-3 flex flex-col gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <SkLine w="w-24" h="h-3" />
                <SkLine w="w-8" h="h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin table skeleton ──────────────────────────────────────
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  const widths = ['w-24', 'w-36', 'w-20', 'w-28', 'w-16'];
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--br)]">
      {[...Array(cols)].map((_, i) => (
        <SkLine key={i} w={widths[i % widths.length]} h="h-3.5" />
      ))}
    </div>
  );
}

export function SkeletonAdminTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] overflow-hidden">
      {/* header */}
      <div className="flex gap-4 px-4 py-3 bg-[var(--bg2)] border-b border-[var(--br)]">
        {[...Array(cols)].map((_, i) => <SkLine key={i} w="w-20" h="h-3" />)}
      </div>
      {[...Array(rows)].map((_, i) => <SkeletonTableRow key={i} cols={cols} />)}
    </div>
  );
}

// ─── AI Builder skeleton ───────────────────────────────────────
export function SkeletonAIBuilder() {
  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 flex flex-col gap-6 animate-up">
      {/* header */}
      <div className="text-center flex flex-col items-center gap-3">
        <SkBox className="w-14 h-14 rounded-[16px]" />
        <SkLine w="w-64" h="h-8" />
        <SkLine w="w-80" h="h-4" />
      </div>
      {/* chat window */}
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-4 flex flex-col gap-3 min-h-[320px]">
        {/* AI bubble */}
        <div className="flex gap-3">
          <SkCircle size="w-8 h-8" />
          <div className="flex flex-col gap-1.5 flex-1 max-w-[70%]">
            <SkBox className="w-full h-14 rounded-[12px]" />
          </div>
        </div>
        {/* user bubble */}
        <div className="flex gap-3 justify-end">
          <div className="flex flex-col gap-1.5 max-w-[60%]">
            <SkBox className="w-full h-10 rounded-[12px]" />
          </div>
          <SkCircle size="w-8 h-8" />
        </div>
        {/* AI typing indicator */}
        <div className="flex gap-3">
          <SkCircle size="w-8 h-8" />
          <div className="flex items-center gap-1.5 bg-[var(--bg2)] border border-[var(--br)] rounded-[12px] px-4 py-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--tx3)] shimmer"
                   style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
      {/* input bar */}
      <SkBox className="w-full h-12 rounded-[12px]" />
    </div>
  );
}

// ─── Wholesale page skeleton ───────────────────────────────────
export function SkeletonWholesale() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 flex flex-col gap-10 animate-up">
      {/* hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <SkBox className="w-24 h-6 rounded-full" />
        <SkLine w="w-96 max-w-full" h="h-10" />
        <SkLine w="w-72 max-w-full" h="h-4" />
        <SkLine w="w-64 max-w-full" h="h-4" />
        <div className="flex gap-3 mt-2">
          <SkBox className="w-36 h-11 rounded-[11px]" />
          <SkBox className="w-28 h-11 rounded-[11px]" />
        </div>
      </div>
      {/* stat band */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 flex flex-col gap-2 items-center">
            <SkLine w="w-16" h="h-7" />
            <SkLine w="w-24" h="h-3" />
          </div>
        ))}
      </div>
      {/* RFQ form */}
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-6">
        <SkLine w="w-48" h="h-6" className="mb-4" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <SkLine w="w-24" h="h-3" />
              <SkBox className="w-full h-10 rounded-[10px]" />
            </div>
          ))}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <SkLine w="w-24" h="h-3" />
            <SkBox className="w-full h-20 rounded-[10px]" />
          </div>
        </div>
        <SkBox className="w-40 h-11 rounded-[10px] mt-4" />
      </div>
    </div>
  );
}

// ─── Cart/Checkout skeleton ────────────────────────────────────
export function SkeletonCart() {
  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 flex flex-col gap-4 animate-up">
      <SkLine w="w-32" h="h-7" className="mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 flex gap-4">
          <SkBox className="w-20 h-20 rounded-[12px] shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <SkLine w="w-full" h="h-4" />
            <SkLine w="w-24" h="h-3" />
            <div className="flex justify-between items-center mt-auto">
              <SkBox className="w-28 h-9 rounded-[9px]" />
              <SkLine w="w-20" h="h-6" />
            </div>
          </div>
        </div>
      ))}
      {/* summary */}
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 flex flex-col gap-3 mt-2">
        <SkLine w="w-32" h="h-5" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <SkLine w="w-24" h="h-3.5" />
            <SkLine w="w-16" h="h-3.5" />
          </div>
        ))}
        <div className="h-px bg-[var(--br)]" />
        <div className="flex justify-between">
          <SkLine w="w-16" h="h-5" />
          <SkLine w="w-24" h="h-5" />
        </div>
        <SkBox className="w-full h-11 rounded-[10px]" />
      </div>
    </div>
  );
}

// ─── Full page loading screen ──────────────────────────────────
// Used as the app-level fallback while auth initialises
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg)] z-[500] gap-4">
      {/* Animated logo mark */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-[18px] bg-[var(--dk)] flex items-center justify-center shadow-s3">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        {/* spinning ring */}
        <div className="absolute -inset-1.5 rounded-[22px] border-2 border-[var(--ac)] border-t-transparent animate-spin-custom opacity-70" />
      </div>
      <div className="text-[13px] font-semibold text-[var(--tx3)]">{label}</div>
    </div>
  );
}

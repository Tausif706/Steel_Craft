// ════════════════════════════════════════════════════════════════
// Marketing constants — business-oriented copy for B2C + B2B
// ════════════════════════════════════════════════════════════════

export const BADGE_CLS: Record<string, string> = {
  'Best Seller': 'bg-yellow-100 text-yellow-800',
  'New':         'bg-green-100  text-green-800',
  'Sale':        'bg-red-100    text-red-800',
  'Top Rated':   'bg-blue-100   text-blue-800',
  'Premium':     'bg-purple-100 text-purple-800',
};

// ── Hero stats: business-relevant numbers ────────────────────────
export const STATS = [
  { n: '10,000+', l: 'Units Delivered', sub: 'Pan-India' },
  { n: '₹8 Cr+',  l: 'Revenue Processed', sub: 'FY 2024–25' },
  { n: '94%',     l: 'On-Time Delivery', sub: 'Last 12 months' },
  { n: '600+',    l: 'B2B Clients',      sub: 'Schools, Offices, Factories' },
];

// ── How it works — 3 user journeys ──────────────────────────────
export const JOURNEYS = [
  {
    tag: 'B2C · Retail',
    title: 'Browse & Buy',
    steps: [
      { n: '01', t: 'Browse Catalog',   d: 'Filter by type, dimensions, price. 500+ SKUs in stock.' },
      { n: '02', t: 'Add to Cart',      d: 'Compare up to 4 products side by side before deciding.' },
      { n: '03', t: 'Fast Checkout',    d: 'COD / UPI / Card. Delivered in 3–7 days.' },
    ],
    cta: 'Shop Now',
    path: '/store',
    accent: '#0D2847',
  },
  {
    tag: 'B2C · Custom',
    title: 'Design with AI',
    steps: [
      { n: '01', t: 'Describe Your Idea', d: 'Tell the AI builder what you need — size, doors, color, use.' },
      { n: '02', t: 'Get a Spec Sheet',   d: 'Receive front/side/top/inside SVG drawings + price estimate.' },
      { n: '03', t: 'We Build It',        d: 'Admin reviews, quotes, and manufactures to your exact spec.' },
    ],
    cta: 'Start Designing',
    path: '/ai',
    accent: '#C8820A',
  },
  {
    tag: 'B2B · Wholesale',
    title: 'Bulk & Institutional',
    steps: [
      { n: '01', t: 'Submit RFQ',       d: 'Share product, quantity, and destination. Free quote in 4 hours.' },
      { n: '02', t: 'Negotiate & Lock', d: 'Our team sends tiered pricing. You approve.' },
      { n: '03', t: 'Deliver at Scale', d: 'Fleet delivery, site assembly, GST invoice included.' },
    ],
    cta: 'Request Bulk Quote',
    path: '/wholesale',
    accent: '#0891B2',
  },
];

// ── B2B vertical sectors ─────────────────────────────────────────
export const B2B_SECTORS = [
  { ic: 'ti-school',          label: 'Educational',    ex: 'Schools, colleges, coaching centres',   n: '1,200+', unit: 'institutes served' },
  { ic: 'ti-building-office', label: 'Corporate',      ex: 'IT parks, co-working spaces, HQs',      n: '380+',   unit: 'offices equipped' },
  { ic: 'ti-building-factory',label: 'Industrial',     ex: 'Warehouses, manufacturing units',        n: '260+',   unit: 'facilities fitted' },
  { ic: 'ti-heart-rate-monitor',label: 'Healthcare',   ex: 'Hospitals, clinics, pharma stores',      n: '90+',    unit: 'facilities fitted' },
  { ic: 'ti-home',            label: 'Real Estate',    ex: 'Builders, interior firms, property devs', n: '150+',  unit: 'projects completed' },
  { ic: 'ti-building-store',  label: 'Retail Chains',  ex: 'Supermarkets, showrooms, kiosks',         n: '75+',   unit: 'chains supplied' },
];

// ── Trust signals ────────────────────────────────────────────────
export const TRUST = [
  { ic: 'ti-certificate',    t: 'BIS / ISI Certified',    d: 'Compliant with all Indian steel furniture standards' },
  { ic: 'ti-truck-delivery', t: 'Fleet Delivery',          d: 'Own fleet for bulk; courier partners for retail' },
  { ic: 'ti-shield-check',   t: '5-Year Warranty',         d: 'On all structural steel products' },
  { ic: 'ti-clock',          t: 'Quote in 4 Hours',        d: 'Guaranteed response to every B2B RFQ' },
  { ic: 'ti-refresh',        t: '30-Day Returns',          d: 'Hassle-free policy; retail and custom orders' },
  { ic: 'ti-headset',        t: '24 × 7 Support',          d: 'WhatsApp + call + email, always on' },
];

// ── Testimonials: mix of B2C + B2B ──────────────────────────────
export const TESTIMONIALS = [
  {
    n: 'Rajesh Kumar',
    ro: 'Facility Manager · InfoTech Park, Hyderabad',
    t: 'Ordered 200 office almirahs across 3 floors. Delivered on schedule with GST invoice. Bulk pricing was far better than any local dealer.',
    r: 5, a: 'R', bg: '#1B3A5E', tag: 'B2B · Corporate',
  },
  {
    n: 'Priya Nair',
    ro: 'Senior Interior Designer · Mumbai',
    t: 'Used the AI custom builder for a client\'s study room. Got exact dimensions, colour, mirror placement — the final product matched the spec sheet perfectly.',
    r: 5, a: 'P', bg: '#3D2A1B', tag: 'B2C · Custom',
  },
  {
    n: 'Suresh Patel',
    ro: 'Principal · Green Valley School, Surat',
    t: '300 dual-desk bench sets delivered before the new academic year. BIS certification gave the school board full confidence. Best pricing we found.',
    r: 5, a: 'S', bg: '#1B3D2E', tag: 'B2B · Education',
  },
  {
    n: 'Meena Agarwal',
    ro: 'Home Buyer · Pune',
    t: 'Bought a 3-door almirah for my bedroom. No middleman, direct factory pricing. The quality is better than what I found in local showrooms at the same price.',
    r: 5, a: 'M', bg: '#4C1D95', tag: 'B2C · Retail',
  },
  {
    n: 'Dilip Rao',
    ro: 'Operations Head · Pharma Warehouse, Bengaluru',
    t: 'We needed heavy-duty 0.8mm gauge racks for controlled storage. The team configured exactly what we needed and delivered in 10 days. Outstanding.',
    r: 5, a: 'D', bg: '#064E3B', tag: 'B2B · Industrial',
  },
  {
    n: 'Anusha Singh',
    ro: 'Property Developer · Hyderabad',
    t: 'We outfit every apartment we build with SteelCraft wardrobes. Consistent quality, right finish, and the admin panel makes bulk ordering simple.',
    r: 4, a: 'A', bg: '#7C2D12', tag: 'B2B · Real Estate',
  },
];

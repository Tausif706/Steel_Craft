// ════════════════════════════════════════════════════════════════
// Pure data-shaping helpers for the Admin Overview dashboard.
// No fetching here — everything below just re-shapes data that's
// already in the Redux store (orders, customOrders) into the
// {label,value}-style arrays recharts wants. Keeping this out of
// the component makes the chart math independently testable.
// ════════════════════════════════════════════════════════════════
import type { Order, CustomOrderEntry, OrderStatus } from '../types';

const DAY_MS = 86_400_000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sumInRange(orders: Order[], startMs: number, endMs: number, pick: (o: Order) => number): number {
  let total = 0;
  for (const o of orders) {
    if (!o.createdAt) continue;
    const t = new Date(o.createdAt).getTime();
    if (t >= startMs && t < endMs) total += pick(o);
  }
  return total;
}

// ─── Revenue / order-count trend (current period overlaid on the previous one) ───
export interface SeriesPoint { label: string; current: number; previous: number; }

export function buildComparisonSeries(orders: Order[], days: number, pick: (o: Order) => number = o => o.total): SeriesPoint[] {
  const todayStart = startOfDay(new Date()).getTime();
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const curStart = todayStart - i * DAY_MS;
    const curEnd = curStart + DAY_MS;
    const prevStart = curStart - days * DAY_MS;
    const prevEnd = prevStart + DAY_MS;
    out.push({
      label: new Date(curStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      current: sumInRange(orders, curStart, curEnd, pick),
      previous: sumInRange(orders, prevStart, prevEnd, pick),
    });
  }
  return out;
}

// This-period vs last-period totals, for the little "+12% vs last 14 days" KPI badges.
export interface PeriodComparison { current: number; previous: number; deltaPct: number | null; }

export function compareLastNDays(orders: Order[], days: number, pick: (o: Order) => number = o => o.total): PeriodComparison {
  const end = startOfDay(new Date()).getTime() + DAY_MS;
  const curStart = end - days * DAY_MS;
  const prevStart = curStart - days * DAY_MS;
  const current = sumInRange(orders, curStart, end, pick);
  const previous = sumInRange(orders, prevStart, curStart, pick);
  const deltaPct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? null : 0);
  return { current, previous, deltaPct };
}

// ─── Order status breakdown (donut) ───
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  Processing: '#D97706',
  Packed: '#2563EB',
  'In Transit': '#0891B2',
  Delivered: '#16A34A',
  Cancelled: '#DC2626',
};

export function buildOrderStatusBreakdown(orders: Order[]) {
  const counts = {} as Record<string, number>;
  for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value, color: ORDER_STATUS_COLOR[name as OrderStatus] ?? '#94A3AF' }))
    .sort((a, b) => b.value - a.value);
}

export function fulfillmentRate(orders: Order[]): number {
  if (orders.length === 0) return 0;
  const delivered = orders.filter(o => o.status === 'Delivered').length;
  return Math.round((delivered / orders.length) * 100);
}

// ─── Custom-order production pipeline ───
export const CUSTOM_ORDER_STAGES: { key: string; label: string }[] = [
  { key: 'pending_review', label: 'Pending Review' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_production', label: 'In Production' },
  { key: 'quality_check', label: 'Quality Check' },
  { key: 'ready_to_dispatch', label: 'Ready to Dispatch' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
];

export function buildCustomOrderPipeline(customOrders: CustomOrderEntry[]) {
  const counts = {} as Record<string, number>;
  for (const co of customOrders) counts[co.adminStatus] = (counts[co.adminStatus] ?? 0) + 1;
  const stages = CUSTOM_ORDER_STAGES.map(s => ({ ...s, count: counts[s.key] ?? 0 }));
  const left = customOrders.filter(co => co.adminStatus !== 'delivered' && co.adminStatus !== 'rejected').length;
  const rejected = counts['rejected'] ?? 0;
  return { stages, total: customOrders.length, left, rejected };
}

// ─── Revenue by sales channel ───
export const CHANNEL_LABEL: Record<string, string> = { standard: 'Retail', custom: 'Custom Build', wholesale: 'Wholesale' };
export const CHANNEL_COLOR: Record<string, string> = { standard: 'var(--dk)', custom: 'var(--ac)', wholesale: '#0EA5A4' };

export function buildChannelBreakdown(orders: Order[]) {
  const map = {} as Record<string, { revenue: number; count: number }>;
  for (const o of orders) {
    const key = o.orderType ?? 'standard';
    if (!map[key]) map[key] = { revenue: 0, count: 0 };
    map[key].revenue += o.total;
    map[key].count += 1;
  }
  return Object.entries(map)
    .map(([key, v]) => ({ key, label: CHANNEL_LABEL[key] ?? key, color: CHANNEL_COLOR[key] ?? 'var(--tx3)', ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}

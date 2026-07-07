// ════════════════════════════════════════════════════════════════
// Admin Overview Dashboard  — SteelCraft
//
// Structured as four sections:
//   1. KPI cards     – revenue, orders, RFQs, products with delta badges
//   2. Alert band    – urgent action items (pending, low stock, unread, etc.)
//   3. Charts row    – revenue trend (area), order status (donut), channel mix (bar)
//   4. Production    – custom-order pipeline funnel + recent order table
//
// All chart data comes from data already in the Redux store — no
// extra network calls.  Recharts is used for all chart rendering.
// ════════════════════════════════════════════════════════════════
import { useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  fetchAdminStats, fetchAdminOrders, fetchAdminRfqs,
  fetchAdminCustomOrders, uiActions,
} from '../../store/slices';
import { fmt, orderStatusClass } from '../../lib/utils';
import {
  buildComparisonSeries, compareLastNDays,
  buildOrderStatusBreakdown, fulfillmentRate,
  buildCustomOrderPipeline, buildChannelBreakdown,
  ORDER_STATUS_COLOR, CUSTOM_ORDER_STAGES,
} from '../../lib/dashboardData';
import { SkeletonAdminOverview } from '../ui/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import {
  IndianRupee, Package, Building2, Layers,
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  Factory, Truck, CheckCircle, ClipboardList,
  Users, MessageSquare, Star,
} from 'lucide-react';

// ─── tiny helpers ────────────────────────────────────────────────
function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10.5px] font-bold px-1.5 py-0.5 rounded-full
      ${up ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
           : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {Math.abs(pct)}%
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--tx3)] mb-3 mt-1">{children}</h2>
  );
}

// Custom recharts tooltip that respects the app's CSS theme
function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[10px] px-3 py-2 text-[12px] shadow-lg">
      {label && <div className="text-[var(--tx3)] mb-1 font-medium">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color ?? p.fill }} />
          <span className="text-[var(--tx2)]">{p.name}:</span>
          <span className="font-bold text-[var(--tx)]">
            {currency ? `₹${Number(p.value).toLocaleString('en-IN')}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart with centre label ───────────────────────────────
function DonutWithLabel({ data, label, sub }: { data: { name: string; value: number; color: string }[]; label: string; sub: string }) {
  return (
    <div className="relative h-[170px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%"
               innerRadius={52} outerRadius={76} paddingAngle={3} strokeWidth={0}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Centre label, absolutely positioned over the donut hole */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[22px] font-black text-[var(--tx)] leading-none">{label}</span>
        <span className="text-[10px] text-[var(--tx3)] font-semibold mt-0.5">{sub}</span>
      </div>
    </div>
  );
}

// ─── Pipeline funnel bar (horizontal) ────────────────────────────
const PIPELINE_COLORS = [
  '#C8820A','#B45309','#0D2847','#1A3D6B','#0891B2',
  '#0EA5E9','#16A34A','#15803D',
];
function PipelineBar({ stages, total }: { stages: { key: string; label: string; count: number }[]; total: number }) {
  if (total === 0) return <div className="text-[12px] text-[var(--tx3)] py-4 text-center">No custom orders yet.</div>;
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="space-y-2">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--tx2)] w-[120px] shrink-0 leading-tight">{s.label}</span>
          <div className="flex-1 bg-[var(--bg3)] rounded-full h-[8px] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${(s.count / maxCount) * 100}%`, background: PIPELINE_COLORS[i % PIPELINE_COLORS.length] }} />
          </div>
          <span className="text-[11px] font-bold text-[var(--tx)] w-5 text-right shrink-0">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function AdminOverview() {
  const dispatch = useAppDispatch();
  const stats        = useAppSelector(s => s.admin.stats);
  const orders       = useAppSelector(s => s.admin.orders);
  const customOrders = useAppSelector(s => s.admin.customOrders);
  const rfqs         = useAppSelector(s => s.admin.rfqs);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminOrders());
    dispatch(fetchAdminRfqs());
    dispatch(fetchAdminCustomOrders());
  }, [dispatch]);

  // ── Derived chart data (memoised — only recalculates when source arrays change) ──
  const revenueSeries    = useMemo(() => buildComparisonSeries(orders, 14), [orders]);
  const orderCountSeries = useMemo(() => buildComparisonSeries(orders, 14, () => 1), [orders]);
  const revDelta         = useMemo(() => compareLastNDays(orders, 14), [orders]);
  const ordDelta         = useMemo(() => compareLastNDays(orders, 14, () => 1), [orders]);
  const statusBreakdown  = useMemo(() => buildOrderStatusBreakdown(orders), [orders]);
  const fillRate         = useMemo(() => fulfillmentRate(orders), [orders]);
  const channelData      = useMemo(() => buildChannelBreakdown(orders), [orders]);
  const pipeline         = useMemo(() => buildCustomOrderPipeline(customOrders), [customOrders]);

  // Show a skeleton-ish state while stats haven't loaded
  if (!stats) return <SkeletonAdminOverview />;

  // ─── 1. KPI CARDS ─────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Revenue',
      value: fmt(stats.revenue),
      icon: <IndianRupee size={16} />,
      accent: '#C8820A',
      bg: 'rgba(200,130,10,.10)',
      delta: revDelta.deltaPct,
      sub: 'vs prev 14 days',
    },
    {
      label: 'Total Orders',
      value: stats.orderCount,
      icon: <Package size={16} />,
      accent: '#0D2847',
      bg: 'rgba(13,40,71,.10)',
      delta: ordDelta.deltaPct,
      sub: 'vs prev 14 days',
    },
    {
      label: 'Wholesale RFQs',
      value: stats.rfqCount,
      icon: <Building2 size={16} />,
      accent: '#0891B2',
      bg: 'rgba(8,145,178,.10)',
      delta: null,
      sub: `${rfqs.filter(r => r.status === 'Pending').length} pending`,
    },
    {
      label: 'Products',
      value: stats.productCount,
      icon: <Layers size={16} />,
      accent: '#7C3AED',
      bg: 'rgba(124,58,237,.10)',
      delta: null,
      sub: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : 'All stocked',
    },
  ];

  // ─── 2. ALERT ITEMS ───────────────────────────────────────────
  type AlertItem = {
    label: string; count: number; tab: string;
    icon: React.ReactNode; urgent: boolean;
  };
  const alerts: AlertItem[] = [
    { label: 'Processing Orders', count: stats.pendingOrders, tab: 'orders',   icon: <Clock size={13} />,        urgent: stats.pendingOrders > 0 },
    { label: 'Custom Orders (Review)', count: stats.pendingCustomOrders, tab: 'custom', icon: <ClipboardList size={13} />, urgent: stats.pendingCustomOrders > 0 },
    { label: 'In Transit',        count: stats.inTransitOrders, tab: 'orders', icon: <Truck size={13} />,         urgent: false },
    { label: 'Pending RFQs',      count: stats.pendingRfqs,      tab: 'rfqs',   icon: <Building2 size={13} />,    urgent: stats.pendingRfqs > 0 },
    { label: 'Reviews to Approve',count: stats.pendingReviews,   tab: 'reviews',icon: <Star size={13} />,          urgent: false },
    { label: 'Unread Messages',   count: stats.unreadContact,    tab: 'contact',icon: <MessageSquare size={13} />, urgent: stats.unreadContact > 0 },
  ];

  return (
    <div className="space-y-6">

      {/* ── 1. KPI CARDS ── */}
      <div>
        <SectionTitle>Performance Overview · Last 14 Days</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map(c => (
            <div key={c.label}
                 className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
              {/* top row: icon + delta */}
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                     style={{ background: c.bg, color: c.accent }}>
                  {c.icon}
                </div>
                <Delta pct={c.delta} />
              </div>
              {/* value */}
              <div className="text-[22px] font-black text-[var(--tx)] leading-none tracking-tight">
                {c.value}
              </div>
              {/* label + sub */}
              <div>
                <div className="text-[12px] font-semibold text-[var(--tx2)]">{c.label}</div>
                <div className="text-[10.5px] text-[var(--tx3)]">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. ALERT BAND ── */}
      <div>
        <SectionTitle>Action Items</SectionTitle>

        {stats.lowStockCount > 0 && (
          <button onClick={() => dispatch(uiActions.setAdminTab('products'))}
                  className="w-full flex items-center gap-2 bg-red-50 border border-red-200 text-red-700
                             text-[12.5px] rounded-[12px] px-4 py-2.5 mb-3 hover:bg-red-100 transition-colors text-left">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="flex-1 font-medium">
              {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} below 5 units — restock needed
            </span>
            <span className="text-red-500 font-bold text-[11px]">View →</span>
          </button>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {alerts.map(a => (
            <button key={a.label}
                    onClick={() => dispatch(uiActions.setAdminTab(a.tab))}
                    className={`flex items-center gap-3 rounded-[12px] px-3.5 py-3 border transition-all text-left
                      hover:border-[var(--dk)] hover:shadow-sm
                      ${a.urgent && a.count > 0
                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-700/40'
                        : 'bg-[var(--sf)] border-[var(--br)]'}`}>
              <span className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0
                ${a.urgent && a.count > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  : 'bg-[var(--bg3)] text-[var(--tx3)]'}`}>
                {a.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11.5px] font-semibold text-[var(--tx2)] truncate">{a.label}</span>
              </span>
              <span className={`text-[14px] font-black shrink-0
                ${a.urgent && a.count > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-[var(--tx)]'}`}>
                {a.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. CHARTS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Revenue trend – 14-day area */}
        <div className="xl:col-span-2 bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">Revenue Trend</div>
              <div className="text-[11px] text-[var(--tx3)]">Current 14 days vs previous period</div>
            </div>
            <span className="text-[11px] font-semibold text-[var(--tx3)] bg-[var(--bg2)] px-2 py-1 rounded-[8px]">
              {fmt(revDelta.current)}
            </span>
          </div>
          {revenueSeries.some(p => p.current > 0 || p.previous > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={revenueSeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D2847" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0D2847" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8820A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#C8820A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--br)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--tx3)' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--tx3)' }} tickLine={false} axisLine={false}
                       tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<ChartTooltip currency />} />
                <Legend iconType="circle" iconSize={7}
                        formatter={(v) => <span style={{ fontSize: 10, color: 'var(--tx2)' }}>{v === 'current' ? 'This Period' : 'Last Period'}</span>} />
                <Area type="monotone" dataKey="previous" name="previous" stroke="#C8820A" strokeWidth={1.5}
                      strokeDasharray="4 3" fill="url(#gradPrev)" dot={false} />
                <Area type="monotone" dataKey="current" name="current" stroke="#0D2847" strokeWidth={2}
                      fill="url(#gradCurrent)" dot={false} activeDot={{ r: 4, fill: '#0D2847' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-[12px] text-[var(--tx3)]">
              No order data in this range yet — chart will appear once orders come in.
            </div>
          )}
        </div>

        {/* Order status donut */}
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4">
          <div className="text-[13px] font-bold text-[var(--tx)] mb-0.5">Order Status</div>
          <div className="text-[11px] text-[var(--tx3)] mb-3">All-time breakdown</div>
          {statusBreakdown.length > 0 ? (
            <>
              <DonutWithLabel
                data={statusBreakdown}
                label={`${fillRate}%`}
                sub="Fulfilled"
              />
              <div className="mt-3 space-y-1.5">
                {statusBreakdown.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
                      <span className="text-[var(--tx2)]">{s.name}</span>
                    </span>
                    <span className="font-bold text-[var(--tx)]">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-[12px] text-[var(--tx3)]">No orders yet.</div>
          )}
        </div>
      </div>

      {/* ── Revenue by channel bar + Custom order pipeline ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Channel breakdown */}
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4">
          <div className="text-[13px] font-bold text-[var(--tx)] mb-0.5">Revenue by Channel</div>
          <div className="text-[11px] text-[var(--tx3)] mb-4">Retail vs Custom Build vs Wholesale</div>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={channelData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--br)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--tx3)' }} tickLine={false} axisLine={false}
                       tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: 'var(--tx2)' }} tickLine={false} axisLine={false} width={76} />
                <Tooltip content={<ChartTooltip currency />} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {channelData.map((entry, i) => (
                    <Cell key={i} fill={entry.color === 'var(--dk)' ? '#0D2847' : entry.color === 'var(--ac)' ? '#C8820A' : '#0EA5A4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-[12px] text-[var(--tx3)]">No order data yet.</div>
          )}
          {channelData.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {channelData.map(c => (
                <div key={c.key} className="text-center">
                  <div className="text-[13px] font-black text-[var(--tx)]">{c.count}</div>
                  <div className="text-[10px] text-[var(--tx3)]">{c.label} orders</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom order pipeline funnel */}
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">Custom Order Pipeline</div>
              <div className="text-[11px] text-[var(--tx3)]">Production stage breakdown</div>
            </div>
            {pipeline.total > 0 && (
              <div className="flex gap-3 text-right">
                <div>
                  <div className="text-[16px] font-black text-amber-600">{pipeline.left}</div>
                  <div className="text-[9.5px] text-[var(--tx3)]">in progress</div>
                </div>
                <div>
                  <div className="text-[16px] font-black text-green-600">
                    {customOrders.filter(c => c.adminStatus === 'delivered').length}
                  </div>
                  <div className="text-[9.5px] text-[var(--tx3)]">delivered</div>
                </div>
              </div>
            )}
          </div>
          <PipelineBar stages={pipeline.stages} total={pipeline.total} />
          {pipeline.total > 0 && (
            <button onClick={() => dispatch(uiActions.setAdminTab('custom'))}
                    className="mt-4 w-full text-[11.5px] font-semibold text-[var(--dk)] hover:underline text-center">
              Manage custom orders →
            </button>
          )}
        </div>
      </div>

      {/* ── 4. RECENT ORDERS TABLE ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Recent Orders</SectionTitle>
          <button onClick={() => dispatch(uiActions.setAdminTab('orders'))}
                  className="text-[11.5px] font-semibold text-[var(--ac)] hover:underline">
            View all →
          </button>
        </div>
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] overflow-hidden">
          {/* table header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_80px_90px_100px] gap-3 px-4 py-2
                          bg-[var(--bg2)] border-b border-[var(--br)] text-[10.5px] font-bold uppercase tracking-wide text-[var(--tx3)]">
            <span>Order</span>
            <span>Type</span>
            <span className="text-right">Items</span>
            <span className="text-right">Total</span>
            <span className="text-center">Status</span>
          </div>
          {orders.length === 0 && (
            <div className="text-center py-10 text-[12px] text-[var(--tx3)]">No orders yet.</div>
          )}
          {orders.slice(0, 8).map((o, idx) => (
            <div key={o.dbId}
                 className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_80px_80px_90px_100px]
                             gap-3 items-center px-4 py-3 text-[12.5px]
                             ${idx < orders.slice(0, 8).length - 1 ? 'border-b border-[var(--br)]' : ''}`}>
              {/* order id + date */}
              <div>
                <div className="font-bold text-[var(--tx)]">{o.id}</div>
                <div className="text-[10.5px] text-[var(--tx3)]">{o.date} · {o.items} item{o.items !== 1 ? 's' : ''}</div>
              </div>
              {/* type badge (desktop) */}
              <div className="hidden md:block">
                <span className="text-[10px] font-semibold text-[var(--tx3)] bg-[var(--bg3)] px-1.5 py-0.5 rounded-[6px] capitalize">
                  {o.orderType ?? 'retail'}
                </span>
              </div>
              {/* items count (desktop) */}
              <div className="hidden md:block text-right text-[var(--tx2)] font-medium">{o.items}</div>
              {/* total */}
              <div className="hidden md:block text-right font-bold text-[var(--tx)]">{fmt(o.total)}</div>
              {/* status badge */}
              <div className="flex md:justify-center justify-end">
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[8px] whitespace-nowrap ${orderStatusClass[o.status]}`}>
                  {o.status}
                </span>
              </div>
              {/* mobile: total shown inline */}
              <div className="md:hidden col-span-2 flex justify-between items-center mt-0.5">
                <span className="text-[10px] font-semibold text-[var(--tx3)] bg-[var(--bg3)] px-1.5 py-0.5 rounded-[6px] capitalize">
                  {o.orderType ?? 'retail'}
                </span>
                <span className="font-bold text-[var(--tx)] text-[12px]">{fmt(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

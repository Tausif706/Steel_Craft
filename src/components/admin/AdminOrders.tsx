import { useEffect, useState } from 'react';
import { SkeletonAdminTable } from '../ui/Skeleton';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminOrders, updateAdminOrderStatusThunk } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { fmt } from '../../lib/utils';
import type { Order } from '../../types';

const ORDER_STATUSES: Order['status'][] = ['Processing', 'Packed', 'In Transit', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const dispatch = useAppDispatch();
  const notify   = useNotification();
  const orders   = useAppSelector(s => s.admin.orders);
  const loaded   = useAppSelector(s => s.admin.loaded.orders);
  const [filter, setFilter] = useState('All');

  useEffect(() => { dispatch(fetchAdminOrders()); }, [dispatch]);

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const updateOrder = async (id: string, status: Order['status']) => {
    await dispatch(updateAdminOrderStatusThunk({ id, status }));
    notify(`Order → ${status}`);
  };

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading orders…</div>;

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-4">
        {['All', ...ORDER_STATUSES].map(st => (
          <button key={st} onClick={() => setFilter(st)}
            className={`flex-shrink-0 text-[12px] font-semibold px-3.5 py-1.5 rounded-full border transition-all
                        ${filter === st ? 'bg-[var(--dk)] border-[var(--dk)] text-white' : 'bg-[var(--sf)] border-[var(--br)] text-[var(--tx2)] hover:border-[var(--dk)]'}`}>
            {st}
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-[var(--tx3)] text-sm py-8">No orders here yet.</p>}
      {filtered.map(o => (
        <div key={o.dbId} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2">
          <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
            <div>
              <div className="text-[13.5px] font-bold text-[var(--tx)]">#{o.id} <span className="text-[10px] font-semibold text-[var(--tx3)] uppercase ml-1">{o.orderType}</span></div>
              <div className="text-[11px] text-[var(--tx3)]">{o.date} · {o.items} items · {o.paymentMethod?.toUpperCase()} ({o.paymentStatus})</div>
            </div>
            <select value={o.status} onChange={e => updateOrder(o.dbId, e.target.value as Order['status'])}
              className="bg-[var(--bg2)] border border-[var(--br)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] outline-none cursor-pointer">
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="text-[12px] text-[var(--tx2)] mb-1.5">
            {o.products.slice(0, 3).join(', ')}{o.products.length > 3 && ` +${o.products.length - 3} more`}
          </div>
          <div className="text-[15px] font-extrabold text-[var(--tx)]">{fmt(o.total)}</div>
        </div>
      ))}
    </div>
  );
}

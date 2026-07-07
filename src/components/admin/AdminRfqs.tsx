import { useEffect, useState } from 'react';
import { SkeletonAdminTable } from '../ui/Skeleton';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminRfqs, updateAdminRfqThunk } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { orderStatusClass } from '../../lib/utils';

const RFQ_STATUSES = ['Pending', 'Quoted', 'Converted', 'Rejected'] as const;

export default function AdminRfqs() {
  const dispatch = useAppDispatch();
  const notify = useNotification();
  const rfqs = useAppSelector(s => s.admin.rfqs);
  const loaded = useAppSelector(s => s.admin.loaded.rfqs);
  const [quoteDrafts, setQuoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => { dispatch(fetchAdminRfqs()); }, [dispatch]);

  async function updateStatus(id: string, status: string) {
    await dispatch(updateAdminRfqThunk({ id, status }));
    notify('RFQ updated');
  }
  async function saveQuote(id: string) {
    const amount = quoteDrafts[id];
    if (!amount) return;
    await dispatch(updateAdminRfqThunk({ id, quotationAmount: Number(amount), status: 'Quoted' }));
    notify('Quotation saved ✓');
  }

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading RFQs…</div>;
  if (rfqs.length === 0) return <p className="text-center text-[var(--tx3)] text-sm py-8">No wholesale requests yet.</p>;

  return (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Wholesale Requests ({rfqs.length})</div>
      {rfqs.map(r => (
        <div key={r.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2">
          <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
            <div>
              <div className="text-[13.5px] font-bold text-[var(--tx)]">{r.co}</div>
              <div className="text-[11px] text-[var(--tx3)]">{r.date} · {r.ci}</div>
            </div>
            <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
              className="bg-[var(--bg2)] border border-[var(--br)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] outline-none cursor-pointer">
              {RFQ_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="text-[12.5px] text-[var(--tx2)] mb-1.5">{r.pr} · <strong>{r.qty} units</strong></div>
          <div className="flex gap-4 text-[12px] text-[var(--tx3)] flex-wrap mb-2">
            <span>📞 {r.ph}</span><span>✉️ {r.em}</span><span>👤 {r.nm || '—'}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[10px] ${orderStatusClass[r.status]}`}>{r.status}</span>
            {r.quotationAmount != null && <span className="text-[13px] font-bold text-[var(--tx)]">Quoted: ₹{r.quotationAmount.toLocaleString('en-IN')}</span>}
          </div>
          <div className="flex gap-2">
            <input type="number" placeholder="Quote amount ₹" value={quoteDrafts[r.id] ?? ''}
              onChange={e => setQuoteDrafts(p => ({ ...p, [r.id]: e.target.value }))}
              className="flex-1 px-3 py-1.5 border border-[var(--br)] rounded-[8px] text-[12px] bg-[var(--bg2)] text-[var(--tx)] outline-none" />
            <button onClick={() => saveQuote(r.id)} className="text-[12px] font-bold px-3 py-1.5 bg-[var(--dk)] text-white rounded-[8px]">Send Quote</button>
          </div>
        </div>
      ))}
    </div>
  );
}

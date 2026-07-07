import { useEffect, useState } from 'react';
import { SkeletonAdminTable } from '../ui/Skeleton';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminCustomOrders, updateAdminCustomOrderThunk, fetchAdminWorkItemsThunk, updateAdminWorkItemThunk } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { fmt } from '../../lib/utils';
import { Btn } from '../../components/ui/shared';
import { ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_OPTIONS = [
  'pending_review', 'quoted', 'approved', 'rejected', 'in_production',
  'quality_check', 'ready_to_dispatch', 'dispatched', 'delivered',
];
const STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review', quoted: 'Quoted', approved: 'Approved', rejected: 'Rejected',
  in_production: 'In Production', quality_check: 'Quality Check', ready_to_dispatch: 'Ready to Dispatch',
  dispatched: 'Dispatched', delivered: 'Delivered',
};
const WORK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'];

export default function AdminCustomOrders() {
  const dispatch = useAppDispatch();
  const notify = useNotification();
  const customOrders = useAppSelector(s => s.admin.customOrders);
  const loaded = useAppSelector(s => s.admin.loaded.customOrders);
  const workItems = useAppSelector(s => s.admin.workItems);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { notes: string; finalPrice: string }>>({});

  useEffect(() => { dispatch(fetchAdminCustomOrders()); }, [dispatch]);

  function draftFor(id: string, notes: string | null, finalPrice: number | null) {
    return drafts[id] ?? { notes: notes ?? '', finalPrice: finalPrice != null ? String(finalPrice) : '' };
  }

  async function saveStatus(id: string, adminStatus: string) {
    await dispatch(updateAdminCustomOrderThunk({ id, adminStatus }));
    notify(`Design → ${STATUS_LABEL[adminStatus]}`);
  }
  async function saveNotesAndPrice(id: string) {
    const d = drafts[id];
    if (!d) return;
    await dispatch(updateAdminCustomOrderThunk({ id, adminNotes: d.notes, finalPrice: d.finalPrice ? Number(d.finalPrice) : undefined }));
    notify('Saved ✓');
  }
  function toggleExpand(id: string) {
    setExpanded(e => (e === id ? null : id));
    if (!workItems[id]) dispatch(fetchAdminWorkItemsThunk(id));
  }

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading custom orders…</div>;
  if (customOrders.length === 0) return <p className="text-center text-[var(--tx3)] text-sm py-8">No custom designs submitted yet.</p>;

  return (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Custom Furniture Designs ({customOrders.length})</div>
      <div className="space-y-3">
        {customOrders.map(co => {
          const d = draftFor(co.id, co.adminNotes, co.finalPrice);
          const isOpen = expanded === co.id;
          return (
            <div key={co.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-3.5">
              <div className="flex gap-3">
                {co.images[0] && <img src={co.images[0]} alt="" className="w-20 h-20 rounded-[10px] object-cover border border-[var(--br)] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <div className="text-[13.5px] font-bold text-[var(--tx)]">{co.spec?.label ?? 'Custom Furniture'}</div>
                      <div className="text-[11px] text-[var(--tx3)]">{co.customerName || 'Customer'} · {new Date(co.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                    <select value={co.adminStatus} onChange={e => saveStatus(co.id, e.target.value)}
                      className="bg-[var(--bg2)] border border-[var(--br)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] outline-none cursor-pointer">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </div>
                  <div className="text-[11.5px] text-[var(--tx2)] mt-1">
                    {co.spec ? `${co.spec.widthIn}"×${co.spec.heightIn}"×${co.spec.depthIn}" · ${co.spec.doors} door(s) · ${co.spec.shelves} shelf/shelves` : ''}
                  </div>
                  <div className="text-[13px] font-extrabold text-[var(--tx)] mt-1">Estimated: {fmt(co.estimatedPrice ?? 0)}</div>
                </div>
              </div>

              <div className="grid sm:grid-cols-[1fr,160px] gap-2 mt-3">
                <input value={d.notes} onChange={e => setDrafts(p => ({ ...p, [co.id]: { ...d, notes: e.target.value } }))}
                  placeholder="Admin notes for customer…"
                  className="px-3 py-2 border border-[var(--br)] rounded-[9px] text-[12.5px] bg-[var(--bg2)] text-[var(--tx)] outline-none" />
                <input value={d.finalPrice} onChange={e => setDrafts(p => ({ ...p, [co.id]: { ...d, finalPrice: e.target.value } }))}
                  placeholder="Final price ₹" type="number"
                  className="px-3 py-2 border border-[var(--br)] rounded-[9px] text-[12.5px] bg-[var(--bg2)] text-[var(--tx)] outline-none" />
              </div>
              <div className="flex justify-between items-center mt-2">
                <Btn variant="secondary" className="py-1.5 px-3 text-[11.5px]" onClick={() => saveNotesAndPrice(co.id)}>Save Notes / Price</Btn>
                <button onClick={() => toggleExpand(co.id)} className="text-[12px] font-semibold text-[var(--dk)] flex items-center gap-1">
                  Manufacturing Tasks {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-[var(--br)]">
                  {!workItems[co.id] ? (
                    <p className="text-[12px] text-[var(--tx3)]">Loading tasks…</p>
                  ) : workItems[co.id].length === 0 ? (
                    <p className="text-[12px] text-[var(--tx3)]">Tasks appear automatically once the design is approved.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {workItems[co.id].map(wi => (
                        <div key={wi.id} className="flex items-center justify-between gap-2 bg-[var(--bg2)] rounded-[9px] px-3 py-2">
                          <span className="text-[12.5px] font-semibold text-[var(--tx)]">{wi.title}</span>
                          <select value={wi.status}
                            onChange={e => dispatch(updateAdminWorkItemThunk({ id: wi.id, customOrderId: co.id, status: e.target.value }))}
                            className="bg-[var(--sf)] border border-[var(--br)] rounded-lg px-2 py-1 text-[11.5px] text-[var(--tx)] outline-none cursor-pointer">
                            {WORK_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

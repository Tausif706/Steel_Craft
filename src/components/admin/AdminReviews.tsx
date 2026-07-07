import { useEffect } from 'react';
import { SkeletonAdminTable } from '../ui/Skeleton';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminReviews, setAdminReviewApprovalThunk, deleteAdminReviewThunk } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';
import { stars } from '../../lib/utils';
import { Star } from 'lucide-react';

export default function AdminReviews() {
  const dispatch = useAppDispatch();
  const notify = useNotification();
  const reviews = useAppSelector(s => s.admin.reviews);
  const loaded = useAppSelector(s => s.admin.loaded.reviews);

  useEffect(() => { dispatch(fetchAdminReviews()); }, [dispatch]);

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading reviews…</div>;
  if (reviews.length === 0) return <p className="text-center text-[var(--tx3)] text-sm py-8">No reviews yet.</p>;

  return (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Product Reviews ({reviews.length})</div>
      {reviews.map(r => (
        <div key={r.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2">
          <div className="flex justify-between items-start gap-2 mb-1">
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">{r.productName}</div>
              <div className="text-[11px] text-[var(--tx3)]">{r.userName} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              {stars(r.rating).map((f, i) => <Star key={i} size={13} className={f ? 'text-amber-400 fill-amber-400' : 'text-[var(--br2)]'} />)}
            </div>
          </div>
          <p className="text-[12.5px] text-[var(--tx2)] leading-relaxed mb-2">{r.review}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[10px] ${r.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {r.isApproved ? 'Approved' : 'Hidden'}
            </span>
            <button onClick={() => { dispatch(setAdminReviewApprovalThunk({ id: r.id, approved: !r.isApproved })); notify('Updated'); }}
              className="text-[11.5px] font-bold text-[var(--dk)]">{r.isApproved ? 'Hide' : 'Approve'}</button>
            <button onClick={() => { if (confirm('Delete this review?')) { dispatch(deleteAdminReviewThunk(r.id)); notify('Deleted', 'info'); } }}
              className="text-[11.5px] font-bold text-[var(--re)]">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

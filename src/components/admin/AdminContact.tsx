import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminContactMessages, markAdminContactReadThunk } from '../../store/slices';

export default function AdminContact() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(s => s.admin.contactMessages);
  const loaded = useAppSelector(s => s.admin.loaded.contactMessages);

  useEffect(() => { dispatch(fetchAdminContactMessages()); }, [dispatch]);

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading messages…</div>;
  if (messages.length === 0) return <p className="text-center text-[var(--tx3)] text-sm py-8">No messages yet.</p>;

  return (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Contact Messages ({messages.length})</div>
      {messages.map(m => (
        <div key={m.id}
          onClick={() => { if (!m.isRead) dispatch(markAdminContactReadThunk(m.id)); }}
          className={`border rounded-[13px] p-3.5 mb-2 cursor-pointer transition-colors
                      ${m.isRead ? 'bg-[var(--sf)] border-[var(--br)]' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex justify-between items-start gap-2 mb-1">
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">{m.name} {!m.isRead && <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded ml-1">NEW</span>}</div>
              <div className="text-[11px] text-[var(--tx3)]">{m.email} {m.phone && `· ${m.phone}`} · {new Date(m.createdAt).toLocaleDateString('en-IN')}</div>
            </div>
            {m.subject && <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-[10px] bg-[var(--bg2)] text-[var(--tx2)] whitespace-nowrap">{m.subject}</span>}
          </div>
          <p className="text-[12.5px] text-[var(--tx2)] leading-relaxed">{m.message}</p>
        </div>
      ))}
    </div>
  );
}

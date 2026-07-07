import { useEffect } from 'react';
import { SkeletonAdminTable } from '../ui/Skeleton';
import { useAppSelector, useAppDispatch } from '../../store';
import { fetchAdminUsers, updateAdminUserThunk } from '../../store/slices';
import { useNotification } from '../../hooks/useNotification';

export default function AdminUsers() {
  const dispatch = useAppDispatch();
  const notify = useNotification();
  const users = useAppSelector(s => s.admin.users);
  const loaded = useAppSelector(s => s.admin.loaded.users);

  useEffect(() => { dispatch(fetchAdminUsers()); }, [dispatch]);

  if (!loaded) return <div className="text-center py-10 text-[var(--tx3)] text-sm">Loading users…</div>;

  return (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Customers &amp; Staff ({users.length})</div>
      {users.map(u => (
        <div key={u.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2 flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-full bg-[var(--dk)] text-white flex items-center justify-center font-bold flex-shrink-0">
            {(u.name[0] ?? '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-[140px]">
            <div className="text-[13px] font-bold text-[var(--tx)]">{u.name}</div>
            <div className="text-[11.5px] text-[var(--tx3)]">{u.email} {u.phone && `· ${u.phone}`}</div>
          </div>
          <select value={u.accountType}
            onChange={e => { dispatch(updateAdminUserThunk({ id: u.id, accountType: e.target.value as any })); notify('Account type updated'); }}
            className="bg-[var(--bg2)] border border-[var(--br)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] outline-none cursor-pointer">
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
          <select value={u.role}
            onChange={e => { dispatch(updateAdminUserThunk({ id: u.id, role: e.target.value as any })); notify('Role updated'); }}
            className="bg-[var(--bg2)] border border-[var(--br)] rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--tx)] outline-none cursor-pointer">
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => { dispatch(updateAdminUserThunk({ id: u.id, isActive: !u.isActive })); notify(u.isActive ? 'User deactivated' : 'User reactivated', 'info'); }}
            className={`text-[10.5px] font-bold px-2.5 py-1.5 rounded-[9px] ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {u.isActive ? 'Active' : 'Inactive'}
          </button>
        </div>
      ))}
    </div>
  );
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store';

/** Wrap any route that requires the visitor to be signed in. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAppSelector(s => s.auth.status);
  const userId = useAppSelector(s => s.auth.userId);
  const location = useLocation();

  if (status === 'loading' || status === 'idle') {
    return <div className="flex items-center justify-center py-32 text-[var(--tx2)]">Loading…</div>;
  }
  if (!userId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Wrap any route that requires the visitor to be a signed-in admin. */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const status = useAppSelector(s => s.auth.status);
  const userId = useAppSelector(s => s.auth.userId);
  const role = useAppSelector(s => s.auth.profile?.role);

  if (status === 'loading' || status === 'idle') {
    return <div className="flex items-center justify-center py-32 text-[var(--tx2)]">Loading…</div>;
  }
  if (!userId) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

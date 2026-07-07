import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  authActions, initAuth, fetchCatalog, hydrateCart, hydrateWishlist, mergeGuestCartOnLogin,
} from '../../store/slices';

/**
 * Mounted once near the root of the app. Listens to Supabase auth
 * changes and keeps Redux (profile, catalog pricing, cart, wishlist)
 * in sync — no page component needs to know about Supabase auth directly.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const accountType = useAppSelector(s => s.auth.profile?.accountType ?? 'retail');
  const didInitialLoad = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      dispatch(authActions.setSession({ userId: session?.user.id ?? null, email: session?.user.email ?? null }));
      await dispatch(initAuth());
      const profileAccountType = session?.user ? undefined : 'retail';
      await Promise.all([
        dispatch(fetchCatalog(profileAccountType as any ?? 'retail')),
        dispatch(hydrateCart()),
        dispatch(hydrateWishlist()),
      ]);
      didInitialLoad.current = true;

      const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!didInitialLoad.current) return;
        dispatch(authActions.setSession({ userId: newSession?.user.id ?? null, email: newSession?.user.email ?? null }));
        if (event === 'SIGNED_IN') {
          await dispatch(initAuth());
          await dispatch(mergeGuestCartOnLogin());
          await dispatch(hydrateWishlist());
        }
        if (event === 'SIGNED_OUT') {
          await dispatch(hydrateCart());
          await dispatch(hydrateWishlist());
        }
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => { if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch catalog (for correct wholesale pricing) whenever account type resolves/changes
  useEffect(() => {
    if (didInitialLoad.current) dispatch(fetchCatalog(accountType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType]);

  return <>{children}</>;
}

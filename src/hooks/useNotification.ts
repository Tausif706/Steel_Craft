import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { uiActions } from '../store/slices';
import type { Notification } from '../types';

export function useNotification() {
  const dispatch = useAppDispatch();
  let timer: ReturnType<typeof setTimeout>;

  return useCallback((msg: string, type: Notification['type'] = 'ok') => {
    clearTimeout(timer);
    dispatch(uiActions.setNotif({ msg, type }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    timer = setTimeout(() => dispatch(uiActions.setNotif(null)), 3200);
  }, [dispatch]);
}

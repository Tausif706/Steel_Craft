import type { CartItem, Product } from '../types';

const CART_KEY = 'sc_guest_cart_v1';
const WISH_KEY = 'sc_guest_wish_v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore (storage disabled / full) */ }
}

export const guestCart = {
  load: (): CartItem[] => read(CART_KEY, []),
  save: (items: CartItem[]) => write(CART_KEY, items),
  clear: () => localStorage.removeItem(CART_KEY),
};

export const guestWish = {
  load: (): Product[] => read(WISH_KEY, []),
  save: (items: Product[]) => write(WISH_KEY, items),
  clear: () => localStorage.removeItem(WISH_KEY),
};

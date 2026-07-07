import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Product, CartItem, Order, RFQEntry, Category, CheckoutState, Notification,
  Profile, Address, CustomOrderEntry, AdminUserRow, ContactMessageRow, Review, WorkItem,
} from '../types';
import * as repo from '../lib/repo';
import { guestCart, guestWish } from '../lib/localStore';
import type { RootState } from './index';

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════
interface AuthState {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  status: 'idle' | 'loading' | 'ready';
}
const authInitial: AuthState = { userId: null, email: null, profile: null, status: 'idle' };

export const initAuth = createAsyncThunk('auth/init', async () => {
  const profile = await repo.fetchMyProfile();
  return profile;
});

export const refreshProfile = createAsyncThunk('auth/refresh', async () => repo.fetchMyProfile());

export const updateProfileThunk = createAsyncThunk('auth/update', async (patch: { firstName?: string; lastName?: string; phone?: string }) => {
  await repo.updateMyProfile(patch);
  return repo.fetchMyProfile();
});

export const signOutThunk = createAsyncThunk('auth/signOut', async () => { await repo.signOut(); });

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitial,
  reducers: {
    setSession(state, action: PayloadAction<{ userId: string | null; email: string | null }>) {
      state.userId = action.payload.userId;
      state.email = action.payload.email;
      if (!action.payload.userId) { state.profile = null; }
    },
  },
  extraReducers: (b) => {
    b.addCase(initAuth.pending, (s) => { s.status = 'loading'; });
    b.addCase(initAuth.fulfilled, (s, a) => { s.profile = a.payload; s.status = 'ready'; });
    b.addCase(initAuth.rejected, (s) => { s.status = 'ready'; });
    b.addCase(refreshProfile.fulfilled, (s, a) => { s.profile = a.payload; });
    b.addCase(updateProfileThunk.fulfilled, (s, a) => { s.profile = a.payload; });
    b.addCase(signOutThunk.fulfilled, (s) => { s.userId = null; s.email = null; s.profile = null; });
  },
});
export const authActions = authSlice.actions;

// ════════════════════════════════════════════════════════════════
// CATALOG (products + categories)
// ════════════════════════════════════════════════════════════════
interface CatalogState {
  products: Product[];
  categories: Category[];
  status: 'idle' | 'loading' | 'ready';
}
const catalogInitial: CatalogState = { products: [], categories: [], status: 'idle' };

export const fetchCatalog = createAsyncThunk('catalog/fetch', async (accountType: 'retail' | 'wholesale' = 'retail') => {
  const [products, categories] = await Promise.all([repo.fetchProducts(accountType), repo.fetchCategories()]);
  return { products, categories };
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: catalogInitial,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCatalog.pending, (s) => { s.status = 'loading'; });
    b.addCase(fetchCatalog.fulfilled, (s, a) => { s.products = a.payload.products; s.categories = a.payload.categories; s.status = 'ready'; });
    b.addCase(fetchCatalog.rejected, (s) => { s.status = 'ready'; });
  },
});
export const catalogActions = catalogSlice.actions;

// ════════════════════════════════════════════════════════════════
// CART
// ════════════════════════════════════════════════════════════════
interface CartState { items: CartItem[]; status: 'idle' | 'loading' | 'ready'; }
const cartInitial: CartState = { items: [], status: 'idle' };

function isSignedIn(state: RootState) { return !!state.auth.userId; }

export const hydrateCart = createAsyncThunk('cart/hydrate', async (_: void, { getState }) => {
  const state = getState() as RootState;
  if (isSignedIn(state)) {
    const accountType = state.auth.profile?.accountType ?? 'retail';
    const rows = await repo.fetchCart(accountType);
    return rows.map(r => ({ ...r.product, qty: r.qty }));
  }
  return guestCart.load();
});

export const addToCart = createAsyncThunk('cart/add', async (product: Product, { getState }) => {
  const state = getState() as RootState;
  if (isSignedIn(state)) {
    const existing = state.cart.items.find(i => i.id === product.id);
    await repo.upsertCartItem(product.id, (existing?.qty ?? 0) + 1);
  }
  return product;
});

export const removeFromCart = createAsyncThunk('cart/remove', async (productId: number, { getState }) => {
  const state = getState() as RootState;
  if (isSignedIn(state)) await repo.removeCartItem(productId);
  return productId;
});

export const updateQty = createAsyncThunk('cart/updateQty', async (payload: { id: number; delta: number }, { getState }) => {
  const state = getState() as RootState;
  const item = state.cart.items.find(i => i.id === payload.id);
  const newQty = Math.max(1, (item?.qty ?? 1) + payload.delta);
  if (isSignedIn(state)) await repo.upsertCartItem(payload.id, newQty);
  return { id: payload.id, qty: newQty };
});

export const clearCart = createAsyncThunk('cart/clear', async (_: void, { getState }) => {
  const state = getState() as RootState;
  if (isSignedIn(state)) await repo.clearCartDb();
});

export const mergeGuestCartOnLogin = createAsyncThunk('cart/mergeGuest', async (_: void, { getState }) => {
  const guest = guestCart.load();
  const state = getState() as RootState;
  for (const item of guest) {
    const existing = state.cart.items.find(i => i.id === item.id);
    await repo.upsertCartItem(item.id, (existing?.qty ?? 0) + item.qty);
  }
  guestCart.clear();
  const accountType = state.auth.profile?.accountType ?? 'retail';
  const rows = await repo.fetchCart(accountType);
  return rows.map(r => ({ ...r.product, qty: r.qty }));
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: cartInitial,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(hydrateCart.fulfilled, (s, a) => { s.items = a.payload; s.status = 'ready'; });
    b.addCase(addToCart.fulfilled, (s, a) => {
      const existing = s.items.find(i => i.id === a.payload.id);
      if (existing) existing.qty += 1; else s.items.push({ ...a.payload, qty: 1 });
      if (!s.items) return;
    });
    b.addCase(removeFromCart.fulfilled, (s, a) => { s.items = s.items.filter(i => i.id !== a.payload); });
    b.addCase(updateQty.fulfilled, (s, a) => {
      const item = s.items.find(i => i.id === a.payload.id);
      if (item) item.qty = a.payload.qty;
    });
    b.addCase(clearCart.fulfilled, (s) => { s.items = []; });
    b.addCase(mergeGuestCartOnLogin.fulfilled, (s, a) => { s.items = a.payload; });
  },
});
// Backward-compatible action-object names so existing page components
// (Cart.tsx, ProductCard.tsx, ProductDetail.tsx, Compare.tsx...) keep working unchanged —
// these are thunks now, but `dispatch(cartActions.addToCart(p))` still works exactly the same.
export const cartActions = { addToCart, removeFromCart, updateQty, clearCart };
export const cartReducer = cartSlice.reducer;

// ════════════════════════════════════════════════════════════════
// WISHLIST
// ════════════════════════════════════════════════════════════════
interface WishState { items: Product[]; status: 'idle' | 'ready'; }
const wishInitial: WishState = { items: [], status: 'idle' };

export const hydrateWishlist = createAsyncThunk('wish/hydrate', async (_: void, { getState }) => {
  const state = getState() as RootState;
  if (isSignedIn(state)) return repo.fetchWishlist(state.auth.profile?.accountType ?? 'retail');
  return guestWish.load();
});

export const toggleWish = createAsyncThunk('wish/toggle', async (product: Product, { getState }) => {
  const state = getState() as RootState;
  const isWished = state.wish.items.some(i => i.id === product.id);
  if (isSignedIn(state)) {
    if (isWished) await repo.removeWishlistItem(product.id); else await repo.addWishlistItem(product.id);
  }
  return { product, nowWished: !isWished };
});

const wishSlice = createSlice({
  name: 'wish',
  initialState: wishInitial,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(hydrateWishlist.fulfilled, (s, a) => { s.items = a.payload; s.status = 'ready'; });
    b.addCase(toggleWish.fulfilled, (s, a) => {
      if (a.payload.nowWished) s.items.push(a.payload.product);
      else s.items = s.items.filter(i => i.id !== a.payload.product.id);
    });
  },
});
export const wishActions = { toggleWish };
export const wishReducer = wishSlice.reducer;

// ════════════════════════════════════════════════════════════════
// COMPARE  (purely client-side, unchanged from original behaviour)
// ════════════════════════════════════════════════════════════════
const compareSlice = createSlice({
  name: 'compare',
  initialState: [] as Product[],
  reducers: {
    toggleCompare(state, action: PayloadAction<Product>) {
      const idx = state.findIndex(p => p.id === action.payload.id);
      if (idx >= 0) state.splice(idx, 1); else state.push(action.payload);
    },
    clearCompare() { return []; },
  },
});
export const compareActions = compareSlice.actions;
export const compareReducer = compareSlice.reducer;

// ════════════════════════════════════════════════════════════════
// "MY ACCOUNT" — orders, addresses, RFQs, custom orders (Dashboard + Checkout)
// ════════════════════════════════════════════════════════════════
interface OrdersState {
  checkout: CheckoutState;
  list: Order[];
  lastOrderId: string | null;
  addresses: Address[];
  myRfqs: RFQEntry[];
  myCustomOrders: CustomOrderEntry[];
  aiDesignCount: number;
  myPayments: import('../types').Payment[];
  status: 'idle' | 'loading' | 'ready';
  placing: boolean;
  placeError: string | null;
}
const checkoutInitial: CheckoutState = {
  step: 1, cnm: '', cph: '', cem: '', ca1: '', ca2: '', city: '', state: '', pin: '',
  shipping: 'standard', payment: 'cod', coupon: '', saveAddress: true, addressId: null,
};
const ordersInitial: OrdersState = {
  checkout: checkoutInitial, list: [], lastOrderId: null, addresses: [], myRfqs: [],
  myCustomOrders: [], aiDesignCount: 0, myPayments: [], status: 'idle', placing: false, placeError: null,
};

export const fetchMyAccountData = createAsyncThunk('account/fetch', async () => {
  const [orders, addresses, myRfqs, myCustomOrders, aiDesignCount, myPayments] = await Promise.all([
    repo.fetchMyOrders(), repo.fetchAddresses(), repo.fetchMyRfqs(), repo.fetchMyCustomOrders(),
    repo.fetchMyAiDesignCount(), repo.fetchMyPayments(),
  ]);
  return { orders, addresses, myRfqs, myCustomOrders, aiDesignCount, myPayments };
});

// Mock payment thunk — simulates checkout. Replace with real Razorpay call in Sprint B-live.
export const mockPayOrderThunk = createAsyncThunk(
  'account/mockPayOrder',
  async ({ orderId, amount, paymentMethod, gstAmount }: { orderId: string; amount: number; paymentMethod: string; gstAmount?: number }) => {
    const paymentId = await repo.mockPayOrder(orderId, amount, paymentMethod, gstAmount ?? 0);
    const [list, myPayments] = await Promise.all([repo.fetchMyOrders(), repo.fetchMyPayments()]);
    return { paymentId, list, myPayments };
  },
);

export const mockPayCustomOrderThunk = createAsyncThunk(
  'account/mockPayCustomOrder',
  async ({ customOrderId, amount, paymentMethod }: { customOrderId: string; amount: number; paymentMethod: string }) => {
    const paymentId = await repo.mockPayCustomOrder(customOrderId, amount, paymentMethod);
    const [myCustomOrders, myPayments] = await Promise.all([repo.fetchMyCustomOrders(), repo.fetchMyPayments()]);
    return { paymentId, myCustomOrders, myPayments };
  },
);

export const placeOrderThunk = createAsyncThunk(
  'account/placeOrder',
  async (input: repo.PlaceOrderInput) => repo.placeOrder(input),
);

export const upsertAddressThunk = createAsyncThunk('account/upsertAddress', async (addr: Partial<Address> & { id?: string }) => {
  await repo.upsertAddress(addr);
  return repo.fetchAddresses();
});
export const deleteAddressThunk = createAsyncThunk('account/deleteAddress', async (id: string) => {
  await repo.deleteAddress(id);
  return repo.fetchAddresses();
});

export const submitRfqThunk = createAsyncThunk('account/submitRfq', async (input: repo.RfqInput) => {
  await repo.submitRfq(input);
  return repo.fetchMyRfqs();
});

export const submitCustomOrderThunk = createAsyncThunk('account/submitCustomOrder', async (designId: string) => {
  await repo.submitCustomOrder(designId);
  return repo.fetchMyCustomOrders();
});

export const convertCustomOrderThunk = createAsyncThunk('account/convertCustomOrder', async (customOrderId: string) => {
  const order = await repo.convertCustomOrderToOrder(customOrderId);
  const [orders, myCustomOrders] = await Promise.all([repo.fetchMyOrders(), repo.fetchMyCustomOrders()]);
  return { order, orders, myCustomOrders };
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: ordersInitial,
  reducers: {
    setCheckout(state, action: PayloadAction<Partial<CheckoutState>>) {
      state.checkout = { ...state.checkout, ...action.payload };
    },
    resetCheckout(state) { state.checkout = checkoutInitial; },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyAccountData.pending, (s) => { s.status = 'loading'; });
    b.addCase(fetchMyAccountData.fulfilled, (s, a) => {
      s.list = a.payload.orders; s.addresses = a.payload.addresses; s.myRfqs = a.payload.myRfqs;
      s.myCustomOrders = a.payload.myCustomOrders; s.aiDesignCount = a.payload.aiDesignCount;
      s.myPayments = (a.payload as any).myPayments ?? [];
      s.status = 'ready';
    });
    b.addCase(fetchMyAccountData.rejected, (s) => { s.status = 'ready'; });

    b.addCase(mockPayOrderThunk.fulfilled, (s, a) => { s.list = a.payload.list; s.myPayments = a.payload.myPayments; });
    b.addCase(mockPayCustomOrderThunk.fulfilled, (s, a) => { s.myCustomOrders = a.payload.myCustomOrders; s.myPayments = a.payload.myPayments; });
    b.addCase(placeOrderThunk.pending, (s) => { s.placing = true; s.placeError = null; });
    b.addCase(placeOrderThunk.fulfilled, (s, a) => {
      s.placing = false; s.lastOrderId = a.payload.id; s.checkout = { ...s.checkout, step: 5 };
      s.list.unshift(a.payload);
    });
    b.addCase(placeOrderThunk.rejected, (s, a) => { s.placing = false; s.placeError = a.error.message ?? 'Could not place order'; });

    b.addCase(upsertAddressThunk.fulfilled, (s, a) => { s.addresses = a.payload; });
    b.addCase(deleteAddressThunk.fulfilled, (s, a) => { s.addresses = a.payload; });
    b.addCase(submitRfqThunk.fulfilled, (s, a) => { s.myRfqs = a.payload; });
    b.addCase(submitCustomOrderThunk.fulfilled, (s, a) => { s.myCustomOrders = a.payload; });
    b.addCase(convertCustomOrderThunk.fulfilled, (s, a) => {
      s.list = a.payload.orders; s.myCustomOrders = a.payload.myCustomOrders; s.lastOrderId = a.payload.order.id;
    });
  },
});
export const ordersActions = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;

// ════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════
interface AdminState {
  stats: repo.AdminStats | null;
  orders: Order[];
  rfqs: RFQEntry[];
  products: Product[];
  users: AdminUserRow[];
  reviews: (Review & { isApproved: boolean; productName: string })[];
  customOrders: CustomOrderEntry[];
  contactMessages: ContactMessageRow[];
  workItems: Record<string, WorkItem[]>;
  settings: { gst_rate?: { rate: number }; free_shipping_threshold?: { amount: number }; steel_pricing?: any };
  loaded: Record<string, boolean>;
}
const adminInitial: AdminState = {
  stats: null, orders: [], rfqs: [], products: [], users: [], reviews: [],
  customOrders: [], contactMessages: [], workItems: {}, settings: {}, loaded: {},
};

export const fetchAdminStats = createAsyncThunk('admin/stats', () => repo.adminFetchStats());
export const fetchAdminOrders = createAsyncThunk('admin/orders', () => repo.adminFetchAllOrders());
export const updateAdminOrderStatusThunk = createAsyncThunk('admin/updateOrderStatus', async (p: { id: string; status: string }) => {
  await repo.adminUpdateOrderStatus(p.id, p.status);
  return repo.adminFetchAllOrders();
});
export const fetchAdminRfqs = createAsyncThunk('admin/rfqs', () => repo.adminFetchAllRfqs());
export const updateAdminRfqThunk = createAsyncThunk('admin/updateRfq', async (p: { id: string; status?: string; quotationAmount?: number; adminNotes?: string }) => {
  await repo.adminUpdateRfq(p.id, p);
  return repo.adminFetchAllRfqs();
});
export const fetchAdminProducts = createAsyncThunk('admin/products', () => repo.adminFetchAllProducts());
export const createAdminProductThunk = createAsyncThunk('admin/createProduct', async (input: repo.ProductInput) => {
  await repo.adminCreateProduct(input);
  return repo.adminFetchAllProducts();
});
export const updateAdminProductThunk = createAsyncThunk('admin/updateProduct', async (p: { id: number; patch: Partial<repo.ProductInput> }) => {
  await repo.adminUpdateProduct(p.id, p.patch);
  return repo.adminFetchAllProducts();
});
export const deleteAdminProductThunk = createAsyncThunk('admin/deleteProduct', async (id: number) => {
  await repo.adminDeleteProduct(id);
  return repo.adminFetchAllProducts();
});
export const uploadAdminProductImageThunk = createAsyncThunk('admin/uploadProductImage', async (p: { productId: number; file: File }) => {
  await repo.adminUploadProductImage(p.productId, p.file);
  return repo.adminFetchAllProducts();
});
export const fetchAdminUsers = createAsyncThunk('admin/users', () => repo.adminFetchUsers());
export const updateAdminUserThunk = createAsyncThunk('admin/updateUser', async (p: { id: string; role?: 'customer' | 'admin'; accountType?: 'retail' | 'wholesale'; isActive?: boolean }) => {
  await repo.adminUpdateUser(p.id, p);
  return repo.adminFetchUsers();
});
export const fetchAdminReviews = createAsyncThunk('admin/reviews', () => repo.adminFetchAllReviews());
export const setAdminReviewApprovalThunk = createAsyncThunk('admin/setReviewApproval', async (p: { id: string; approved: boolean }) => {
  await repo.adminSetReviewApproval(p.id, p.approved);
  return repo.adminFetchAllReviews();
});
export const deleteAdminReviewThunk = createAsyncThunk('admin/deleteReview', async (id: string) => {
  await repo.adminDeleteReview(id);
  return repo.adminFetchAllReviews();
});
export const fetchAdminCustomOrders = createAsyncThunk('admin/customOrders', () => repo.adminFetchCustomOrders());
export const updateAdminCustomOrderThunk = createAsyncThunk('admin/updateCustomOrder', async (p: { id: string; adminStatus?: string; adminNotes?: string; finalPrice?: number }) => {
  await repo.adminUpdateCustomOrder(p.id, p);
  return repo.adminFetchCustomOrders();
});
export const fetchAdminWorkItemsThunk = createAsyncThunk('admin/workItems', async (customOrderId: string) => {
  const items = await repo.fetchWorkItems(customOrderId);
  return { customOrderId, items };
});
export const updateAdminWorkItemThunk = createAsyncThunk('admin/updateWorkItem', async (p: { id: string; customOrderId: string; status?: string; notes?: string }) => {
  await repo.updateWorkItem(p.id, p);
  const items = await repo.fetchWorkItems(p.customOrderId);
  return { customOrderId: p.customOrderId, items };
});
export const fetchAdminContactMessages = createAsyncThunk('admin/contactMessages', () => repo.adminFetchContactMessages());
export const markAdminContactReadThunk = createAsyncThunk('admin/markContactRead', async (id: string) => {
  await repo.adminMarkContactRead(id);
  return repo.adminFetchContactMessages();
});
export const fetchAdminSettings = createAsyncThunk('admin/settings', async () => {
  const [gst, ship, steel] = await Promise.all([
    repo.adminFetchSetting('gst_rate'), repo.adminFetchSetting('free_shipping_threshold'), repo.adminFetchSetting('steel_pricing'),
  ]);
  return { gst_rate: gst, free_shipping_threshold: ship, steel_pricing: steel };
});
export const updateAdminSettingThunk = createAsyncThunk('admin/updateSetting', async (p: { key: string; value: any }) => {
  await repo.adminUpdateSetting(p.key, p.value);
  const [gst, ship, steel] = await Promise.all([
    repo.adminFetchSetting('gst_rate'), repo.adminFetchSetting('free_shipping_threshold'), repo.adminFetchSetting('steel_pricing'),
  ]);
  return { gst_rate: gst, free_shipping_threshold: ship, steel_pricing: steel };
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: adminInitial,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAdminStats.fulfilled, (s, a) => { s.stats = a.payload; s.loaded.stats = true; });
    b.addCase(fetchAdminOrders.fulfilled, (s, a) => { s.orders = a.payload; s.loaded.orders = true; });
    b.addCase(updateAdminOrderStatusThunk.fulfilled, (s, a) => { s.orders = a.payload; });
    b.addCase(fetchAdminRfqs.fulfilled, (s, a) => { s.rfqs = a.payload; s.loaded.rfqs = true; });
    b.addCase(updateAdminRfqThunk.fulfilled, (s, a) => { s.rfqs = a.payload; });
    b.addCase(fetchAdminProducts.fulfilled, (s, a) => { s.products = a.payload; s.loaded.products = true; });
    b.addCase(createAdminProductThunk.fulfilled, (s, a) => { s.products = a.payload; });
    b.addCase(updateAdminProductThunk.fulfilled, (s, a) => { s.products = a.payload; });
    b.addCase(deleteAdminProductThunk.fulfilled, (s, a) => { s.products = a.payload; });
    b.addCase(uploadAdminProductImageThunk.fulfilled, (s, a) => { s.products = a.payload; });
    b.addCase(fetchAdminUsers.fulfilled, (s, a) => { s.users = a.payload; s.loaded.users = true; });
    b.addCase(updateAdminUserThunk.fulfilled, (s, a) => { s.users = a.payload; });
    b.addCase(fetchAdminReviews.fulfilled, (s, a) => { s.reviews = a.payload; s.loaded.reviews = true; });
    b.addCase(setAdminReviewApprovalThunk.fulfilled, (s, a) => { s.reviews = a.payload; });
    b.addCase(deleteAdminReviewThunk.fulfilled, (s, a) => { s.reviews = a.payload; });
    b.addCase(fetchAdminCustomOrders.fulfilled, (s, a) => { s.customOrders = a.payload; s.loaded.customOrders = true; });
    b.addCase(updateAdminCustomOrderThunk.fulfilled, (s, a) => { s.customOrders = a.payload; });
    b.addCase(fetchAdminWorkItemsThunk.fulfilled, (s, a) => { s.workItems[a.payload.customOrderId] = a.payload.items; });
    b.addCase(updateAdminWorkItemThunk.fulfilled, (s, a) => { s.workItems[a.payload.customOrderId] = a.payload.items; });
    b.addCase(fetchAdminContactMessages.fulfilled, (s, a) => { s.contactMessages = a.payload; s.loaded.contactMessages = true; });
    b.addCase(markAdminContactReadThunk.fulfilled, (s, a) => { s.contactMessages = a.payload; });
    b.addCase(fetchAdminSettings.fulfilled, (s, a) => { s.settings = a.payload as any; s.loaded.settings = true; });
    b.addCase(updateAdminSettingThunk.fulfilled, (s, a) => { s.settings = a.payload as any; });
  },
});
export const adminReducer = adminSlice.reducer;

// ════════════════════════════════════════════════════════════════
// UI  (client-only — dark mode, drawer, tabs, toasts, recently viewed)
// ════════════════════════════════════════════════════════════════
interface UiState {
  dark: boolean;
  drawer: boolean;
  dashTab: string;
  adminTab: string;
  notif: Notification | null;
  recentlyViewed: Product[];
}
const uiInitial: UiState = {
  dark: typeof window !== 'undefined' && localStorage.getItem('sc_dark') === '1',
  drawer: false, dashTab: 'overview', adminTab: 'overview', notif: null, recentlyViewed: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: uiInitial,
  reducers: {
    toggleDark(state) {
      state.dark = !state.dark;
      try { localStorage.setItem('sc_dark', state.dark ? '1' : '0'); } catch { /* noop */ }
    },
    setDrawer(state, action: PayloadAction<boolean>) { state.drawer = action.payload; },
    setDashTab(state, action: PayloadAction<string>) { state.dashTab = action.payload; },
    setAdminTab(state, action: PayloadAction<string>) { state.adminTab = action.payload; },
    setNotif(state, action: PayloadAction<Notification | null>) { state.notif = action.payload; },
    addRecentlyViewed(state, action: PayloadAction<Product>) {
      state.recentlyViewed = [action.payload, ...state.recentlyViewed.filter(p => p.id !== action.payload.id)].slice(0, 8);
    },
    clearRecentlyViewed(state) { state.recentlyViewed = []; },
  },
});
export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

// ════════════════════════════════════════════════════════════════
// Combined reducer map for the store
// ════════════════════════════════════════════════════════════════
export const reducers = {
  ui: uiReducer,
  cart: cartReducer,
  wish: wishReducer,
  compare: compareReducer,
  orders: ordersReducer,
  auth: authSlice.reducer,
  catalog: catalogSlice.reducer,
  admin: adminReducer,
};

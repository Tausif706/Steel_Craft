// ════════════════════════════════════════════════════════════════
// Every Supabase call in the app lives here, grouped by domain.
// Pages/slices import from this file instead of touching
// `supabase.from(...)` directly — keeps RLS-shaped queries in one
// place and makes the mapping layer easy to audit.
// ════════════════════════════════════════════════════════════════
import { supabase, AI_FUNCTION_NAME } from './supabase';
import {
  mapProduct, mapProductForAccount, mapCategory, mapOrder, mapAddress,
  mapRfq, mapReview, mapCustomOrder, mapWorkItem, mapAdminUser, mapContactMessage, mapNotification,
} from './mappers';
import type {
  Product, Category, Order, RFQEntry, Address, Review, Profile,
  CustomOrderEntry, WorkItem, AdminUserRow, ContactMessageRow, AppNotification, ChatMessage, AIDesignResult,
} from '../types';

function unwrap<T>(res: { data: T | null; error: any }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ════════════════════ AUTH ════════════════════
export async function signUp(email: string, password: string, firstName: string, phone: string) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { first_name: firstName, phone } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id, email: data.email ?? '', firstName: data.first_name ?? '', lastName: data.last_name ?? '',
    phone: data.phone ?? '', role: data.role, accountType: data.account_type,
  };
}

export async function updateMyProfile(patch: { firstName?: string; lastName?: string; phone?: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in');
  const { error } = await supabase.from('profiles').update({
    first_name: patch.firstName, last_name: patch.lastName, phone: patch.phone,
  }).eq('id', auth.user.id);
  if (error) throw new Error(error.message);
}

export async function changeMyPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// ════════════════════ CATALOG ════════════════════
export async function fetchCategories(): Promise<Category[]> {
  const [{ data: cats, error: e1 }, { data: prods, error: e2 }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('products').select('id, category_id').eq('active', true),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const counts: Record<string, number> = {};
  (prods ?? []).forEach((p: any) => { counts[p.category_id] = (counts[p.category_id] ?? 0) + 1; });
  const total = (prods ?? []).length;
  return [
    { id: 'all', n: 'All', ic: 'ti-layout-grid', c: total },
    ...(cats ?? []).map((c: any) => mapCategory(c, counts[c.id] ?? 0)),
  ];
}

export async function fetchProducts(accountType: 'retail' | 'wholesale' = 'retail'): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(image_url, sort_order)')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => mapProductForAccount(r, accountType));
}

export async function fetchProductById(id: number, accountType: 'retail' | 'wholesale' = 'retail'): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products').select('*, product_images(image_url, sort_order)').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapProductForAccount(data, accountType);
}

export async function fetchProductReviews(productId: number): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(first_name,last_name)')
    .eq('product_id', productId).eq('is_approved', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapReview);
}

export async function submitReview(productId: number, rating: number, title: string, review: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in to leave a review');
  const { error } = await supabase.from('reviews').upsert({
    product_id: productId, user_id: auth.user.id, rating, title, review,
  }, { onConflict: 'product_id,user_id' });
  if (error) throw new Error(error.message);
}

// ════════════════════ CART ════════════════════
export async function fetchCart(accountType: 'retail' | 'wholesale' = 'retail'): Promise<{ product: Product; qty: number }[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity, products(*, product_images(image_url, sort_order))')
    .eq('user_id', auth.user.id);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((r: any) => r.products)
    .map((r: any) => ({ product: mapProductForAccount(r.products, accountType), qty: r.quantity }));
}

export async function upsertCartItem(productId: number, quantity: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return; // guests: handled purely client-side
  const { error } = await supabase.from('cart_items').upsert({
    user_id: auth.user.id, product_id: productId, quantity,
  }, { onConflict: 'user_id,product_id' });
  if (error) throw new Error(error.message);
}

export async function removeCartItem(productId: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('cart_items').delete().eq('user_id', auth.user.id).eq('product_id', productId);
}

export async function clearCartDb() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('cart_items').delete().eq('user_id', auth.user.id);
}

// ════════════════════ WISHLIST ════════════════════
export async function fetchWishlist(accountType: 'retail' | 'wholesale' = 'retail'): Promise<Product[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('products(*, product_images(image_url, sort_order))')
    .eq('user_id', auth.user.id);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((r: any) => r.products).map((r: any) => mapProductForAccount(r.products, accountType));
}

export async function addWishlistItem(productId: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('wishlist_items').upsert({ user_id: auth.user.id, product_id: productId }, { onConflict: 'user_id,product_id' });
}

export async function removeWishlistItem(productId: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('wishlist_items').delete().eq('user_id', auth.user.id).eq('product_id', productId);
}

// ════════════════════ ADDRESSES ════════════════════
export async function fetchAddresses(): Promise<Address[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('addresses').select('*').eq('user_id', auth.user.id).order('is_default', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAddress);
}

export async function upsertAddress(addr: Partial<Address> & { id?: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sign in required');
  const row = {
    id: addr.id, user_id: auth.user.id, label: addr.label ?? 'Home', full_name: addr.fullName,
    phone: addr.phone, address_line1: addr.line1, address_line2: addr.line2 ?? '',
    city: addr.city, state: addr.state, postal_code: addr.postalCode, is_default: addr.isDefault ?? false,
  };
  const { error } = await supabase.from('addresses').upsert(row);
  if (error) throw new Error(error.message);
}

export async function deleteAddress(id: string) {
  await supabase.from('addresses').delete().eq('id', id);
}

// ════════════════════ ORDERS ════════════════════
export async function fetchMyOrders(): Promise<Order[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from('orders').select('*, order_items(*)').eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((o: any) => mapOrder(o, o.order_items ?? []));
}

export interface PlaceOrderInput {
  items: { productId: number; quantity: number }[];
  address: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; postalCode: string; addressId?: string | null };
  shippingMethod: 'standard' | 'express' | 'sameday';
  paymentMethod: string;
  couponCode?: string | null;
}

export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  const { data, error } = await supabase.rpc('create_order', {
    p_items: input.items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
    p_address: {
      full_name: input.address.fullName, phone: input.address.phone,
      address_line1: input.address.line1, address_line2: input.address.line2 ?? '',
      city: input.address.city, state: input.address.state, postal_code: input.address.postalCode,
      address_id: input.address.addressId ?? null,
    },
    p_shipping_method: input.shippingMethod,
    p_payment_method: input.paymentMethod,
    p_coupon_code: input.couponCode ?? null,
  });
  if (error) throw new Error(error.message);
  return mapOrder(data, []);
}

// ════════════════════ AI BUILDER ════════════════════
export async function callAiDesign(history: ChatMessage[], message: string): Promise<
  | { type: 'question'; message: string; history: ChatMessage[] }
  | ({ type: 'complete' } & AIDesignResult & { message: string; history: ChatMessage[] })
  | { type: 'error'; message: string }
> {
  const { data, error } = await supabase.functions.invoke(AI_FUNCTION_NAME, { body: { history, message } });
  if (error) return { type: 'error', message: error.message };
  return data;
}

export async function submitCustomOrder(designId: string): Promise<CustomOrderEntry> {
  const { data, error } = await supabase.rpc('submit_custom_order', { p_design_id: designId });
  if (error) throw new Error(error.message);
  return mapCustomOrder(data);
}

export async function fetchMyCustomOrders(): Promise<CustomOrderEntry[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('custom_orders').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCustomOrder);
}

export async function convertCustomOrderToOrder(customOrderId: string): Promise<Order> {
  const { data, error } = await supabase.rpc('convert_custom_order_to_order', { p_custom_order_id: customOrderId });
  if (error) throw new Error(error.message);
  return mapOrder(data, []);
}

export async function fetchMyAiDesignCount(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return 0;
  const { count } = await supabase.from('ai_designs').select('id', { count: 'exact', head: true }).eq('user_id', auth.user.id);
  return count ?? 0;
}

// ════════════════════ RFQ (WHOLESALE) ════════════════════
export interface RfqInput {
  companyName: string; contactName: string; phone: string; email: string;
  city: string; productInterest: string; quantity: number;
}
export async function submitRfq(input: RfqInput) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('rfqs').insert({
    user_id: auth.user?.id ?? null,
    company_name: input.companyName, contact_name: input.contactName, phone: input.phone,
    email: input.email, city: input.city, product_interest: input.productInterest, quantity: input.quantity,
  });
  if (error) throw new Error(error.message);
}

export async function fetchMyRfqs(): Promise<RFQEntry[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('rfqs').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRfq);
}

// ════════════════════ CONTACT ════════════════════
export async function submitContactMessage(input: { name: string; phone?: string; email: string; subject?: string; message: string }) {
  const { error } = await supabase.from('contact_messages').insert({
    name: input.name, phone: input.phone, email: input.email, subject: input.subject, message: input.message,
  });
  if (error) throw new Error(error.message);
}

// ════════════════════ NOTIFICATIONS ════════════════════
export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapNotification);
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
}

export async function markAllNotificationsRead() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', auth.user.id).eq('is_read', false);
}

// ════════════════════ ADMIN ════════════════════
export async function adminFetchAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((o: any) => mapOrder(o, o.order_items ?? []));
}

export async function adminUpdateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw new Error(error.message);
}

export async function adminFetchAllRfqs(): Promise<RFQEntry[]> {
  const { data, error } = await supabase.from('rfqs').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRfq);
}

export async function adminUpdateRfq(id: string, patch: { status?: string; quotationAmount?: number; adminNotes?: string }) {
  const { error } = await supabase.from('rfqs').update({
    status: patch.status, quotation_amount: patch.quotationAmount, admin_notes: patch.adminNotes,
  }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adminFetchAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*, product_images(image_url, sort_order)').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => mapProduct(r));
}

export interface ProductInput {
  name: string; categoryId: string; description: string; sku: string; price: number;
  originalPrice?: number; wholesalePrice?: number; stockQuantity: number; material: string;
  dimensions: string; weight: string; warranty: string; features: string[]; badge: string | null;
  accentColor: string; active: boolean;
}

export async function adminCreateProduct(input: ProductInput): Promise<number> {
  const { data, error } = await supabase.from('products').insert({
    name: input.name, category_id: input.categoryId, description: input.description, sku: input.sku || null,
    price: input.price, original_price: input.originalPrice ?? input.price, wholesale_price: input.wholesalePrice ?? null,
    stock_quantity: input.stockQuantity, material: input.material, dimensions: input.dimensions, weight: input.weight,
    warranty: input.warranty, features: input.features, badge: input.badge, accent_color: input.accentColor, active: input.active,
    slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36),
  }).select('id').single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function adminUpdateProduct(id: number, input: Partial<ProductInput>) {
  const patch: Record<string, any> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.description !== undefined) patch.description = input.description;
  if (input.sku !== undefined) patch.sku = input.sku;
  if (input.price !== undefined) patch.price = input.price;
  if (input.originalPrice !== undefined) patch.original_price = input.originalPrice;
  if (input.wholesalePrice !== undefined) patch.wholesale_price = input.wholesalePrice;
  if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity;
  if (input.material !== undefined) patch.material = input.material;
  if (input.dimensions !== undefined) patch.dimensions = input.dimensions;
  if (input.weight !== undefined) patch.weight = input.weight;
  if (input.warranty !== undefined) patch.warranty = input.warranty;
  if (input.features !== undefined) patch.features = input.features;
  if (input.badge !== undefined) patch.badge = input.badge;
  if (input.accentColor !== undefined) patch.accent_color = input.accentColor;
  if (input.active !== undefined) patch.active = input.active;
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adminUploadProductImage(productId: number, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${productId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  await supabase.from('products').update({ thumbnail_url: data.publicUrl }).eq('id', productId);
  await supabase.from('product_images').insert({ product_id: productId, image_url: data.publicUrl, sort_order: 0 });
  return data.publicUrl;
}

export async function adminFetchUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapAdminUser);
}

export async function adminUpdateUser(id: string, patch: { role?: 'customer' | 'admin'; accountType?: 'retail' | 'wholesale'; isActive?: boolean }) {
  const { error } = await supabase.from('profiles').update({
    role: patch.role, account_type: patch.accountType, is_active: patch.isActive,
  }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adminFetchAllReviews(): Promise<(Review & { isApproved: boolean; productName: string })[]> {
  const { data, error } = await supabase.from('reviews').select('*, profiles(first_name,last_name), products(name)').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({ ...mapReview(r), isApproved: r.is_approved, productName: r.products?.name ?? '' }));
}

export async function adminSetReviewApproval(id: string, approved: boolean) {
  await supabase.from('reviews').update({ is_approved: approved }).eq('id', id);
}

export async function adminDeleteReview(id: string) {
  await supabase.from('reviews').delete().eq('id', id);
}

export async function adminFetchCustomOrders(): Promise<CustomOrderEntry[]> {
  const { data, error } = await supabase.from('custom_orders').select('*, profiles(first_name,last_name,email)').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCustomOrder);
}

export async function adminUpdateCustomOrder(id: string, patch: { adminStatus?: string; adminNotes?: string; finalPrice?: number }) {
  const { error } = await supabase.from('custom_orders').update({
    admin_status: patch.adminStatus, admin_notes: patch.adminNotes, final_price: patch.finalPrice,
  }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchWorkItems(customOrderId: string): Promise<WorkItem[]> {
  const { data, error } = await supabase.from('work_items').select('*').eq('custom_order_id', customOrderId).order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapWorkItem);
}

export async function updateWorkItem(id: string, patch: { status?: string; notes?: string; dueDate?: string | null }) {
  await supabase.from('work_items').update({ status: patch.status, notes: patch.notes, due_date: patch.dueDate }).eq('id', id);
}

export async function adminFetchContactMessages(): Promise<ContactMessageRow[]> {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapContactMessage);
}

export async function adminMarkContactRead(id: string) {
  await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
}

export async function adminFetchSetting<T = any>(key: string): Promise<T | null> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
  return data?.value ?? null;
}

export async function adminUpdateSetting(key: string, value: any) {
  const { error } = await supabase.from('app_settings').upsert({ key, value });
  if (error) throw new Error(error.message);
}

export interface AdminStats {
  revenue: number;
  orderCount: number;
  rfqCount: number;
  productCount: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  pendingRfqs: number;
  pendingCustomOrders: number;
  pendingReviews: number;
  unreadContact: number;
  lowStockCount: number;
}

export async function adminFetchStats(): Promise<AdminStats> {
  const [orders, rfqs, products, customOrders, reviews, contacts, lowStock] = await Promise.all([
    supabase.from('orders').select('total, status'),
    supabase.from('rfqs').select('status'),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('custom_orders').select('admin_status'),
    supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 5),
  ]);
  const orderRows = orders.data ?? [];
  const rfqRows = rfqs.data ?? [];
  const customRows = customOrders.data ?? [];
  return {
    revenue: orderRows.reduce((s: number, o: any) => s + Number(o.total), 0),
    orderCount: orderRows.length,
    rfqCount: rfqRows.length,
    productCount: products.count ?? 0,
    pendingOrders: orderRows.filter((o: any) => o.status === 'Processing').length,
    inTransitOrders: orderRows.filter((o: any) => o.status === 'In Transit').length,
    deliveredOrders: orderRows.filter((o: any) => o.status === 'Delivered').length,
    pendingRfqs: rfqRows.filter((r: any) => r.status === 'Pending').length,
    pendingCustomOrders: customRows.filter((c: any) => c.admin_status === 'pending_review').length,
    pendingReviews: reviews.count ?? 0,
    unreadContact: contacts.count ?? 0,
    lowStockCount: lowStock.count ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// SPRINT A+B  — Payments, Revisions, Materials
// ═══════════════════════════════════════════════════════════════

// ── Mock payment (no real gateway — simulates a success) ──────
// The frontend calls this, it writes a payments record with
// status='mock_success', then updates the parent order/custom_order.
// When Razorpay goes live in Sprint B-live, replace only this
// function — everything downstream stays the same.
export async function mockPayOrder(orderId: string, amount: number, paymentMethod: string, gstAmount = 0) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: payData, error: payErr } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      order_id: orderId,
      amount,
      payment_method: paymentMethod,
      status: 'mock_success',
      gst_amount: gstAmount,
      notes: 'Simulated payment — Razorpay integration pending (Sprint B)',
    })
    .select('id')
    .single();

  if (payErr) throw new Error(payErr.message);

  // Mark the order as paid (payment_status column)
  await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);

  return payData.id as string;
}

export async function mockPayCustomOrder(customOrderId: string, amount: number, paymentMethod: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const gst = Math.round(amount * 0.18);

  const { data: payData, error: payErr } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      custom_order_id: customOrderId,
      amount,
      payment_method: paymentMethod,
      status: 'mock_success',
      gst_amount: gst,
      notes: 'Simulated payment — Razorpay integration pending (Sprint B)',
    })
    .select('id')
    .single();

  if (payErr) throw new Error(payErr.message);

  // Move custom order to payment_pending → in_production + link payment
  await supabase
    .from('custom_orders')
    .update({
      admin_status: 'in_production',
      payment_id: payData.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', customOrderId);

  return payData.id as string;
}

export async function fetchMyPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    orderId: r.order_id,
    customOrderId: r.custom_order_id,
    amount: Number(r.amount),
    currency: r.currency,
    paymentMethod: r.payment_method,
    status: r.status,
    gstAmount: r.gst_amount != null ? Number(r.gst_amount) : null,
    discountAmount: r.discount_amount != null ? Number(r.discount_amount) : null,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function fetchCustomOrderRevisions(customOrderId: string) {
  const { data, error } = await supabase
    .from('custom_order_revisions')
    .select('*')
    .eq('custom_order_id', customOrderId)
    .order('revision_number', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    customOrderId: r.custom_order_id,
    revisionNumber: r.revision_number,
    revisionType: r.revision_type,
    previousPrice: r.previous_price != null ? Number(r.previous_price) : null,
    newPrice: r.new_price != null ? Number(r.new_price) : null,
    previousStatus: r.previous_status,
    newStatus: r.new_status,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function adminFetchMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    unit: r.unit,
    gaugeMm: r.gauge_mm,
    currentStock: Number(r.current_stock),
    minStockLevel: Number(r.min_stock_level),
    unitCost: Number(r.unit_cost),
    supplier: r.supplier,
    isActive: r.is_active,
  }));
}

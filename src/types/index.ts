// ─── PRODUCT (frontend display shape — short keys kept for UI compat) ──
export interface Product {
  id: number;
  n: string;            // name
  cat: string;           // category id
  bg: string;            // accent/fallback color
  img?: string | null;   // thumbnail photo (Supabase Storage URL)
  images?: string[];     // gallery photos
  p: number;             // price (or wholesale price if account is wholesale)
  o: number;             // original/MRP price
  r: number;             // rating
  rv: number;            // review count
  b: string | null;      // badge
  d: string;             // description
  mat: string;           // material
  dim: string;           // dimensions
  wt: string;            // weight
  wa: string;            // warranty
  f: string[];           // features
  stock?: number;        // stock_quantity (admin / out-of-stock UI)
  sku?: string;
}

// ─── CATEGORY ──────────────────────────────────────────────
export interface Category {
  id: string;
  n: string;
  ic: string;
  c?: number;
}

// ─── CART ──────────────────────────────────────────────────
export interface CartItem extends Product {
  qty: number;
}

// ─── ORDER (display shape for Dashboard / Admin lists) ─────
export interface Order {
  id: string;            // order_number, e.g. SC-00001
  dbId: string;           // uuid, used for RPC calls
  date: string;
  createdAt?: string;     // raw ISO timestamp — used for grouping in dashboard charts; `date` above is display-formatted
  items: number;
  total: number;
  status: OrderStatus;
  products: string[];
  orderType?: 'standard' | 'custom' | 'wholesale';
  paymentMethod?: string;
  paymentStatus?: string;
}
export type OrderStatus = 'Processing' | 'Packed' | 'In Transit' | 'Delivered' | 'Cancelled';

// ─── RFQ ───────────────────────────────────────────────────
export interface RFQEntry {
  id: string;
  co: string;           // company
  nm: string;            // contact name
  ph: string;            // phone
  em?: string;
  pr: string;            // product interest
  qty: number;
  ci: string;            // city
  status: 'Pending' | 'Quoted' | 'Converted' | 'Rejected';
  date: string;
  quotationAmount?: number | null;
  adminNotes?: string | null;
}

// ─── CHECKOUT ──────────────────────────────────────────────
export interface CheckoutState {
  step: number;
  cnm: string; cph: string; cem: string;
  ca1: string; ca2: string;
  city: string; state: string; pin: string;
  shipping: 'standard' | 'express' | 'sameday';
  payment: 'cod' | 'upi' | 'card' | 'netbanking' | 'emi';
  coupon: string;
  saveAddress: boolean;
  addressId?: string | null;
}

// ─── AUTH / PROFILE ──────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin';
  accountType: 'retail' | 'wholesale';
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

// ─── REVIEWS ─────────────────────────────────────────────────
export interface Review {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number;
  title?: string | null;
  review: string;
  createdAt: string;
}

// ─── AI BUILDER ──────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface FurnitureSpec {
  type: string;
  label: string;
  widthIn: number;
  heightIn: number;
  depthIn: number;
  doors: number;
  shelves: number;
  drawers: number;
  bodyColor: string;
  doorColor: string;
  mirror: boolean;
  lockType: 'none' | 'key' | 'digital';
  wheels: boolean;
  gaugeMM: number;
  notes?: string;
}

export interface PriceBreakdown {
  totalSqft: number;
  weightKg: number;
  materialCost: number;
  hardwareCost: number;
  finishCost: number;
  laborCost: number;
  subtotal: number;
  estimateMin: number;
  estimateMax: number;
}

export interface AIDesignResult {
  id: string | null;
  savedToAccount: boolean;
  spec: FurnitureSpec;
  pricing: PriceBreakdown;
  images: { front: string; side: string; top: string; inside: string };
}

export interface CustomOrderEntry {
  id: string;
  spec: FurnitureSpec | null;
  images: string[];
  estimatedPrice: number | null;
  finalPrice: number | null;
  adminStatus: string;
  adminNotes: string | null;
  createdAt: string;
  orderId: string | null;
  paymentId: string | null;
  revisionCount: number;
  quotedAt: string | null;
  approvedAt: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  customerName?: string;
}

export interface WorkItem {
  id: string;
  customOrderId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  assignedTo: string | null;
  notes: string | null;
  dueDate: string | null;
  sortOrder: number;
}

// ─── ADMIN ─────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'admin';
  accountType: 'retail' | 'wholesale';
  isActive: boolean;
  createdAt: string;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ─── API RESPONSE ───────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ─── NOTIFICATION (toast) ───────────────────────────────────
export interface Notification {
  msg: string;
  type: 'ok' | 'info' | 'error';
}

// ─── IN-APP NOTIFICATION (bell / DB-backed) ──────────────────
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// ── SPRINT A+B TYPES ────────────────────────────────────────────

// Full custom order status lifecycle (matches DB constraint in 0006 migration)
export type CustomOrderStatus =
  | 'pending_review' | 'quoted' | 'awaiting_customer_response'
  | 'approved' | 'payment_pending' | 'in_production'
  | 'quality_check' | 'ready_to_dispatch' | 'dispatched'
  | 'delivered' | 'rejected' | 'cancelled';

export interface CustomOrderRevision {
  id: string;
  customOrderId: string;
  revisionNumber: number;
  revisionType: 'spec_change' | 'price_revision' | 'admin_note' | 'customer_feedback' | 'status_change';
  previousPrice: number | null;
  newPrice: number | null;
  previousStatus: string | null;
  newStatus: string | null;
  notes: string | null;
  createdAt: string;
}

// Payment record (Razorpay fields are stubs until Sprint B-live)
export type PaymentMethod = 'mock' | 'upi' | 'card' | 'netbanking' | 'emi' | 'cod' | 'razorpay';
export type PaymentStatus = 'pending' | 'mock_success' | 'success' | 'failed' | 'refunded' | 'partially_refunded';

export interface Payment {
  id: string;
  userId: string;
  orderId: string | null;
  customOrderId: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  gstAmount: number | null;
  discountAmount: number | null;
  notes: string | null;
  createdAt: string;
}

// Raw material master
export interface Material {
  id: string;
  code: string;
  name: string;
  category: 'sheet' | 'pipe' | 'hardware' | 'paint' | 'packing' | 'other';
  unit: 'kg' | 'pcs' | 'ltr' | 'mtr' | 'sqft' | 'box';
  gaugeMm: number | null;
  currentStock: number;
  minStockLevel: number;
  unitCost: number;
  supplier: string | null;
  isActive: boolean;
}

// Maps Supabase rows (clean, descriptive column names) onto the
// frontend's existing short-key types — so page components written
// against the old mock data keep working almost unchanged.
import type {
  Product, Category, Order, RFQEntry, Address, Review,
  CustomOrderEntry, WorkItem, AdminUserRow, ContactMessageRow, AppNotification,
} from '../types';

export function mapProduct(row: any): Product {
  return {
    id: row.id,
    n: row.name,
    cat: row.category_id,
    bg: row.accent_color ?? '#1B3A5E',
    img: row.thumbnail_url ?? null,
    images: (row.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.image_url),
    p: Number(row.price),
    o: Number(row.original_price ?? row.price),
    r: Number(row.rating ?? 0),
    rv: Number(row.review_count ?? 0),
    b: row.badge ?? null,
    d: row.description ?? '',
    mat: row.material ?? '',
    dim: row.dimensions ?? '',
    wt: row.weight ?? '',
    wa: row.warranty ?? '',
    f: row.features ?? [],
    stock: row.stock_quantity,
    sku: row.sku,
  };
}

export function mapProductForAccount(row: any, accountType: 'retail' | 'wholesale'): Product {
  const p = mapProduct(row);
  if (accountType === 'wholesale' && row.wholesale_price) {
    return { ...p, p: Number(row.wholesale_price) };
  }
  return p;
}

export function mapCategory(row: any, count: number): Category {
  return { id: row.id, n: row.name, ic: row.icon, c: count };
}

export function mapOrder(orderRow: any, itemRows: any[]): Order {
  return {
    id: orderRow.order_number,
    dbId: orderRow.id,
    date: new Date(orderRow.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
    createdAt: orderRow.created_at ?? null,
    items: itemRows.length,
    total: Number(orderRow.total),
    status: orderRow.status,
    products: itemRows.map(i => i.product_name),
    orderType: orderRow.order_type,
    paymentMethod: orderRow.payment_method,
    paymentStatus: orderRow.payment_status,
  };
}

export function mapAddress(row: any): Address {
  return {
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    line1: row.address_line1,
    line2: row.address_line2 ?? '',
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    isDefault: row.is_default,
  };
}

export function mapRfq(row: any): RFQEntry {
  return {
    id: row.id,
    co: row.company_name,
    nm: row.contact_name ?? '',
    ph: row.phone,
    em: row.email,
    pr: row.product_interest ?? '',
    qty: row.quantity,
    ci: row.city ?? '',
    status: row.status,
    date: new Date(row.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    quotationAmount: row.quotation_amount,
    adminNotes: row.admin_notes,
  };
}

export function mapReview(row: any): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.profiles ? `${row.profiles.first_name ?? ''} ${row.profiles.last_name ?? ''}`.trim() || 'Customer' : 'Customer',
    rating: row.rating,
    title: row.title,
    review: row.review,
    createdAt: row.created_at,
  };
}

export function mapCustomOrder(row: any): CustomOrderEntry {
  return {
    id: row.id,
    spec: row.generated_spec ?? null,
    images: row.preview_images ?? [],
    estimatedPrice: row.estimated_price != null ? Number(row.estimated_price) : null,
    finalPrice: row.final_price != null ? Number(row.final_price) : null,
    adminStatus: row.admin_status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    orderId: row.order_id,
    paymentId: row.payment_id ?? null,
    revisionCount: row.revision_count ?? 0,
    quotedAt: row.quoted_at ?? null,
    approvedAt: row.approved_at ?? null,
    dispatchedAt: row.dispatched_at ?? null,
    deliveredAt: row.delivered_at ?? null,
    customerName: row.profiles ? `${row.profiles.first_name ?? ''} ${row.profiles.last_name ?? ''}`.trim() : undefined,
  };
}

export function mapWorkItem(row: any): WorkItem {
  return {
    id: row.id,
    customOrderId: row.custom_order_id,
    title: row.title,
    status: row.status,
    assignedTo: row.assigned_to,
    notes: row.notes,
    dueDate: row.due_date,
    sortOrder: row.sort_order,
  };
}

export function mapAdminUser(row: any): AdminUserRow {
  return {
    id: row.id,
    email: row.email ?? '',
    name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || row.email || 'Customer',
    phone: row.phone ?? '',
    role: row.role,
    accountType: row.account_type,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapContactMessage(row: any): ContactMessageRow {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: row.type,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LayoutDashboard, Package, User, Heart, Wand2, Headphones, Phone, Mail, MessageSquare, Globe,
  MapPin, Building2, Plus, Star, Trash2, CheckCircle2, CreditCard, Clock,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import {
  uiActions, updateProfileThunk, fetchMyAccountData, upsertAddressThunk, deleteAddressThunk, convertCustomOrderThunk, mockPayCustomOrderThunk,
} from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { accountProfileSchema, type AccountProfileData, addressSchema, type AddressData } from '../schemas';
import { fmt, orderStatusClass } from '../lib/utils';
import ProductCard from '../components/ui/ProductCard';
import { Field, Btn, EmptyState } from '../components/ui/shared';
import { SkeletonDashboardTab } from '../components/ui/Skeleton';

const TABS = [
  { id: 'overview',  icon: LayoutDashboard, label: 'Overview' },
  { id: 'orders',    icon: Package,         label: 'Orders' },
  { id: 'ai',        icon: Wand2,           label: 'Custom Orders' },
  { id: 'rfqs',      icon: Building2,       label: 'RFQs' },
  { id: 'addresses', icon: MapPin,          label: 'Addresses' },
  { id: 'wishlist',  icon: Heart,           label: 'Wishlist' },
  { id: 'profile',   icon: User,            label: 'Profile' },
  { id: 'payments',  icon: CreditCard,       label: 'Payments' },
  { id: 'support',   icon: Headphones,      label: 'Support' },
];

const STATES = ['Telangana', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Delhi', 'West Bengal', 'UP', 'Punjab', 'Kerala', 'Andhra Pradesh'];

const CUSTOM_STATUS_LABEL: Record<string, string> = {
  pending_review: 'Pending Review', quoted: 'Quoted', awaiting_customer_response: 'Awaiting Your Response',
  approved: 'Approved', payment_pending: 'Payment Pending', in_production: 'In Production',
  quality_check: 'Quality Check', ready_to_dispatch: 'Ready to Dispatch',
  dispatched: 'Dispatched', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled',
};
const CUSTOM_STATUS_CLASS: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800', quoted: 'bg-purple-100 text-purple-800',
  awaiting_customer_response: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800', payment_pending: 'bg-pink-100 text-pink-800',
  rejected: 'bg-red-100 text-red-800', cancelled: 'bg-red-100 text-red-800',
  in_production: 'bg-blue-100 text-blue-800', quality_check: 'bg-blue-100 text-blue-800',
  ready_to_dispatch: 'bg-indigo-100 text-indigo-800', dispatched: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function Dashboard() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const notify    = useNotification();
  const tab       = useAppSelector(s => s.ui.dashTab);
  const profile   = useAppSelector(s => s.auth.profile);
  const email     = useAppSelector(s => s.auth.email);
  const cart      = useAppSelector(s => s.cart.items);
  const wish      = useAppSelector(s => s.wish.items);
  const orders    = useAppSelector(s => s.orders.list);
  const addresses = useAppSelector(s => s.orders.addresses);
  const myRfqs    = useAppSelector(s => s.orders.myRfqs);
  const myCustomOrders = useAppSelector(s => s.orders.myCustomOrders);
  const myPayments = useAppSelector(s => s.orders.myPayments);
  const aiDesignCount  = useAppSelector(s => s.orders.aiDesignCount);
  const accountStatus  = useAppSelector(s => s.orders.status);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => { dispatch(fetchMyAccountData()); }, [dispatch]);

  const { register, handleSubmit, formState: { errors } } = useForm<AccountProfileData>({
    resolver: zodResolver(accountProfileSchema),
    values: { firstName: profile?.firstName ?? '', lastName: profile?.lastName ?? '', phone: profile?.phone ?? '' },
  });
  const { register: registerAddr, handleSubmit: handleSubmitAddr, formState: { errors: addrErrors }, reset: resetAddr } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { cnm: '', cph: '', cem: '', ca1: '', ca2: '', city: '', state: '', pin: '' },
  });

  const saveProfile = async (data: AccountProfileData) => {
    try {
      await dispatch(updateProfileThunk(data)).unwrap();
      notify('Profile saved! ✓');
    } catch (err: any) { notify(err.message ?? 'Could not save profile', 'error'); }
  };

  const saveAddress = async (data: AddressData) => {
    setSavingAddress(true);
    try {
      await dispatch(upsertAddressThunk({
        fullName: data.cnm, phone: data.cph, line1: data.ca1, line2: data.ca2,
        city: data.city, state: data.state, postalCode: data.pin, isDefault: addresses.length === 0,
      })).unwrap();
      notify('Address saved! ✓');
      resetAddr(); setShowAddressForm(false);
    } catch (err: any) { notify(err.message ?? 'Could not save address', 'error'); }
    finally { setSavingAddress(false); }
  };

  const handleConvertCustomOrder = async (id: string) => {
    try {
      await dispatch(convertCustomOrderThunk(id)).unwrap();
      notify('Order created — check My Orders! 🎉');
      dispatch(uiActions.setDashTab('orders'));
    } catch (err: any) { notify(err.message ?? 'Could not create order', 'error'); }
  };

  const cc = cart.reduce((a, i) => a + i.qty, 0);
  const userName = profile?.firstName || 'Account';

  // ── Tab content ──
  let content: React.ReactNode = null;

  if (tab === 'overview') content = (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {[[orders.length, 'Orders', '📦', '#DBEAFE'], [wish.length, 'Wishlist', '❤️', '#FEE2E2'], [cc, 'Cart Items', '🛒', '#DCFCE7'], [aiDesignCount, 'Custom Designs', '🪄', '#EDE9FE']].map(([n, l, em, bg]) => (
          <div key={l as string} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 text-center hover:shadow-s2 transition-shadow">
            <div className="w-9 h-9 rounded-[11px] flex items-center justify-center mx-auto mb-2 text-xl" style={{ background: bg as string }}>{em}</div>
            <div className="text-[21px] font-black text-[var(--tx)]">{n as number}</div>
            <div className="text-[10.5px] text-[var(--tx3)] mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {orders.length > 0 ? (
        <>
          <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Recent Orders</div>
          {orders.slice(0, 3).map(o => (
            <div key={o.dbId} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2 hover:shadow-s2 transition-shadow">
              <div className="flex justify-between items-center mb-1.5">
                <div><div className="text-[13.5px] font-bold text-[var(--tx)]">#{o.id}</div><div className="text-[11px] text-[var(--tx3)]">{o.date}</div></div>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[10px] ${orderStatusClass[o.status]}`}>{o.status}</span>
              </div>
              <div className="text-[12px] text-[var(--tx2)] mb-2">{o.products.slice(0, 2).join(', ')}{o.products.length > 2 && ` +${o.products.length - 2} more`}</div>
              <div className="flex justify-between items-center">
                <span className="text-[15px] font-extrabold text-[var(--tx)]">{fmt(o.total)}</span>
                <Btn variant="secondary" onClick={() => dispatch(uiActions.setDashTab('orders'))} className="py-1.5 px-3 text-xs">View</Btn>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="text-center py-7 text-[var(--tx3)] text-[14px]">
          No orders yet —{' '}
          <span className="text-[var(--ac)] cursor-pointer font-semibold" onClick={() => navigate('/store')}>start shopping</span>
        </div>
      )}
    </div>
  );

  if (tab === 'orders') content = accountStatus === 'loading' ? (
    <SkeletonDashboardTab shape="orders" />
  ) : orders.length === 0 ? (
    <EmptyState icon={Package} title="No Orders Yet" action={{ label: '🛍 Start Shopping', to: '/store' }} />
  ) : (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">All Orders ({orders.length})</div>
      {orders.map(o => (
        <div key={o.dbId} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2 hover:shadow-s2 transition-shadow">
          <div className="flex justify-between items-center mb-1.5">
            <div><div className="text-[13.5px] font-bold text-[var(--tx)]">#{o.id}</div><div className="text-[11px] text-[var(--tx3)]">{o.date}</div></div>
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[10px] ${orderStatusClass[o.status]}`}>{o.status}</span>
          </div>
          <div className="text-[12px] text-[var(--tx2)] mb-2">{o.products.join(', ')}</div>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-[15px] font-extrabold text-[var(--tx)]">{fmt(o.total)}</span>
            <span className="text-[11px] text-[var(--tx3)]">{o.paymentMethod?.toUpperCase()} · {o.paymentStatus}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (tab === 'ai') content = myCustomOrders.length === 0 ? (
    <EmptyState icon={Wand2} title="No custom designs yet" subtitle="Create custom furniture with AI Builder and send it to us for a quote."
      action={{ label: '✨ Open AI Builder', to: '/ai' }} />
  ) : (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">My Custom Orders ({myCustomOrders.length})</div>
      <div className="space-y-3">
        {myCustomOrders.map(co => (
          <div key={co.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-3.5">
            <div className="flex gap-3">
              {co.images[0] && (
                <img src={co.images[0]} alt="" className="w-20 h-20 rounded-[10px] object-cover border border-[var(--br)] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[13.5px] font-bold text-[var(--tx)]">{co.spec?.label ?? 'Custom Furniture'}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[10px] whitespace-nowrap ${CUSTOM_STATUS_CLASS[co.adminStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                    {CUSTOM_STATUS_LABEL[co.adminStatus] ?? co.adminStatus}
                  </span>
                </div>
                <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">
                  {co.spec ? `${co.spec.widthIn}"×${co.spec.heightIn}"×${co.spec.depthIn}" · ${co.spec.doors} door(s)` : ''}
                </div>
                <div className="text-[14px] font-extrabold text-[var(--tx)] mt-1">
                  {fmt(co.finalPrice ?? co.estimatedPrice ?? 0)} {!co.finalPrice && <span className="text-[10.5px] font-normal text-[var(--tx3)]">(estimate)</span>}
                </div>
                {co.adminNotes && <div className="text-[11.5px] text-[var(--tx2)] mt-1 italic">"{co.adminNotes}"</div>}
                {(co.adminStatus === 'approved' || co.adminStatus === 'payment_pending') && !co.orderId && !co.paymentId && (
                  <Btn className="mt-2 py-1.5 px-3 text-xs bg-green-600 hover:bg-green-700"
                       onClick={async () => {
                         try {
                           await dispatch(mockPayCustomOrderThunk({
                             customOrderId: co.id,
                             amount: co.finalPrice ?? co.estimatedPrice ?? 0,
                             paymentMethod: 'mock',
                           })).unwrap();
                           notify('Payment successful! Order moved to production 🎉');
                         } catch (err: any) { notify(err.message ?? 'Payment failed', 'error'); }
                       }}>
                    <CreditCard size={13} />Confirm &amp; Pay (Mock)
                  </Btn>
                )}
                {co.adminStatus === 'approved' && !co.orderId && (
                  <Btn className="mt-2 py-1.5 px-3 text-xs" onClick={() => handleConvertCustomOrder(co.id)}>
                    <CheckCircle2 size={13} />Convert to Order
                  </Btn>
                )}
                {co.orderId && <div className="text-[11px] text-[var(--gr)] font-semibold mt-1.5">✓ Converted to order</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'rfqs') content = myRfqs.length === 0 ? (
    <EmptyState icon={Building2} title="No RFQs yet" subtitle="Request bulk pricing on the Wholesale page."
      action={{ label: '🏭 Get a Bulk Quote', to: '/wholesale' }} />
  ) : (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">My RFQs ({myRfqs.length})</div>
      {myRfqs.map(r => (
        <div key={r.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13.5px] font-bold text-[var(--tx)]">{r.pr || 'General Inquiry'}</span>
            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[10px] ${orderStatusClass[r.status]}`}>{r.status}</span>
          </div>
          <div className="text-[12px] text-[var(--tx2)]">Qty: {r.qty} · {r.date}</div>
          {r.quotationAmount != null && <div className="text-[14px] font-extrabold text-[var(--tx)] mt-1">{fmt(r.quotationAmount)}</div>}
        </div>
      ))}
    </div>
  );

  if (tab === 'addresses') content = (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[14px] font-bold text-[var(--tx)]">My Addresses ({addresses.length})</div>
        <Btn variant="secondary" className="py-1.5 px-3 text-xs" onClick={() => setShowAddressForm(v => !v)}>
          <Plus size={13} />Add New
        </Btn>
      </div>

      {showAddressForm && (
        <form onSubmit={handleSubmitAddr(saveAddress)} className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 mb-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *" error={addrErrors.cnm?.message} {...registerAddr('cnm')} />
            <Field label="Phone *" error={addrErrors.cph?.message} {...registerAddr('cph')} />
            <div className="col-span-2"><Field label="Address Line 1 *" error={addrErrors.ca1?.message} {...registerAddr('ca1')} /></div>
            <div className="col-span-2"><Field label="Address Line 2" {...registerAddr('ca2')} /></div>
            <Field label="City *" error={addrErrors.city?.message} {...registerAddr('city')} />
            <Field label="PIN Code *" error={addrErrors.pin?.message} {...registerAddr('pin')} />
            <div className="col-span-2">
              <select className="w-full px-3 py-2.5 border border-[var(--br)] rounded-[9px] text-[13.5px] bg-[var(--sf)] text-[var(--tx)] outline-none" {...registerAddr('state')}>
                <option value="">-- Select State --</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <Btn type="submit" fullWidth className="mt-3" disabled={savingAddress}>{savingAddress ? 'Saving…' : 'Save Address'}</Btn>
        </form>
      )}

      {addresses.length === 0 && !showAddressForm ? (
        <EmptyState icon={MapPin} title="No saved addresses" subtitle="Add one to speed up checkout." />
      ) : (
        addresses.map(a => (
          <div key={a.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-2 flex items-start justify-between gap-2">
            <div>
              <div className="text-[13px] font-bold text-[var(--tx)]">{a.label} · {a.fullName} {a.isDefault && <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded ml-1">Default</span>}</div>
              <div className="text-[12px] text-[var(--tx2)] mt-0.5">{a.line1}, {a.line2 ? a.line2 + ', ' : ''}{a.city}, {a.state} {a.postalCode}</div>
              <div className="text-[12px] text-[var(--tx3)]">{a.phone}</div>
            </div>
            <button onClick={() => { dispatch(deleteAddressThunk(a.id)); notify('Address removed', 'info'); }}
              className="p-1.5 rounded-[7px] text-[var(--tx3)] hover:bg-red-100 hover:text-red-500 transition-all flex-shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}
    </div>
  );

  if (tab === 'profile') content = (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-4">Edit Profile</div>
      <form onSubmit={handleSubmit(saveProfile)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.firstName?.message} {...register('firstName')} />
          <Field label="Last Name" {...register('lastName')} />
          <Field label="Mobile" type="tel" placeholder="10-digit" error={errors.phone?.message} {...register('phone')} />
          <Field label="Email" type="email" value={email ?? ''} disabled />
        </div>
        <Btn type="submit" fullWidth className="mt-5 py-3">Save Profile ✓</Btn>
      </form>
    </div>
  );

  if (tab === 'wishlist') content = wish.length === 0 ? (
    <EmptyState icon={Heart} title="Wishlist Empty" subtitle="Tap ❤️ on products to save them." action={{ label: '🛍 Browse', to: '/store' }} />
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
      {wish.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );

  if (tab === 'payments') content = myPayments.length === 0 ? (
    <div className="text-center py-10">
      <CreditCard size={32} className="mx-auto mb-3 text-[var(--tx3)] opacity-40" />
      <div className="text-[14px] font-semibold text-[var(--tx3)]">No payment records yet</div>
      <div className="text-[12px] text-[var(--tx3)] mt-1">Payments appear here after checkout or custom order payment.</div>
    </div>
  ) : (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Payment History ({myPayments.length})</div>
      <div className="space-y-2">
        {myPayments.map(p => (
          <div key={p.id} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-[12.5px] font-bold text-[var(--tx)] mb-0.5">
                  {p.orderId ? `Order Payment` : `Custom Order Payment`}
                </div>
                <div className="text-[11px] text-[var(--tx3)]">
                  {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{p.paymentMethod.replace('_',' ').toUpperCase()}
                </div>
                {p.status === 'mock_success' && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Clock size={9} />Simulated — Razorpay live in Sprint B
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-[17px] font-black text-[var(--tx)]">₹{p.amount.toLocaleString('en-IN')}</div>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-[8px] inline-block mt-0.5 ${
                  p.status === 'success' || p.status === 'mock_success' ? 'bg-green-100 text-green-800'
                  : p.status === 'failed' ? 'bg-red-100 text-red-700'
                  : p.status === 'refunded' ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {p.status === 'mock_success' ? 'Paid (Mock)' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </div>
            </div>
            {p.gstAmount != null && (
              <div className="text-[11px] text-[var(--tx3)] mt-1.5 border-t border-[var(--br)] pt-1.5">
                Incl. GST: ₹{p.gstAmount.toLocaleString('en-IN')} · Net: ₹{(p.amount - p.gstAmount).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (tab === 'support') content = (
    <div>
      <div className="text-[14px] font-bold text-[var(--tx)] mb-3">Help & Support</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        {([
          [Phone, 'Call', '1800-123-4567', '#DBEAFE', '#1E40AF'],
          [MessageSquare, 'WhatsApp', 'Quick chat', '#DCFCE7', '#166534'],
          [Mail, 'Email', '24hr reply', '#EDE9FE', '#5B21B6'],
          [Globe, 'Live Chat', '10AM–6PM', '#FEF3C7', '#92610A'],
        ] as [React.ElementType, string, string, string, string][]).map(([Icon, t, v, bg, c]) => (
          <div key={t} className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 text-center cursor-pointer hover:shadow-s2 transition-shadow"
               onClick={() => notify(`Opening ${t}...`)}>
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
              <Icon size={18} style={{ color: c }} />
            </div>
            <div className="text-[13px] font-bold text-[var(--tx)]">{t}</div>
            <div className="text-[11.5px] text-[var(--tx2)] mt-0.5">{v}</div>
          </div>
        ))}
      </div>
      {[['How long does delivery take?', 'Standard 5–7 days · Express 2–3 days · Same Day in select cities.'], ['What is your return policy?', '30-day hassle-free returns for all products in original condition.'], ['Do you offer bulk discounts?', 'Yes! 5–20% off on 10–100+ units. Visit our Wholesale page.'], ['Is assembly included?', 'Professional assembly available at ₹299–₹599 depending on product.']].map(([q, a]) => (
        <div key={q} className="border border-[var(--br)] rounded-[12px] p-3.5 mb-2 bg-[var(--sf)]">
          <div className="text-[13.5px] font-bold text-[var(--tx)] mb-1.5">❓ {q}</div>
          <div className="text-[12.5px] text-[var(--tx2)] leading-relaxed pl-5">{a}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      {/* Profile header */}
      <div className="bg-[var(--dk)] rounded-2xl p-5 mb-5 flex items-center gap-3.5 cursor-pointer"
           onClick={() => dispatch(uiActions.setDashTab('profile'))}>
        <div className="w-14 h-14 rounded-full bg-white/16 border-2 border-white/28 flex items-center justify-center text-[22px] font-extrabold text-white flex-shrink-0">
          {userName[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-[17px] font-extrabold text-white">{userName}</div>
          <div className="text-[12px] text-white/55 mt-0.5">
            {profile?.accountType === 'wholesale' ? 'Wholesale Account' : 'SteelCraft Member'}
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {orders.length > 0 && <span className="bg-white/12 border border-white/18 text-white/80 text-[11px] font-semibold px-2 py-0.5 rounded-[10px]">{orders.length} orders</span>}
            <span className="bg-white/12 border border-white/18 text-white/80 text-[11px] font-semibold px-2 py-0.5 rounded-[10px]">✏️ Edit Profile</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto no-scrollbar border-b-2 border-[var(--br)] mb-5">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id}
            onClick={() => dispatch(uiActions.setDashTab(id))}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap
                        border-b-2 -mb-[2px] transition-all
                        ${tab === id
                          ? 'text-[var(--dk)] border-[var(--dk)] font-bold dark:text-[var(--ac2)] dark:border-[var(--ac)]'
                          : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}

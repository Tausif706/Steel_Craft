import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Truck, CreditCard, CheckCircle, Package, Home, Check } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { ordersActions, cartActions, placeOrderThunk, fetchMyAccountData, mockPayOrderThunk } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { addressSchema, type AddressData } from '../schemas';
import { catIC, fmt } from '../lib/utils';
import { Field, SelectField, Btn } from '../components/ui/shared';

const STATES = ['Telangana','Maharashtra','Karnataka','Tamil Nadu','Gujarat','Rajasthan','Delhi','West Bengal','UP','Punjab','Kerala','Andhra Pradesh'];
const SHIP_OPTS = [
  { id:'standard', icon: Package, name:'Standard Delivery', time:'5–7 business days', cost:(sub:number)=>sub>=10000?'FREE':'₹599' },
  { id:'express',  icon: Truck,   name:'Express Delivery',  time:'2–3 business days', cost:()=>'₹299' },
  { id:'sameday',  icon: Truck,   name:'Same Day',          time:'Today by 9 PM',     cost:()=>'₹599' },
];
const PAY_OPTS = [
  { id:'cod',        em:'💵', name:'Cash on Delivery', sub:'Pay when order arrives' },
  { id:'upi',        em:'📱', name:'UPI Payment',      sub:'GPay, PhonePe, Paytm' },
  { id:'card',       em:'💳', name:'Credit / Debit Card', sub:'Visa, Mastercard, RuPay' },
  { id:'netbanking', em:'🏦', name:'Net Banking',      sub:'All major banks' },
  { id:'emi',        em:'📅', name:'No-cost EMI',      sub:'0% · 3–12 months' },
];

function StepIndicator({ step }: { step: number }) {
  const steps = ['Address','Shipping','Payment','Review'];
  return (
    <div className="flex items-center mb-6">
      {steps.map((lb, i) => {
        const n = i + 1;
        const done = n < step && step < 5;
        const act  = n === step && step < 5;
        return (
          <div key={lb} className="flex items-center">
            {i > 0 && <div className={`flex-1 h-0.5 min-w-[20px] mx-1.5 ${done || step === 5 ? 'bg-[var(--gr)]' : 'bg-[var(--br)]'}`} />}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11.5px] font-bold border-2 flex-shrink-0
                              ${done||step===5 ? 'bg-[var(--gr)] text-white border-[var(--gr)]'
                              : act ? 'bg-[var(--dk)] text-white border-[var(--dk)]'
                              : 'bg-[var(--bg3)] text-[var(--tx3)] border-[var(--br)]'}`}>
                {done || step === 5 ? <Check size={12} /> : n}
              </div>
              <span className={`text-[11px] font-semibold hidden sm:block ${act ? 'text-[var(--dk)]' : 'text-[var(--tx3)]'}`}>{lb}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Checkout() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const notify    = useNotification();
  const cart      = useAppSelector(s => s.cart.items);
  const categories = useAppSelector(s => s.catalog.categories);
  const co        = useAppSelector(s => s.orders.checkout);
  const lastOrder = useAppSelector(s => s.orders.lastOrderId);
  const addresses = useAppSelector(s => s.orders.addresses);
  const placing   = useAppSelector(s => s.orders.placing);

  useEffect(() => { dispatch(fetchMyAccountData()); }, [dispatch]);
  useEffect(() => {
    if (co.step === 5 && cart.length > 0) dispatch(ordersActions.resetCheckout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { cnm: co.cnm, cph: co.cph, cem: co.cem, ca1: co.ca1, ca2: co.ca2, city: co.city, state: co.state, pin: co.pin },
  });

  if (!cart.length && co.step !== 5) return (
    <div className="text-center py-20">
      <p className="text-[var(--tx2)] mb-4">Your cart is empty.</p>
      <button onClick={() => navigate('/store')} className="text-[var(--ac)] font-bold">← Browse Store</button>
    </div>
  );

  const sub  = cart.reduce((a, i) => a + i.p * i.qty, 0);
  const gst  = Math.round(sub * 0.18);
  const shipCost = { standard: sub >= 10000 ? 0 : 599, express: 299, sameday: 599 }[co.shipping] ?? 599;
  const disc  = co.coupon === 'STEEL10' ? Math.round(sub * 0.1) : 0;
  const total = sub + gst + shipCost - disc;

  const onAddress = (data: AddressData) => {
    dispatch(ordersActions.setCheckout({ ...data, step: 2, addressId: null }));
  };

  const useSavedAddress = (a: typeof addresses[0]) => {
    reset({ cnm: a.fullName, cph: a.phone, cem: co.cem, ca1: a.line1, ca2: a.line2, city: a.city, state: a.state, pin: a.postalCode });
    dispatch(ordersActions.setCheckout({
      cnm: a.fullName, cph: a.phone, ca1: a.line1, ca2: a.line2, city: a.city, state: a.state, pin: a.postalCode,
      addressId: a.id, step: 2,
    }));
  };

  const handlePlaceOrder = async () => {
    try {
      // Step 1: create the order record
      const orderResult = await dispatch(placeOrderThunk({
        items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
        address: { fullName: co.cnm, phone: co.cph, line1: co.ca1, line2: co.ca2, city: co.city, state: co.state, postalCode: co.pin, addressId: co.addressId },
        shippingMethod: co.shipping,
        paymentMethod: co.payment,
        couponCode: co.coupon || null,
      })).unwrap();

      // Step 2: simulate payment (COD = no gateway; others = mock success).
      // Real Razorpay drops in here in Sprint B-live — only this block changes.
      if (co.payment !== 'cod' && orderResult) {
        const orderId: string = (orderResult as any).dbId ?? (orderResult as any).id ?? '';
        if (orderId) {
          await dispatch(mockPayOrderThunk({
            orderId,
            amount: total,
            paymentMethod: co.payment,
            gstAmount: gst,
          })).unwrap();
        }
      }

      dispatch(cartActions.clearCart());
      notify('Order placed! 🎉');
    } catch (err: any) {
      notify(err.message ?? 'Could not place order', 'error');
    }
  };

  return (
    <div className="max-w-[660px] mx-auto px-4 py-6 animate-up">
      <StepIndicator step={co.step} />

      {/* ── STEP 1: ADDRESS ── */}
      {co.step === 1 && (
        <form onSubmit={handleSubmit(onAddress)}>
          <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-[var(--ac)]" />Delivery Address
          </h2>
          {addresses.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold uppercase text-[var(--tx3)] mb-2">Saved Addresses</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {addresses.map(a => (
                  <button key={a.id} type="button" onClick={() => useSavedAddress(a)}
                    className="text-left border border-[var(--br)] rounded-[11px] p-3 hover:border-[var(--dk)] transition-colors">
                    <div className="text-[12.5px] font-bold text-[var(--tx)]">{a.label} · {a.fullName}</div>
                    <div className="text-[11.5px] text-[var(--tx3)] mt-0.5 leading-snug">{a.line1}, {a.city}, {a.state} {a.postalCode}</div>
                  </button>
                ))}
              </div>
              <div className="text-[11.5px] text-[var(--tx3)] mt-2">Or enter a new address below:</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *" placeholder="Your full name" error={errors.cnm?.message} {...register('cnm')} />
            <Field label="Phone *" placeholder="10-digit mobile" error={errors.cph?.message} {...register('cph')} />
            <Field label="Email" type="email" placeholder="For order updates" error={errors.cem?.message} className="col-span-2" {...register('cem')} />
            <Field label="Address Line 1 *" placeholder="House/Flat, Street" error={errors.ca1?.message} className="col-span-2" {...register('ca1')} />
            <Field label="Address Line 2" placeholder="Landmark (optional)" className="col-span-2" {...register('ca2')} />
            <Field label="City *" placeholder="Your city" error={errors.city?.message} {...register('city')} />
            <Field label="PIN Code *" placeholder="6-digit PIN" error={errors.pin?.message} {...register('pin')} />
            <div className="col-span-2">
              <SelectField label="State *" error={errors.state?.message} {...register('state')}>
                <option value="">-- Select --</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </SelectField>
            </div>
          </div>
          <Btn fullWidth type="submit" className="mt-5 py-3 text-sm">Continue to Shipping →</Btn>
        </form>
      )}

      {/* ── STEP 2: SHIPPING ── */}
      {co.step === 2 && (
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-4 flex items-center gap-2">
            <Truck size={18} className="text-[var(--ac)]" />Shipping Method
          </h2>
          {SHIP_OPTS.map(({ id, icon: Icon, name, time, cost }) => (
            <div key={id}
              onClick={() => dispatch(ordersActions.setCheckout({ shipping: id as any }))}
              className={`flex items-center gap-3 px-3.5 py-3.5 border rounded-[12px] mb-2 cursor-pointer transition-all
                          ${co.shipping === id ? 'border-[var(--dk)] bg-[var(--sf2)]' : 'border-[var(--br)] hover:border-[var(--dk)]/50'}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                               ${co.shipping === id ? 'border-[var(--dk)] bg-[var(--dk)]' : 'border-[var(--br2)]'}`}>
                {co.shipping === id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div className="w-9 h-9 rounded-[10px] bg-[var(--bg2)] flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-[var(--dk)]" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold text-[var(--tx)]">{name}</div>
                <div className="text-[12px] text-[var(--tx3)]">{time}</div>
              </div>
              <div className={`text-[14px] font-extrabold ${cost(sub) === 'FREE' ? 'text-[var(--gr)]' : 'text-[var(--tx)]'}`}>
                {cost(sub)}
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-5">
            <Btn variant="secondary" onClick={() => dispatch(ordersActions.setCheckout({ step: 1 }))}>← Back</Btn>
            <Btn fullWidth onClick={() => dispatch(ordersActions.setCheckout({ step: 3 }))}>Continue to Payment →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 3: PAYMENT ── */}
      {co.step === 3 && (
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--ac)]" />Payment Method
          </h2>
          {PAY_OPTS.map(({ id, em, name, sub: sb }) => (
            <div key={id}
              onClick={() => dispatch(ordersActions.setCheckout({ payment: id as any }))}
              className={`flex items-center gap-3 px-3.5 py-3.5 border rounded-[12px] mb-2 cursor-pointer transition-all
                          ${co.payment === id ? 'border-[var(--dk)] bg-[var(--sf2)]' : 'border-[var(--br)] hover:border-[var(--dk)]/50'}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                               ${co.payment === id ? 'border-[var(--dk)] bg-[var(--dk)]' : 'border-[var(--br2)]'}`}>
                {co.payment === id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div className="w-8 h-6 rounded-lg bg-[var(--bg2)] flex items-center justify-center text-base flex-shrink-0">{em}</div>
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{name}</div>
                <div className="text-[11.5px] text-[var(--tx3)]">{sb}</div>
              </div>
            </div>
          ))}
          <div className="mt-4">
            <label className="block text-[12.5px] font-bold text-[var(--tx)] mb-1">Coupon Code</label>
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2.5 border border-[var(--br)] rounded-[9px] text-[13.5px] bg-[var(--sf)] text-[var(--tx)] outline-none focus:border-[var(--dk)] transition-colors"
                placeholder='Try "STEEL10" for 10% off'
                value={co.coupon}
                onChange={e => dispatch(ordersActions.setCheckout({ coupon: e.target.value.toUpperCase() }))} />
              <Btn onClick={() => {
                if (co.coupon === 'STEEL10') notify('10% off applied! 🎉');
                else notify('Invalid coupon', 'info');
              }}>Apply</Btn>
            </div>
            {disc > 0 && <p className="text-[12.5px] text-[var(--gr)] mt-1.5 font-semibold">✓ Saving {fmt(disc)}</p>}
          </div>
          <div className="flex gap-2 mt-5">
            <Btn variant="secondary" onClick={() => dispatch(ordersActions.setCheckout({ step: 2 }))}>← Back</Btn>
            <Btn fullWidth onClick={() => dispatch(ordersActions.setCheckout({ step: 4 }))}>Review Order →</Btn>
          </div>
        </div>
      )}

      {/* ── STEP 4: REVIEW ── */}
      {co.step === 4 && (
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-4 flex items-center gap-2">
            <Check size={18} className="text-[var(--ac)]" />Review & Place Order
          </h2>

          {/* Items */}
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-4 mb-3">
            <div className="text-[11px] font-bold uppercase text-[var(--tx3)] mb-3">Order Items</div>
            {cart.map(it => (
              <div key={it.id} className="flex gap-2.5 items-center py-1.5 border-b border-[var(--br)] last:border-0">
                <div className="w-10 h-10 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: it.bg }}>
                  <i className={`ti ${catIC(categories, it.cat)} text-[18px] text-white/40`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[var(--tx)] truncate">{it.n}</div>
                  <div className="text-[11px] text-[var(--tx3)]">Qty: {it.qty}</div>
                </div>
                <div className="text-[14px] font-extrabold text-[var(--tx)]">{fmt(it.p * it.qty)}</div>
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-3">
            <div className="text-[11px] font-bold uppercase text-[var(--tx3)] mb-2">Delivery To</div>
            <div className="text-[14px] font-bold text-[var(--tx)]">{co.cnm}</div>
            <div className="text-[13px] text-[var(--tx2)] mt-0.5">
              {[co.ca1, co.ca2, co.city, co.state, co.pin].filter(Boolean).join(', ')}
            </div>
            <div className="text-[13px] text-[var(--tx2)]">{co.cph}</div>
          </div>

          {/* Totals */}
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[13px] p-3.5 mb-5">
            <div className="text-[11px] font-bold uppercase text-[var(--tx3)] mb-2">Payment: {PAY_OPTS.find(p=>p.id===co.payment)?.name}</div>
            {[['Subtotal',fmt(sub)],['GST',fmt(gst)],['Shipping',shipCost===0?'Free':fmt(shipCost)]].map(([k,v])=>(
              <div key={k} className="flex justify-between mb-1.5 text-[13px]">
                <span className="text-[var(--tx2)]">{k}</span>
                <span className={`font-semibold ${v==='Free'?'text-[var(--gr)]':'text-[var(--tx)]'}`}>{v}</span>
              </div>
            ))}
            {disc>0 && <div className="flex justify-between mb-1.5 text-[13px]"><span className="text-[var(--tx2)]">Coupon</span><span className="font-semibold text-[var(--gr)]">−{fmt(disc)}</span></div>}
            <div className="border-t-2 border-[var(--br)] pt-2.5 mt-2 flex justify-between items-center">
              <span className="text-[15px] font-extrabold text-[var(--tx)]">Total Payable</span>
              <span className="text-[20px] font-black text-[var(--tx)]">{fmt(total)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Btn variant="secondary" onClick={() => dispatch(ordersActions.setCheckout({ step: 3 }))}>← Back</Btn>
            <Btn fullWidth onClick={handlePlaceOrder} disabled={placing} className="py-3 text-[15px]">
              {placing ? 'Placing order…' : `Place Order · ${fmt(total)}`}
            </Btn>
          </div>
        </div>
      )}

      {/* ── STEP 5: SUCCESS ── */}
      {co.step === 5 && (
        <div className="text-center py-5">
          <div className="w-[72px] h-[72px] bg-green-100 rounded-[22px] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-[var(--gr)]" />
          </div>
          <h2 className="text-[22px] font-black text-[var(--tx)] mb-1.5">Order Placed! 🎉</h2>
          <p className="text-[14px] text-[var(--tx2)] mb-1">Order <strong>#{lastOrder}</strong> confirmed.</p>
          <p className="text-[13px] text-[var(--tx3)] mb-6">Updates sent to {co.cem || co.cph || 'your contact'}</p>

          {/* Timeline */}
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[14px] p-4 mb-6 text-left">
            {([['Order Confirmed','Just now',true],['Being Packed','Within 24 hours',false],['Out for Delivery','In 3–5 days',false],['Delivered','In 5–7 days',false]] as [string,string,boolean][]).map(([s,t,done])=>(
              <div key={s} className="flex items-center gap-2.5 py-1.5">
                <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${done?'bg-[var(--gr)]':'bg-[var(--bg3)]'}`}>
                  <CheckCircle size={11} className={done?'text-white':'text-[var(--tx3)]'} />
                </div>
                <div>
                  <div className={`text-[13px] ${done?'font-bold text-[var(--tx)]':'font-medium text-[var(--tx3)]'}`}>{s}</div>
                  <div className="text-[11px] text-[var(--tx3)]">{t}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <Btn onClick={() => { navigate('/dashboard'); }}>
              <Package size={15} />Track Order
            </Btn>
            <Btn variant="secondary" onClick={() => navigate('/store')}>
              <Home size={15} />Continue Shopping
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

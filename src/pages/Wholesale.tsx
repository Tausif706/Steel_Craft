import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle, Plus } from 'lucide-react';
import { rfqSchema } from '../schemas';
import { useAppDispatch } from '../store';
import { submitRfqThunk } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { Field, Textarea, Btn } from '../components/ui/shared';
import { z } from 'zod';

type RFQFormData = z.infer<typeof rfqSchema>;

const TIERS = [
  { qty:'10–24',  disc:'5% OFF',  label:'Standard',    pop:false },
  { qty:'25–49',  disc:'10% OFF', label:'Dealer',      pop:false },
  { qty:'50–99',  disc:'15% OFF', label:'Preferred',   pop:true  },
  { qty:'100+',   disc:'20% OFF', label:'Distributor', pop:false },
];

export default function Wholesale() {
  const dispatch = useAppDispatch();
  const notify   = useNotification();
  const [done, setDone] = useState(false);
  const [submittedCo, setSubmittedCo] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema) as any,
    defaultValues: { qty: 10 },
  });

  const onSubmit: SubmitHandler<RFQFormData> = async (data) => {
    try {
      await dispatch(submitRfqThunk({
        companyName: data.co, contactName: data.nm ?? '', phone: data.ph, email: data.em,
        city: data.ci ?? '', productInterest: data.pr ?? '', quantity: Number(data.qty),
      })).unwrap();
      setSubmittedCo(data.co);
      setDone(true);
      notify('RFQ submitted! 🎉');
    } catch (err: any) {
      notify(err.message ?? 'Could not submit request', 'error');
    }
  };

  return (
    <div className="animate-up">
      {/* ── Hero ── */}
      <section className="bg-[var(--dk)] py-[clamp(44px,6vw,68px)] px-5">
        <div className="max-w-[640px] mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 bg-[rgba(200,130,10,.16)] border border-[rgba(200,130,10,.35)]
                          text-[var(--ac2)] text-[11px] font-bold px-3.5 py-1 rounded-full tracking-widest uppercase mb-4">
            <Building2 size={12} />B2B &amp; Institutional
          </div>
          <h1 className="text-[clamp(1.8rem,4.5vw,2.8rem)] font-black text-white leading-tight mb-3">
            Wholesale &amp;<br /><em className="not-italic text-[var(--ac2)]">Bulk Orders</em>
          </h1>
          <p className="text-white/63 leading-relaxed">
            Special pricing for businesses. Minimum order 10 units.
          </p>
        </div>
      </section>

      <div className="max-w-[1040px] mx-auto px-4 py-8">
        {/* Pricing tiers */}
        <div className="text-center mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ac)] mb-1.5">Volume Discounts</div>
          <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-extrabold text-[var(--tx)]">Bulk Pricing Tiers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-10">
          {TIERS.map(({ qty, disc, label, pop }) => (
            <div key={qty}
              className={`relative rounded-2xl p-5 text-center border-2 transition-all hover:shadow-s2
                          ${pop ? 'bg-[var(--dk)] border-[var(--dk)] shadow-[0_8px_26px_rgba(13,40,71,.3)]'
                                : 'bg-[var(--sf)] border-[var(--br)] hover:border-[var(--ac)]'}`}>
              {pop && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-100 text-yellow-800
                                 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">⭐ Popular</span>
              )}
              <div className={`text-[24px] font-black ${pop ? 'text-[var(--ac2)]' : 'text-[var(--ac)]'}`}>{disc}</div>
              <div className={`text-[12.5px] font-bold mt-1 ${pop ? 'text-white/80' : 'text-[var(--tx)]'}`}>{qty} units</div>
              <div className={`text-[11px] mt-0.5 ${pop ? 'text-white/50' : 'text-[var(--tx3)]'}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* RFQ Form */}
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-[clamp(18px,4vw,28px)] max-w-[630px] mx-auto">
          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-[var(--gr)]" />
              </div>
              <h3 className="text-[19px] font-extrabold text-[var(--tx)] mb-2">Request Submitted!</h3>
              <p className="text-[13.5px] text-[var(--tx2)] mb-5">
                Thank you <strong>{submittedCo}</strong>. Our team contacts you within 4 hours.
              </p>
              <Btn onClick={() => { setDone(false); reset(); }}>
                <Plus size={15} />New Request
              </Btn>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <h3 className="text-[17px] font-extrabold text-[var(--tx)] mb-1">Request for Quotation</h3>
              <p className="text-[13px] text-[var(--tx2)] mb-5">Get a quote within 4 hours</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Company *"      placeholder="ABC Traders"   error={errors.co?.message}  {...register('co')} />
                <Field label="Contact Person" placeholder="Your name"                                 {...register('nm')} />
                <Field label="Phone *"        placeholder="10-digit"      error={errors.ph?.message}  {...register('ph')} />
                <Field label="Email *" type="email" placeholder="biz@email.com" error={errors.em?.message} {...register('em')} />
                <Field label="City"           placeholder="Your city"                                 {...register('ci')} />
                <Field label="Product"        placeholder="Steel Almirahs"                            {...register('pr')} />
                <Field label="Quantity (min 10)" type="number" error={errors.qty?.message}            {...register('qty')} />
                <div className="sm:col-span-2">
                  <Textarea label="Notes" placeholder="Requirements, specs..." rows={3}               {...register('no')} />
                </div>
              </div>

              <Btn fullWidth type="submit" disabled={isSubmitting} className="mt-5 py-3">
                {isSubmitting ? 'Submitting…' : '📩 Submit Request'}
              </Btn>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

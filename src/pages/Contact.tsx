import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { contactSchema, type ContactData } from '../schemas';
import { useNotification } from '../hooks/useNotification';
import { submitContactMessage } from '../lib/repo';
import { Field, Textarea, SelectField, Btn } from '../components/ui/shared';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SHOWROOM_POS: [number, number] = [17.4463, 78.3674]; // HITEC City, Hyderabad

const CONTACT_CARDS = [
  { icon: Phone,         label: 'Call Us',    value: '1800-123-4567',    sub: 'Mon–Sat 9AM–7PM',  href: 'tel:18001234567',                    bg:'#DBEAFE', ic:'#1E40AF' },
  { icon: MessageSquare, label: 'WhatsApp',   value: '9876543210',       sub: 'Quick response',    href: 'https://wa.me/919876543210',          bg:'#DCFCE7', ic:'#166534' },
  { icon: Mail,          label: 'Email',      value: 'sales@steelcraft.in', sub: 'Reply in 24 hrs', href: 'mailto:sales@steelcraft.in',         bg:'#EDE9FE', ic:'#5B21B6' },
  { icon: MapPin,        label: 'Visit Us',   value: 'HITEC City, HYD', sub: 'Showroom 10AM–7PM', href: 'https://maps.google.com/?q=17.4463,78.3674', bg:'#FEF3C7', ic:'#92610A' },
];

export default function Contact() {
  const notify = useNotification();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactData) => {
    try {
      await submitContactMessage(data);
      notify('Message sent! We respond within 24 hours ✓');
      reset();
    } catch (err: any) {
      notify(err.message ?? 'Could not send message', 'error');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      <div className="mb-5">
        <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-extrabold text-[var(--tx)]">Contact Us</h1>
        <p className="text-[.9rem] text-[var(--tx2)] mt-1">We'd love to hear from you. Reach us anytime.</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {CONTACT_CARDS.map(({ icon: Icon, label, value, sub, href, bg, ic }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer"
            className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl p-4 text-center block
                       hover:border-[var(--ac)] hover:shadow-s2 transition-all no-underline">
            <div className="w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center" style={{ background: bg }}>
              <Icon size={20} style={{ color: ic }} />
            </div>
            <div className="text-[13px] font-bold text-[var(--tx)]">{label}</div>
            <div className="text-[12.5px] font-semibold text-[var(--dk)] mt-0.5 break-all">{value}</div>
            <div className="text-[11px] text-[var(--tx3)] mt-0.5">{sub}</div>
          </a>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact form */}
        <div className="bg-[var(--sf)] border border-[var(--br)] rounded-[18px] p-[clamp(16px,3vw,28px)]">
          <h2 className="text-[17px] font-extrabold text-[var(--tx)] mb-1">Send us a Message</h2>
          <p className="text-[13px] text-[var(--tx2)] mb-5">We'll get back within 24 hours</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your Name *" placeholder="Full name" error={errors.name?.message} {...register('name')} />
              <Field label="Phone" placeholder="10-digit mobile" error={errors.phone?.message} {...register('phone')} />
              <div className="col-span-2">
                <Field label="Email *" type="email" placeholder="your@email.com" error={errors.email?.message} {...register('email')} />
              </div>
              <div className="col-span-2">
                <SelectField label="Subject" error={errors.subject?.message} {...register('subject')}>
                  <option value="">-- Select Subject --</option>
                  {['Product Inquiry','Bulk Order','Order Support','Custom Furniture','Dealer / Franchise','Other'].map(s=>(
                    <option key={s}>{s}</option>
                  ))}
                </SelectField>
              </div>
              <div className="col-span-2">
                <Textarea label="Message *" rows={4} placeholder="Describe your requirement..." error={errors.message?.message} {...register('message')} />
              </div>
            </div>
            <Btn fullWidth type="submit" disabled={isSubmitting} className="mt-4 py-3">
              {isSubmitting ? 'Sending…' : '📩 Send Message'}
            </Btn>
          </form>
        </div>

        {/* Map */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden border border-[var(--br)] flex-1 min-h-[300px]">
            <MapContainer center={SHOWROOM_POS} zoom={14} style={{ height: '100%', minHeight: '300px', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={SHOWROOM_POS}>
                <Popup>
                  <strong>SteelCraft Showroom</strong><br />
                  HITEC City, Hyderabad<br />
                  Mon–Sat 10AM–7PM
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Hours card */}
          <div className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[var(--ac)]" />
              <span className="font-bold text-[var(--tx)] text-[14px]">Showroom Hours</span>
            </div>
            {[['Mon – Fri','9:00 AM – 7:00 PM'],['Saturday','10:00 AM – 6:00 PM'],['Sunday','Closed']].map(([d,h])=>(
              <div key={d} className="flex justify-between items-center py-1.5 border-b border-[var(--br)] last:border-0 text-[13px]">
                <span className="text-[var(--tx2)]">{d}</span>
                <span className={`font-semibold ${h==='Closed'?'text-[var(--re)]':'text-[var(--tx)]'}`}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

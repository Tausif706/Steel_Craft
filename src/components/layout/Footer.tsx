import { Link } from 'react-router-dom';
import { Zap, Globe, AtSign, Rss, Video, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { useAppSelector } from '../../store';

const QUICK = [
  ['/', 'Home'], ['/store', 'Shop'], ['/wholesale', 'Wholesale'],
  ['/ai', 'AI Builder'], ['/about', 'About Us'], ['/contact', 'Contact'],
  ['/dashboard', 'My Account'],
];
const CONTACT_ITEMS = [
  { icon: Phone,  text: '1800-123-4567' },
  { icon: Mail,   text: 'sales@steelcraft.in' },
  { icon: MapPin, text: 'Hyderabad, Telangana' },
  { icon: Clock,  text: 'Mon–Sat 9AM–7PM' },
];
const SOCIALS = [
  { icon: Globe,  href: '#', label: 'Website' },
  { icon: AtSign, href: '#', label: 'Instagram' },
  { icon: Rss,    href: '#', label: 'Twitter' },
  { icon: Video,  href: '#', label: 'YouTube' },
];

export default function Footer() {
  const categories = useAppSelector(s => s.catalog.categories);
  return (
    <footer className="bg-[#060E1C] mt-12">
      <div className="max-w-[1160px] mx-auto px-5 pt-10 pb-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-7">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-[30px] h-[30px] bg-[var(--dk)] rounded-lg flex items-center justify-center">
                <Zap size={15} className="text-white" />
              </span>
              <span className="text-white text-[15px] font-black">SteelCraft</span>
            </div>
            <p className="text-[#4B6A8A] text-xs leading-relaxed mb-3">
              India's trusted steel furniture brand since 2009.
            </p>
            <div className="flex gap-1.5">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-7 h-7 bg-white/[.07] rounded-[7px] flex items-center justify-center
                             text-[#5B7A9A] hover:bg-white/10 hover:text-slate-300 transition-all">
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div className="text-white text-[10.5px] font-bold uppercase tracking-widest mb-3">Quick Links</div>
            {QUICK.map(([path, label]) => (
              <Link key={path} to={path}
                className="block text-xs text-[#4B6A8A] hover:text-slate-300 transition-colors mb-2">
                {label}
              </Link>
            ))}
          </div>

          {/* Categories */}
          <div>
            <div className="text-white text-[10.5px] font-bold uppercase tracking-widest mb-3">Categories</div>
            {categories.filter(c => c.id !== 'all').slice(0, 5).map(c => (
              <Link key={c.id} to={`/store?cat=${c.id}`}
                className="block text-xs text-[#4B6A8A] hover:text-slate-300 transition-colors mb-2">
                {c.n}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <div className="text-white text-[10.5px] font-bold uppercase tracking-widest mb-3">Contact</div>
            {CONTACT_ITEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-[#4B6A8A] mb-2">
                <Icon size={13} className="text-[#2E4A6A] flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[.08] pt-4 flex justify-between flex-wrap gap-2">
          <span className="text-[#2E4A6A] text-xs">
            © 2024 SteelCraft Furniture Pvt. Ltd. ·{' '}
            <Link to="/admin" className="opacity-40 hover:opacity-70 transition-opacity">Admin</Link>
          </span>
          <span className="text-[#2E4A6A] text-xs">GST Registered · ISI Certified · 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
}

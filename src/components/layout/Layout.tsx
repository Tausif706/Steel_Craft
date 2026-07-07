// ════════════════════════════════════════════════════════════════
// Layout — root shell
//
// Key structural points:
//   • TopBar is fixed (position:fixed) — so <main> needs a 60px
//     top-padding to prevent content from hiding under the nav.
//   • BottomNav is also fixed — so <main> needs a 62px bottom-
//     padding on mobile (handled via pb-[62px] md:pb-0).
//   • Notification bar is rendered between TopBar and main so it
//     stacks naturally within the reading flow.
// ════════════════════════════════════════════════════════════════
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import Drawer from './Drawer';
import { useAppSelector } from '../../store';

// ── WhatsApp float ────────────────────────────────────────────
function WhatsAppFloat() {
  return (
    <div className="fixed right-4 bottom-[calc(62px+16px)] md:bottom-6 z-[200]">
      <a href="https://wa.me/919876543210?text=Hi%2C+interested+in+steel+furniture"
         target="_blank" rel="noreferrer"
         title="Chat on WhatsApp"
         className="w-[52px] h-[52px] bg-[#25D366] rounded-full flex items-center justify-center
                    shadow-[0_4px_20px_rgba(37,211,102,.45)] animate-pulse-wa hover:scale-110
                    transition-transform">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}

// ── Toast notification bar ────────────────────────────────────
const NOTIF_CONFIG = {
  ok:    { bg: 'bg-[#0B3D20]', text: 'text-[#6EE7A0]', border: 'border-[#14532D]', icon: CheckCircle },
  info:  { bg: 'bg-[#0F2D5E]', text: 'text-[#93C5FD]', border: 'border-[#1E3A8A]', icon: Info },
  error: { bg: 'bg-[#4C0E0E]', text: 'text-[#FCA5A5]', border: 'border-[#7F1D1D]', icon: XCircle },
  warn:  { bg: 'bg-[#4A2900]', text: 'text-[#FCD34D]', border: 'border-[#78350F]', icon: AlertTriangle },
} as const;

function Notification() {
  const notif = useAppSelector(s => s.ui.notif);
  if (!notif) return null;
  const type = notif.type === 'ok' ? 'ok' : notif.type === 'error' ? 'error' : 'info';
  const cfg = NOTIF_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-semibold
                     border-b animate-down flex-shrink-0
                     ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1">{notif.msg}</span>
    </div>
  );
}

// ── Root layout ───────────────────────────────────────────────
export default function Layout() {
  const dark = useAppSelector(s => s.ui.dark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)] overflow-x-hidden">

      {/* Fixed TopBar — 60px tall */}
      <TopBar />

      {/* Notification bar — sits just below the fixed TopBar in visual flow.
          It has to be fixed too so it doesn't disappear when TopBar hides. */}
      <div className="fixed top-[60px] left-0 right-0 z-[299]">
        <Notification />
      </div>

      {/* Main — pad top for fixed TopBar, pad bottom for fixed BottomNav on mobile */}
      <main className="flex-1 pt-[60px] pb-[62px] md:pb-0">
        <Outlet />
      </main>

      <Footer />

      {/* Fixed BottomNav — mobile only */}
      <BottomNav />

      <WhatsAppFloat />
      <Drawer />
    </div>
  );
}

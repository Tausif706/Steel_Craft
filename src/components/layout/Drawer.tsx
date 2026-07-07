import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Moon, Sun, ShoppingCart, Heart, Package, Wand2, ShoppingBag,
         Building2, Info, Mail, Settings, HelpCircle, LayoutDashboard, Columns, Phone, LogOut, LogIn } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { uiActions, signOutThunk } from '../../store/slices';

export default function Drawer() {
  const dispatch   = useAppDispatch();
  const { dark, drawer } = useAppSelector(s => s.ui);
  const cart       = useAppSelector(s => s.cart.items);
  const wish       = useAppSelector(s => s.wish.items);
  const orders     = useAppSelector(s => s.orders.list);
  const aiDesigns  = useAppSelector(s => s.orders.aiDesignCount);
  const compare    = useAppSelector(s => s.compare);
  const profile    = useAppSelector(s => s.auth.profile);
  const userId     = useAppSelector(s => s.auth.userId);
  const isAdmin    = profile?.role === 'admin';
  const userName   = profile?.firstName || (userId ? 'Account' : 'Guest');
  const navigate   = useNavigate();

  const cc = cart.reduce((a, i) => a + i.qty, 0);
  const oc = orders.length;

  const close = () => dispatch(uiActions.setDrawer(false));
  const go    = (path: string) => { close(); navigate(path); };
  const handleSignOut = async () => { await dispatch(signOutThunk()); close(); navigate('/'); };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleSwitch = (
    <label className="tsw" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={dark} onChange={() => dispatch(uiActions.toggleDark())} />
      <span className="ts-t"><span className="ts-th" /></span>
    </label>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-[rgba(5,15,35,.6)] z-[399] transition-opacity duration-300
                    backdrop-blur-[2px] ${drawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-[min(295px,88vw)] bg-[var(--sf)] z-[400]
                    transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]
                    overflow-y-auto flex flex-col shadow-[−8px_0_40px_rgba(0,0,0,.22)]
                    ${drawer ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="bg-[var(--dk)] px-4 pt-8 pb-5 relative flex-shrink-0">
          <button onClick={close}
            className="absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-lg bg-white/10
                       hover:bg-white/20 flex items-center justify-center transition-colors">
            <X size={17} className="text-white" />
          </button>
          <div
            onClick={() => go('/dashboard')}
            className="w-[52px] h-[52px] rounded-full bg-white/16 border-2 border-white/28
                       flex items-center justify-center text-2xl font-extrabold text-white
                       mb-2.5 cursor-pointer hover:bg-white/24 transition-colors">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="text-white font-extrabold text-[16px] mb-0.5">{userName}</div>
          <div className="text-white/50 text-[11.5px] cursor-pointer hover:text-white/80 transition-colors"
               onClick={() => go('/dashboard')}>
            View Profile & Orders
          </div>
          {(cc + wish.length + oc) > 0 && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {cc > 0 && <span className="flex items-center gap-1 bg-white/10 border border-white/16 text-white/80 text-[11px] font-semibold px-2 py-0.5 rounded-xl"><ShoppingCart size={12}/>{cc} cart</span>}
              {wish.length > 0 && <span className="flex items-center gap-1 bg-white/10 border border-white/16 text-white/80 text-[11px] font-semibold px-2 py-0.5 rounded-xl"><Heart size={12}/>{wish.length} saved</span>}
              {oc > 0 && <span className="flex items-center gap-1 bg-white/10 border border-white/16 text-white/80 text-[11px] font-semibold px-2 py-0.5 rounded-xl"><Package size={12}/>{oc} orders</span>}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 py-1.5">
          {/* Dark mode toggle */}
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg2)] transition-colors"
                  onClick={() => dispatch(uiActions.toggleDark())}>
            {dark ? <Sun size={19} className="text-[var(--tx2)] w-[22px]" /> : <Moon size={19} className="text-[var(--tx2)] w-[22px]" />}
            <span className="flex-1 text-left text-[14px] font-medium text-[var(--tx2)]">
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
            {toggleSwitch}
          </button>

          <div className="h-px bg-[var(--br)] mx-3 my-1.5" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--tx3)] px-4 pt-3.5 pb-1.5">My Account</div>

          {[
            { icon: ShoppingCart, label: 'My Cart',     badge: cc,          path: '/cart' },
            { icon: Heart,        label: 'My Wishlist', badge: wish.length, path: '/wishlist' },
            { icon: Package,      label: 'My Orders',   badge: oc,          path: '/dashboard', tab: 'orders' },
            { icon: Wand2,        label: 'AI Designs',  badge: aiDesigns,   path: '/dashboard', tab: 'ai' },
          ].map(({ icon: Icon, label, badge, path, tab }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                                           text-[var(--tx2)] hover:bg-[var(--bg2)] hover:text-[var(--tx)] transition-all text-left"
                    onClick={() => { if (tab) dispatch(uiActions.setDashTab(tab)); go(path); }}>
              <Icon size={19} className="w-[22px] flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && <span className="bg-[var(--re)] text-white text-[10px] font-bold rounded-[10px] px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>}
            </button>
          ))}

          {compare.length > 0 && (
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                               text-[var(--tx2)] hover:bg-[var(--bg2)] transition-all text-left"
                    onClick={() => go('/compare')}>
              <Columns size={19} className="w-[22px]" />
              <span className="flex-1">Compare ({compare.length})</span>
              <span className="bg-[var(--re)] text-white text-[10px] font-bold rounded-[10px] px-1.5 py-0.5">{compare.length}</span>
            </button>
          )}

          <div className="h-px bg-[var(--br)] mx-3 my-1.5" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--tx3)] px-4 pt-3.5 pb-1.5">Explore</div>

          {[
            { icon: ShoppingBag, label: 'Shop All',   path: '/store' },
            { icon: Building2,   label: 'Wholesale',  path: '/wholesale' },
            { icon: Wand2,       label: 'AI Builder', path: '/ai' },
            { icon: Info,        label: 'About Us',   path: '/about' },
            { icon: Mail,        label: 'Contact Us', path: '/contact' },
          ].map(({ icon: Icon, label, path }) => (
            <button key={path} className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                                          text-[var(--tx2)] hover:bg-[var(--bg2)] hover:text-[var(--tx)] transition-all text-left"
                    onClick={() => go(path)}>
              <Icon size={19} className="w-[22px] flex-shrink-0" />
              <span className="flex-1">{label}</span>
            </button>
          ))}

          <div className="h-px bg-[var(--br)] mx-3 my-1.5" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--tx3)] px-4 pt-3.5 pb-1.5">Settings</div>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                             text-[var(--tx2)] hover:bg-[var(--bg2)] transition-all text-left"
                  onClick={() => go('/settings')}>
            <Settings size={19} className="w-[22px]" /><span className="flex-1">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                             text-[var(--tx2)] hover:bg-[var(--bg2)] transition-all text-left"
                  onClick={() => { dispatch(uiActions.setDashTab('support')); go('/dashboard'); }}>
            <HelpCircle size={19} className="w-[22px]" /><span className="flex-1">Help & Support</span>
          </button>
          {isAdmin && (
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                               text-[var(--tx2)] hover:bg-[var(--bg2)] transition-all text-left"
                    onClick={() => go('/admin')}>
              <LayoutDashboard size={19} className="w-[22px]" /><span className="flex-1">Admin Panel</span>
              <span className="bg-[var(--ac)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">Admin</span>
            </button>
          )}
          {userId ? (
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                               text-[var(--re)] hover:bg-red-50 transition-all text-left"
                    onClick={handleSignOut}>
              <LogOut size={19} className="w-[22px]" /><span className="flex-1">Sign Out</span>
            </button>
          ) : (
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium
                               text-[var(--dk)] hover:bg-[var(--bg2)] transition-all text-left"
                    onClick={() => go('/login')}>
              <LogIn size={19} className="w-[22px]" /><span className="flex-1">Sign In</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--br)] bg-[var(--sf)] flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[var(--tx3)] mb-1.5">
            <Phone size={14} className="text-[var(--ac)]" />
            1800-123-4567
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--tx3)] mb-1.5">
            <Mail size={14} className="text-[var(--ac)]" />
            sales@steelcraft.in
          </div>
          <div className="text-[10.5px] text-[var(--tx3)] mt-1.5 opacity-70">SteelCraft v2.3 · Made in India 🇮🇳</div>
        </div>
      </aside>
    </>
  );
}

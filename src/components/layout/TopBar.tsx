// ════════════════════════════════════════════════════════════════
// TopBar — fixed + scroll-aware
//
// Behaviour:
//   • Fixed at top so it never scrolls away.
//   • Hides (slides up) when the user scrolls DOWN past 60px.
//   • Reveals (slides back) the instant they scroll UP.
//   • Glass surface with backdrop-blur so page content shows
//     through beautifully when it reappears.
// ════════════════════════════════════════════════════════════════
import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Zap, ChevronDown, Search } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { uiActions } from '../../store/slices';

const NAV_LINKS: [string, string, string?][] = [
  ['/', 'Home'],
  ['/store', 'Shop'],
  ['/wholesale', 'B2B'],
  ['/ai', 'AI Builder', 'NEW'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
];

export default function TopBar() {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();

  const cartCount = useAppSelector(s => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const wishCount = useAppSelector(s => s.wish.items.length);
  const { drawer } = useAppSelector(s => s.ui);
  const profile = useAppSelector(s => s.auth.profile);
  const userId = useAppSelector(s => s.auth.userId);
  const userName = profile?.firstName || (userId ? 'Account' : 'Guest');

  // ── scroll-aware visibility ──────────────────────────────────
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false); // add shadow once page scrolls
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // show when scrolling up OR near the top
      setVisible(y < 80 || y < lastY.current);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-[300] h-[60px] flex items-center gap-2 px-4 md:px-6',
        'glass',                              // backdrop-blur + semi-transparent
        scrolled ? 'shadow-s2' : 'shadow-s1',
        'transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
        visible ? 'topbar-visible' : 'topbar-hidden',
      ].join(' ')}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group mr-2">
        <span className="w-[36px] h-[36px] rounded-[10px] bg-[var(--dk)] group-hover:bg-[var(--ac)]
                         flex items-center justify-center transition-colors shadow-s1">
          <Zap size={18} className="text-white" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-[15.5px] font-black tracking-tight text-[var(--tx)] leading-none">SteelCraft</span>
          <span className="block text-[8px] font-bold tracking-[.18em] text-[var(--tx3)] uppercase mt-0.5">Steel Furniture</span>
        </span>
      </Link>

      {/* ── Desktop nav ──────────────────────────────────────── */}
      <nav className="hidden md:flex gap-0.5 flex-1 justify-center">
        {NAV_LINKS.map(([path, label, badge]) => (
          <Link key={path} to={path}
            className={[
              'relative px-3.5 py-1.5 text-[13px] font-medium rounded-[10px] transition-all',
              isActive(path)
                ? 'text-[var(--dk)] font-bold bg-[rgba(13,40,71,.07)] dark:text-[var(--ac2)] dark:bg-[rgba(200,130,10,.10)]'
                : 'text-[var(--tx2)] hover:text-[var(--tx)] hover:bg-[var(--bg3)]',
            ].join(' ')}>
            {label}
            {badge && (
              <span className="absolute -top-0.5 -right-0.5 text-[8.5px] font-extrabold bg-[var(--ac)] text-white
                               px-1 py-px rounded-full leading-none">
                {badge}
              </span>
            )}
            {isActive(path) && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2.5px]
                               bg-[var(--ac)] rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      {/* ── Right controls ───────────────────────────────────── */}
      <div className="flex items-center gap-1 ml-auto flex-shrink-0">

        {/* Search — desktop */}
        <button
          className="hidden md:flex w-9 h-9 items-center justify-center rounded-[10px]
                     text-[var(--tx3)] hover:text-[var(--tx)] hover:bg-[var(--bg3)] transition-all">
          <Search size={18} />
        </button>

        {/* Wishlist — desktop */}
        <Link to="/wishlist"
          className="hidden md:flex w-9 h-9 items-center justify-center relative rounded-[10px]
                     text-[var(--tx3)] hover:text-[var(--re)] hover:bg-red-50 transition-all">
          <Heart size={19} />
          {wishCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full
                             bg-[var(--re)] border-2 border-[var(--sf)]" />
          )}
        </Link>

        {/* Profile pill — desktop */}
        <button
          onClick={() => dispatch(uiActions.setDrawer(true))}
          className="hidden md:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full
                     border border-[var(--br)] bg-[var(--bg2)] hover:border-[var(--ac)]
                     hover:shadow-s2 transition-all group">
          <span className="w-[28px] h-[28px] rounded-full bg-[var(--dk)] group-hover:bg-[var(--ac)]
                           flex items-center justify-center text-white text-xs font-bold transition-colors">
            {userName[0]?.toUpperCase()}
          </span>
          <span className="text-[12.5px] font-semibold text-[var(--tx)] max-w-[72px] truncate">{userName}</span>
          <ChevronDown size={12} className="text-[var(--tx3)]" />
        </button>

        {/* Cart button */}
        <Link to="/cart"
          className="relative flex items-center gap-1.5 bg-[var(--dk)] hover:bg-[var(--dk2)]
                     text-white px-3.5 py-2 rounded-[10px] text-[13px] font-bold
                     transition-all hover:shadow-s2 hover:-translate-y-px">
          <ShoppingCart size={17} />
          <span className="hidden md:inline">Cart</span>
          {cartCount > 0 && (
            <span className="bg-[var(--ac)] rounded-[8px] px-1.5 text-[11px] font-extrabold min-w-[20px] text-center">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => dispatch(uiActions.setDrawer(!drawer))}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-[10px]
                     text-[var(--tx2)] hover:bg-[var(--bg3)] transition-all ml-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {drawer
              ? <><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>
      </div>
    </header>
  );
}

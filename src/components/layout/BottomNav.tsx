// ════════════════════════════════════════════════════════════════
// BottomNav — mobile only, fixed to screen bottom
//
// Design:
//   • Fixed bottom-0 so it never scrolls off screen.
//   • Active tab gets a floating pill indicator above the icon.
//   • Cart and Wishlist badges visible inline — no hunting in menu.
//   • Glass surface matches the TopBar style.
// ════════════════════════════════════════════════════════════════
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Building2, Wand2, ShoppingCart } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store';
import { uiActions } from '../../store/slices';

const TABS = [
  { to: '/',          icon: Home,         label: 'Home'  },
  { to: '/store',     icon: ShoppingBag,  label: 'Shop'  },
  { to: '/wholesale', icon: Building2,    label: 'B2B'   },
  { to: '/ai',        icon: Wand2,        label: 'AI'    },
];

export default function BottomNav() {
  const dispatch  = useAppDispatch();
  const cartCount = useAppSelector(s => s.cart.items.reduce((a, i) => a + i.qty, 0));
  const drawer    = useAppSelector(s => s.ui.drawer);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[290] glass
                    border-t border-[var(--br)] shadow-[0_-4px_20px_rgba(13,40,71,.10)]">
      <div className="flex items-stretch h-[62px] safe-area-padding-bottom">

        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 relative pt-1 pb-1
               transition-colors duration-200
               ${isActive ? 'text-[var(--ac)]' : 'text-[var(--tx3)] active:text-[var(--tx)]'}`
            }>
            {({ isActive }) => (
              <>
                {/* Active pill indicator — floats above the icon */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px]
                                   bg-[var(--ac)] rounded-b-full animate-fade" />
                )}
                <div className={`relative flex items-center justify-center w-9 h-7 rounded-[10px]
                                 transition-all duration-200
                                 ${isActive ? 'bg-[rgba(200,130,10,.12)]' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={`text-[9.5px] font-bold transition-colors ${isActive ? 'text-[var(--ac)]' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* Cart tab — shows live count */}
        <NavLink to="/cart"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 relative pt-1 pb-1
             transition-colors duration-200
             ${isActive ? 'text-[var(--ac)]' : 'text-[var(--tx3)]'}`
          }>
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px]
                                 bg-[var(--ac)] rounded-b-full" />
              )}
              <div className={`relative flex items-center justify-center w-9 h-7 rounded-[10px]
                               transition-all ${isActive ? 'bg-[rgba(200,130,10,.12)]' : ''}`}>
                <ShoppingCart size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full
                                   bg-[var(--ac)] text-white text-[9px] font-extrabold
                                   flex items-center justify-center px-1 border-2 border-[var(--sf)]">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] font-bold">Cart</span>
            </>
          )}
        </NavLink>

        {/* Menu / Drawer button */}
        <button
          onClick={() => dispatch(uiActions.setDrawer(!drawer))}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative pt-1 pb-1
                      transition-colors duration-200
                      ${drawer ? 'text-[var(--ac)]' : 'text-[var(--tx3)]'}`}>
          {drawer && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px]
                             bg-[var(--ac)] rounded-b-full" />
          )}
          <div className={`relative flex items-center justify-center w-9 h-7 rounded-[10px]
                           transition-all ${drawer ? 'bg-[rgba(200,130,10,.12)]' : ''}`}>
            {/* Animated hamburger / close */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth={drawer ? 2.2 : 1.8} strokeLinecap="round">
              {drawer
                ? <><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></>
                : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
              }
            </svg>
          </div>
          <span className="text-[9.5px] font-bold">More</span>
        </button>

      </div>
    </nav>
  );
}

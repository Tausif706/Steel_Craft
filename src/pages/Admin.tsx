import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { uiActions } from '../store/slices';
import { Btn } from '../components/ui/shared';
import AdminOverview from '../components/admin/AdminOverview';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCustomOrders from '../components/admin/AdminCustomOrders';
import AdminRfqs from '../components/admin/AdminRfqs';
import AdminProducts from '../components/admin/AdminProducts';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReviews from '../components/admin/AdminReviews';
import AdminContact from '../components/admin/AdminContact';
import AdminSettings from '../components/admin/AdminSettings';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'orders',    label: 'Orders' },
  { id: 'custom',    label: 'Custom Orders' },
  { id: 'rfqs',      label: 'Wholesale / RFQs' },
  { id: 'products',  label: 'Products' },
  { id: 'users',     label: 'Users' },
  { id: 'reviews',   label: 'Reviews' },
  { id: 'contact',   label: 'Contact' },
  { id: 'settings',  label: 'Settings' },
];

export default function Admin() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const tab      = useAppSelector(s => s.ui.adminTab);

  const tabContent: Record<string, React.ReactNode> = {
    overview: <AdminOverview />,
    orders: <AdminOrders />,
    custom: <AdminCustomOrders />,
    rfqs: <AdminRfqs />,
    products: <AdminProducts />,
    users: <AdminUsers />,
    reviews: <AdminReviews />,
    contact: <AdminContact />,
    settings: <AdminSettings />,
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ac)] mb-1">Admin Panel</div>
          <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-extrabold text-[var(--tx)]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[var(--ac)] text-white text-[12px] font-bold px-3 py-1.5 rounded-full">
            Admin Access
          </span>
          <Btn variant="secondary" onClick={() => navigate('/')} className="py-1.5 px-3 text-[12px]">
            Exit Admin
          </Btn>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto no-scrollbar border-b-2 border-[var(--br)] mb-5">
        {TABS.map(({ id, label }) => (
          <button key={id}
            onClick={() => dispatch(uiActions.setAdminTab(id))}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap
                        border-b-2 -mb-[2px] transition-all
                        ${tab === id
                          ? 'text-[var(--dk)] border-[var(--dk)] font-bold dark:text-[var(--ac2)] dark:border-[var(--ac)]'
                          : 'text-[var(--tx3)] border-transparent hover:text-[var(--tx)]'}`}>
            {label}
          </button>
        ))}
      </div>

      {tabContent[tab] ?? <AdminOverview />}
    </div>
  );
}

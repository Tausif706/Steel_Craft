import { useState } from 'react';
import { Moon, Sun, Lock, Shield, FileText, Trash2, ChevronRight } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store';
import { uiActions } from '../store/slices';
import { useNotification } from '../hooks/useNotification';
import { changeMyPassword } from '../lib/repo';
import { Field, Btn } from '../components/ui/shared';

export default function Settings() {
  const dispatch = useAppDispatch();
  const notify   = useNotification();
  const dark     = useAppSelector(s => s.ui.dark);
  const [changingPw, setChangingPw] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  async function handleChangePassword() {
    if (pw1.length < 6) { notify('Password must be at least 6 characters', 'info'); return; }
    if (pw1 !== pw2) { notify('Passwords do not match', 'info'); return; }
    setSavingPw(true);
    try {
      await changeMyPassword(pw1);
      notify('Password updated ✓');
      setChangingPw(false); setPw1(''); setPw2('');
    } catch (err: any) {
      notify(err.message ?? 'Could not update password', 'error');
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-up">
      <h1 className="text-[clamp(1.3rem,3vw,1.7rem)] font-extrabold text-[var(--tx)] mb-6">Settings</h1>

      {/* ── APPEARANCE ── */}
      <SectionLabel>Appearance</SectionLabel>
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl overflow-hidden mb-5">
        {/* Dark mode */}
        <div
          onClick={() => dispatch(uiActions.toggleDark())}
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--bg2)] transition-colors">
          {dark
            ? <Sun size={19} className="text-[var(--tx2)] w-[22px] flex-shrink-0" />
            : <Moon size={19} className="text-[var(--tx2)] w-[22px] flex-shrink-0" />}
          <span className="flex-1 text-[14px] font-medium text-[var(--tx2)]">
            {dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </span>
          <label className="tsw" onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={dark} onChange={() => dispatch(uiActions.toggleDark())} />
            <span className="ts-t"><span className="ts-th" /></span>
          </label>
        </div>

        {/* Language */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-t border-[var(--br)]">
          <span className="text-[19px] w-[22px] flex-shrink-0">🌐</span>
          <span className="flex-1 text-[14px] font-medium text-[var(--tx2)]">Language</span>
          <select
            className="bg-[var(--bg2)] border border-[var(--br)] rounded-lg px-2.5 py-1.5 text-[13px]
                       text-[var(--tx)] outline-none cursor-pointer"
            onChange={() => notify('Language switching coming soon', 'info')}>
            <option>English</option>
            <option>हिन्दी</option>
            <option>తెలుగు</option>
            <option>मराठी</option>
            <option>தமிழ்</option>
          </select>
        </div>
      </div>

      {/* ── NOTIFICATIONS ── */}
      <SectionLabel>Notifications</SectionLabel>
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl overflow-hidden mb-5">
        {([
          ['📦', 'Order Updates',  'Track deliveries',       true ],
          ['🏷️', 'Deals & Offers', 'Exclusive discounts',   true ],
          ['⭐', 'New Arrivals',   'Latest products',         false],
          ['💬', 'SMS Alerts',     'Important messages',      true ],
        ] as [string, string, string, boolean][]).map(([em, t, d, on], i) => (
          <div key={t}
            className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-[var(--br)]' : ''}`}>
            <span className="text-[19px] w-[22px] flex-shrink-0">{em}</span>
            <div className="flex-1">
              <div className="text-[14px] font-medium text-[var(--tx2)]">{t}</div>
              <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">{d}</div>
            </div>
            <label className="tsw" onClick={e => e.stopPropagation()}>
              <input type="checkbox" defaultChecked={on} onChange={() => {}} />
              <span className="ts-t"><span className="ts-th" /></span>
            </label>
          </div>
        ))}
      </div>

      {/* ── PRIVACY & SECURITY ── */}
      <SectionLabel>Privacy &amp; Security</SectionLabel>
      <div className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl overflow-hidden mb-5">
        <button
          onClick={() => setChangingPw(v => !v)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--bg2)]">
          <Lock size={19} className="w-[22px] flex-shrink-0 text-[var(--tx2)]" />
          <div className="flex-1">
            <div className="text-[14px] font-medium text-[var(--tx2)]">Change Password</div>
            <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">Update account password</div>
          </div>
          <ChevronRight size={15} className={`text-[var(--tx3)] flex-shrink-0 transition-transform ${changingPw ? 'rotate-90' : ''}`} />
        </button>
        {changingPw && (
          <div className="px-4 pb-4 pt-1 border-t border-[var(--br)] space-y-2.5">
            <Field type="password" placeholder="New password" value={pw1} onChange={e => setPw1(e.target.value)} />
            <Field type="password" placeholder="Confirm new password" value={pw2} onChange={e => setPw2(e.target.value)} />
            <Btn onClick={handleChangePassword} disabled={savingPw}>{savingPw ? 'Saving…' : 'Update Password'}</Btn>
          </div>
        )}
        {([
          [Shield,   'Privacy Policy',   'How we handle your data',  false],
          [FileText, 'Terms of Service', 'Our terms',                false],
          [Trash2,   'Delete Account',   'Remove all data',           true ],
        ] as [React.ElementType, string, string, boolean][]).map(([Icon, t, d, danger]) => (
          <button key={t}
            onClick={() => notify(`${t} — coming soon`, 'info')}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                        hover:bg-[var(--bg2)] border-t border-[var(--br)]">
            <Icon size={19}
              className={`w-[22px] flex-shrink-0 ${danger ? 'text-[var(--re)]' : 'text-[var(--tx2)]'}`} />
            <div className="flex-1">
              <div className={`text-[14px] font-medium ${danger ? 'text-[var(--re)]' : 'text-[var(--tx2)]'}`}>{t}</div>
              <div className="text-[11.5px] text-[var(--tx3)] mt-0.5">{d}</div>
            </div>
            <ChevronRight size={15} className="text-[var(--tx3)] flex-shrink-0" />
          </button>
        ))}
      </div>

      <div className="text-center py-4 text-[12px] text-[var(--tx3)]">
        SteelCraft v2.3.0 · © 2024 SteelCraft Furniture Pvt. Ltd.
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--tx3)] mb-2.5">
      {children}
    </div>
  );
}

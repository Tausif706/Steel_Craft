import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail } from 'lucide-react';
import { Field, Btn } from '../components/ui/shared';
import { signIn } from '../lib/repo';
import { useNotification } from '../hooks/useNotification';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const notify = useNotification();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await signIn(email, password);
      notify('Welcome back!', 'ok');
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message ?? 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[400px] mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-[var(--dk)] rounded-2xl flex items-center justify-center mx-auto mb-3">
          <LogIn size={24} className="text-white" />
        </div>
        <h1 className="text-[22px] font-extrabold text-[var(--tx)]">Sign in to SteelCraft</h1>
        <p className="text-[13px] text-[var(--tx2)] mt-1">Track orders, custom designs &amp; RFQs in one place.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl p-5 space-y-4">
        <Field label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" />
        <Field label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete="current-password" />
        {error && (
          <div className="text-[12.5px] text-[var(--re)] bg-red-50 border border-red-100 rounded-[9px] px-3 py-2 flex items-center gap-1.5">
            <Lock size={13} /> {error}
          </div>
        )}
        <Btn type="submit" fullWidth disabled={busy}>
          {busy ? 'Signing in…' : 'Sign In'}
        </Btn>
      </form>

      <p className="text-center text-[13px] text-[var(--tx2)] mt-5">
        New to SteelCraft? <Link to="/register" className="text-[var(--dk)] font-bold">Create an account</Link>
      </p>
      <p className="text-center text-[12px] text-[var(--tx3)] mt-2 flex items-center justify-center gap-1">
        <Mail size={12} /> Wholesale buyer? <Link to="/wholesale" className="text-[var(--dk)] font-bold">Request a quote</Link> without signing in.
      </p>
    </div>
  );
}

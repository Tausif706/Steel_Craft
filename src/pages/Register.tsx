import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, MailCheck } from 'lucide-react';
import { Field, Btn } from '../components/ui/shared';
import { signUp } from '../lib/repo';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!/^[0-9]{10}$/.test(phone)) { setError('Enter a valid 10-digit phone number'); return; }

    setBusy(true);
    try {
      const result = await signUp(email, password, firstName, phone);
      if (result.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setNeedsConfirm(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Could not create account');
    } finally {
      setBusy(false);
    }
  }

  if (needsConfirm) {
    return (
      <div className="max-w-[400px] mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <MailCheck size={24} className="text-green-700" />
        </div>
        <h1 className="text-[20px] font-extrabold text-[var(--tx)] mb-2">Check your email</h1>
        <p className="text-[13.5px] text-[var(--tx2)] leading-relaxed">
          We've sent a confirmation link to <strong>{email}</strong>. Click it, then come back and sign in.
        </p>
        <Link to="/login"><Btn variant="secondary" className="mt-5">Go to Sign In</Btn></Link>
      </div>
    );
  }

  return (
    <div className="max-w-[400px] mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-7">
        <div className="w-14 h-14 bg-[var(--dk)] rounded-2xl flex items-center justify-center mx-auto mb-3">
          <UserPlus size={24} className="text-white" />
        </div>
        <h1 className="text-[22px] font-extrabold text-[var(--tx)]">Create your account</h1>
        <p className="text-[13px] text-[var(--tx2)] mt-1">Save addresses, track orders &amp; custom designs.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[var(--sf)] border border-[var(--br)] rounded-2xl p-5 space-y-4">
        <Field label="First name" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Aarav" />
        <Field label="Phone" required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="9876543210" inputMode="numeric" />
        <Field label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <Field label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
        <Field label="Confirm password" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
        {error && (
          <div className="text-[12.5px] text-[var(--re)] bg-red-50 border border-red-100 rounded-[9px] px-3 py-2">{error}</div>
        )}
        <Btn type="submit" fullWidth disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</Btn>
      </form>

      <p className="text-center text-[13px] text-[var(--tx2)] mt-5">
        Already have an account? <Link to="/login" className="text-[var(--dk)] font-bold">Sign in</Link>
      </p>
    </div>
  );
}

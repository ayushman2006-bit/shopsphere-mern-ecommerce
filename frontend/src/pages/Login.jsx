import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/api';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate(from || (user.role === 'admin' ? '/admin' : '/'), { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(from || (data.user.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      const message = getApiError(err, 'Could not log in. Please check your details.');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    setForm(
      role === 'admin'
        ? { email: 'admin@shopsphere.com', password: 'Admin@12345' }
        : { email: 'customer@shopsphere.com', password: 'Customer@123' }
    );
    setError('');
  };

  return (
    <div>
      <div className="mb-6">
        <span className="badge bg-brand-50 text-brand-700"><Sparkles size={12} /> Welcome back</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">Log in to ShopSphere</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">Pick up where you left off — your cart, wishlist and orders are waiting.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label>
          <span className="label">Email address</span>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              className="input pl-10"
              autoComplete="email"
              required
            />
          </div>
        </label>

        <label>
          <span className="label">Password</span>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Your password"
              className="input pl-10 pr-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:text-ink-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? 'Logging in…' : 'Log in'} <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
        <Link to="/register" className="font-bold text-brand-700 transition hover:text-brand-900">Create an account</Link>
        <a href="mailto:support@shopsphere.dev" className="font-medium text-ink-400 transition hover:text-ink-700">Need help?</a>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-7 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
            <ShieldCheck size={12} className="text-emerald-500" /> Development demo accounts
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fillDemo('customer')}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-brand-200 hover:bg-brand-50"
            >
              <span className="block text-[11px] font-bold text-ink-800">Customer</span>
              <span className="block truncate text-[10px] text-ink-400">customer@shopsphere.com</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left transition hover:border-brand-200 hover:bg-brand-50"
            >
              <span className="block text-[11px] font-bold text-ink-800">Administrator</span>
              <span className="block truncate text-[10px] text-ink-400">admin@shopsphere.com</span>
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-ink-400">These seeded accounts only exist after running the seed script. Click to fill the form.</p>
        </div>
      )}

      <p className="mt-6 text-center text-[11px] leading-5 text-ink-400">
        By continuing you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
};

export default Login;

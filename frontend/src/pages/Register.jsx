import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/api';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate(from || (user.role === 'admin' ? '/admin' : '/'), { replace: true });
  }, [user, from, navigate]);

  const strength = useMemo(() => {
    const password = form.password;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [form.password]);

  const strengthLabel = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength];

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!accepted) {
      setError('Please accept the terms to create an account');
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success(`Welcome to ShopSphere, ${data.user.name.split(' ')[0]}!`);
      navigate(from || '/', { replace: true });
    } catch (err) {
      const message = getApiError(err, 'Could not create your account.');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <span className="badge bg-brand-50 text-brand-700"><User size={12} /> Join ShopSphere</span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">Save your cart, build a wishlist and track every order in one place.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label>
          <span className="label">Full name</span>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Your full name" className="input pl-10" autoComplete="name" required />
          </div>
        </label>

        <label>
          <span className="label">Email address</span>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="you@example.com" className="input pl-10" autoComplete="email" required />
          </div>
        </label>

        <label>
          <span className="label">Phone number <span className="font-normal normal-case text-ink-300">(optional)</span></span>
          <div className="relative">
            <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 90000 00000" className="input pl-10" autoComplete="tel" inputMode="tel" />
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Password</span>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                placeholder="At least 6 characters"
                className="input pl-10 pr-10"
                autoComplete="new-password"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition hover:text-ink-700"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>
          <label>
            <span className="label">Confirm password</span>
            <div className="relative">
              <ShieldCheck size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                placeholder="Repeat password"
                className="input pl-10"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          </label>
        </div>

        {form.password && (
          <div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <span
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    step <= strength
                      ? strength <= 2
                        ? 'bg-rose-400'
                        : strength === 3
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-[10px] font-semibold text-ink-400">Password strength: {strengthLabel}</p>
          </div>
        )}

        <label className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-ink-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            I agree to the terms of service and privacy policy, and understand this is a demo store where online payments are simulated.
          </span>
        </label>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? 'Creating your account…' : 'Create account'} <ArrowRight size={16} />
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
        <Link to="/login" className="font-bold text-brand-700 transition hover:text-brand-900">Already have an account? Log in</Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        {['Free delivery over ₹999', '7-day returns', 'Secure JWT auth'].map((item) => (
          <div key={item} className="rounded-xl border border-slate-100 bg-white p-2">
            <Check size={13} className="mx-auto text-emerald-500" />
            <p className="mt-1 text-[9px] font-semibold leading-3 text-ink-500">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Register;

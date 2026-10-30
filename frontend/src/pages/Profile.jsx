import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Heart,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  Save,
  ShieldCheck,
  ShoppingBag,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getApiError } from '../services/api';
import { formatDate, getInitials } from '../utils/format';

const emptyAddress = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

const Profile = () => {
  const { user, isAdmin, updateProfile, changePassword, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: '', phone: '', address: { ...emptyAddress } });
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || '',
      phone: user.phone || user.address?.phone || '',
      address: { ...emptyAddress, ...(user.address || {}) },
    });
  }, [user]);

  const updateAddressField = (key, value) =>
    setProfile((current) => ({ ...current, address: { ...current.address, [key]: value } }));

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (profile.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile({ name: profile.name, phone: profile.phone, address: profile.address });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getApiError(err, 'Could not update your profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(getApiError(err, 'Could not change your password'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs current="My profile" />

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Account</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">My profile</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your personal details, saved address and account security.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="card p-5 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 text-2xl font-extrabold text-white shadow-glow">
              {getInitials(user.name)}
            </span>
            <h2 className="mt-3 text-lg font-extrabold text-ink-900">{user.name}</h2>
            <p className="mt-0.5 truncate text-xs text-ink-400">{user.email}</p>
            <div className="mt-3 flex justify-center">
              {isAdmin ? (
                <span className="badge bg-brand-100 text-brand-700"><ShieldCheck size={12} /> Administrator</span>
              ) : (
                <span className="badge bg-slate-100 text-slate-600"><User size={12} /> Customer</span>
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-left text-xs">
              <div className="flex justify-between gap-2"><span className="text-ink-400">Member since</span><span className="font-semibold text-ink-700">{formatDate(user.createdAt)}</span></div>
              <div className="flex justify-between gap-2"><span className="text-ink-400">Account status</span><span className="font-semibold text-emerald-600">Active</span></div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <Link to="/orders" className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-semibold text-ink-600 transition hover:bg-slate-50 hover:text-brand-700">
              <Package size={17} className="text-brand-600" /> My orders
            </Link>
            <Link to="/wishlist" className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-semibold text-ink-600 transition hover:bg-slate-50 hover:text-brand-700">
              <Heart size={17} className="text-rose-500" /> Wishlist
              <span className="ml-auto text-[11px] text-ink-400">{wishlistCount}</span>
            </Link>
            <Link to="/cart" className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-semibold text-ink-600 transition hover:bg-slate-50 hover:text-brand-700">
              <ShoppingBag size={17} className="text-brand-600" /> Shopping cart
              <span className="ml-auto text-[11px] text-ink-400">{itemCount}</span>
            </Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-sm font-semibold text-ink-600 transition hover:bg-slate-50 hover:text-brand-700">
                <LayoutDashboard size={17} className="text-brand-600" /> Admin dashboard
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut size={17} /> Log out
            </button>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-brand-800"><ShieldCheck size={14} /> Your account is protected</p>
            <p className="mt-1 text-[11px] leading-5 text-brand-700/80">Passwords are hashed with bcrypt and API requests are authenticated with signed JWTs.</p>
          </div>
        </aside>

        <div className="space-y-5">
          <form onSubmit={handleProfileSubmit} className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><User size={16} /></span>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Personal details</h2>
                <p className="text-[11px] text-ink-400">Keep your contact information up to date.</p>
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label>
                <span className="label">Full name</span>
                <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="input" required />
              </label>
              <label>
                <span className="label">Email address</span>
                <input value={user.email} disabled className="input bg-slate-50" />
                <span className="mt-1 block text-[10px] text-ink-400">Email cannot be changed in this demo.</span>
              </label>
              <label>
                <span className="label">Phone number</span>
                <input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} className="input" placeholder="+91 90000 00000" inputMode="tel" />
              </label>
              <label>
                <span className="label">Role</span>
                <input value={isAdmin ? 'Administrator' : 'Customer'} disabled className="input bg-slate-50" />
              </label>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900"><MapPin size={15} className="text-brand-600" /> Saved delivery address</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="label">Recipient name</span>
                  <input value={profile.address.fullName} onChange={(event) => updateAddressField('fullName', event.target.value)} className="input" placeholder="Name on the delivery" />
                </label>
                <label>
                  <span className="label">Contact phone</span>
                  <input value={profile.address.phone} onChange={(event) => updateAddressField('phone', event.target.value)} className="input" placeholder="Delivery phone number" inputMode="tel" />
                </label>
                <label className="sm:col-span-2">
                  <span className="label">Street address</span>
                  <input value={profile.address.street} onChange={(event) => updateAddressField('street', event.target.value)} className="input" placeholder="House / flat, building, street" />
                </label>
                <label>
                  <span className="label">City</span>
                  <input value={profile.address.city} onChange={(event) => updateAddressField('city', event.target.value)} className="input" />
                </label>
                <label>
                  <span className="label">State</span>
                  <input value={profile.address.state} onChange={(event) => updateAddressField('state', event.target.value)} className="input" />
                </label>
                <label>
                  <span className="label">PIN code</span>
                  <input value={profile.address.postalCode} onChange={(event) => updateAddressField('postalCode', event.target.value)} className="input" inputMode="numeric" />
                </label>
                <label>
                  <span className="label">Country</span>
                  <input value={profile.address.country} onChange={(event) => updateAddressField('country', event.target.value)} className="input" />
                </label>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                <Save size={16} /> {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Lock size={16} /></span>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Change password</h2>
                <p className="text-[11px] text-ink-400">Use at least 6 characters and keep it private.</p>
              </div>
              <button type="button" onClick={() => setShowPasswords((visible) => !visible)} className="ml-auto btn-ghost px-2 py-1.5 text-[11px]">
                {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />} {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="label">Current password</span>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                  className="input"
                  autoComplete="current-password"
                  required
                />
              </label>
              <label>
                <span className="label">New password</span>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                  className="input"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              <label>
                <span className="label">Confirm new password</span>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="input"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <p className="flex items-center gap-1.5 text-[11px] text-ink-400"><BadgeCheck size={13} className="text-emerald-500" /> Use a unique password you do not reuse on other sites.</p>
              <button type="submit" disabled={savingPassword} className="btn-primary">
                {savingPassword ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

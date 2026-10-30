import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Tags,
  Users,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import ScrollToTop from '../components/ScrollToTop';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: Tags },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
  { label: 'Customers', to: '/admin/users', icon: Users },
];

const pageTitles = [
  { match: /^\/admin$/, title: 'Dashboard', description: 'A live view of your store performance.' },
  { match: /^\/admin\/products/, title: 'Products', description: 'Manage catalogue, pricing and stock.' },
  { match: /^\/admin\/categories/, title: 'Categories', description: 'Organise the catalogue customers browse.' },
  { match: /^\/admin\/orders/, title: 'Orders', description: 'Track, fulfil and update customer orders.' },
  { match: /^\/admin\/users/, title: 'Customers', description: 'Manage accounts, roles and access.' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLockBodyScroll(sidebarOpen);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const page = pageTitles.find((entry) => entry.match.test(location.pathname)) || {
    title: 'Admin',
    description: 'Manage your ShopSphere store.',
  };

  const handleLogout = async () => {
    await logout();
    toast.success('You have been logged out');
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo />
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin menu"
          className="rounded-xl p-2 text-ink-500 transition hover:bg-slate-100 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-200">Admin workspace</p>
        <p className="mt-1 text-sm font-bold">ShopSphere control centre</p>
        <p className="mt-1 text-[11px] leading-5 text-white/60">Changes are saved directly to the live database.</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-500 hover:bg-slate-50 hover:text-ink-900'
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <Link
          to="/"
          className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-slate-50 hover:text-brand-700"
        >
          <span className="flex items-center gap-3">
            <ShoppingBag size={18} /> View storefront
          </span>
          <ArrowUpRight size={15} />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/70">
      <ScrollToTop />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
          />
          <aside className="relative h-full w-[84%] max-w-xs animate-slide-down bg-white shadow-lift">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              className="rounded-xl p-2 text-ink-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-ink-900">{page.title}</h1>
              <p className="hidden truncate text-xs text-ink-400 sm:block">{page.description}</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/" className="btn-outline hidden px-3 py-2 text-xs sm:inline-flex">
                <ShoppingBag size={14} /> Storefront
              </Link>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                  {getInitials(user?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-32 truncate text-xs font-bold text-ink-800">{user?.name}</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-600">Administrator</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

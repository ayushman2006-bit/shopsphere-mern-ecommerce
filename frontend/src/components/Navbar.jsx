import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Logo from './Logo';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { categoryService } from '../services/category.service';
import { getInitials } from '../utils/format';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const navLinks = [
  { label: 'Shop All', to: '/products' },
  { label: 'New Arrivals', to: '/products?sort=newest' },
  { label: 'Best Sellers', to: '/products?sort=popular' },
  { label: 'Deals', to: '/products?featured=true' },
];

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const categoriesRef = useRef(null);
  const userRef = useRef(null);

  useLockBodyScroll(mobileOpen);

  useEffect(() => {
    categoryService
      .list()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
    setCategoriesOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) setCategoriesOpen(false);
      if (userRef.current && !userRef.current.contains(event.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserOpen(false);
    setMobileOpen(false);
    toast.success('You have been logged out');
    navigate('/');
  };

  const accountLink = user ? '/profile' : '/login';

  return (
    <header className="sticky top-0 z-50">
      {announcementVisible && (
        <div className="bg-ink-950 text-white">
          <div className="container-page relative flex h-9 items-center justify-center gap-3 pr-8 text-[11px] font-medium sm:text-xs">
            <Sparkles size={13} className="shrink-0 text-accent-300" />
            <p className="truncate">
              Free delivery on orders above ₹999 · Use code <span className="font-bold text-accent-300">WELCOME100</span> for ₹100 off
            </p>
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => setAnnouncementVisible(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 transition hover:text-white"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="container-page flex h-[68px] items-center gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-ink-600 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <Logo />

          <nav className="ml-2 hidden items-center gap-1 lg:flex">
            <div className="relative" ref={categoriesRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen((open) => !open)}
                className={clsx(
                  'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
                  categoriesOpen ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-slate-50 hover:text-ink-900'
                )}
              >
                Categories <ChevronDown size={14} className={categoriesOpen ? 'rotate-180 transition' : 'transition'} />
              </button>
              {categoriesOpen && (
                <div className="absolute left-0 top-full mt-2 w-[540px] animate-slide-down rounded-2xl border border-slate-100 bg-white p-3 shadow-card">
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        to={`/products?category=${category.slug}`}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
                      >
                        <span className="font-medium">{category.name}</span>
                        <span className="text-[11px] text-ink-400">{category.productCount}</span>
                      </Link>
                    ))}
                    {!categories.length && <p className="col-span-2 px-3 py-4 text-sm text-ink-400">Loading categories…</p>}
                  </div>
                  <Link
                    to="/products"
                    className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
                  >
                    Browse the full catalogue <ShoppingBag size={14} />
                  </Link>
                </div>
              )}
            </div>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  clsx(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition',
                    isActive && location.search === new URL(link.to, window.location.origin).search
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-slate-50 hover:text-ink-900'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden min-w-0 max-w-sm flex-1 md:block lg:ml-4">
            <SearchBar />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <Link
              to={user ? '/wishlist' : '/login'}
              className="relative rounded-xl p-2.5 text-ink-600 transition hover:bg-rose-50 hover:text-rose-500"
              aria-label="Wishlist"
            >
              <Heart size={21} />
              {user && wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              className="relative rounded-xl p-2.5 text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
              aria-label="Cart"
            >
              <ShoppingCart size={21} />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative ml-1" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-brand-200 hover:bg-brand-50"
                  aria-label="Account menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                    {getInitials(user.name)}
                  </span>
                  <span className="hidden max-w-24 truncate text-xs font-semibold text-ink-700 sm:block">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={13} className="hidden text-ink-400 sm:block" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 animate-slide-down overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card">
                    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                      <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                      <p className="truncate text-xs text-ink-400">{user.email}</p>
                      {isAdmin && <span className="badge mt-2 bg-brand-100 text-brand-700">Administrator</span>}
                    </div>
                    <div className="p-1.5">
                      <Link to="/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-600 transition hover:bg-slate-50 hover:text-ink-900">
                        <User size={16} /> My profile
                      </Link>
                      <Link to="/orders" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-600 transition hover:bg-slate-50 hover:text-ink-900">
                        <Package size={16} /> My orders
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-600 transition hover:bg-slate-50 hover:text-ink-900">
                        <Heart size={16} /> Wishlist
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-600 transition hover:bg-slate-50 hover:text-ink-900">
                          <LayoutDashboard size={16} /> Admin dashboard
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-100 p-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        <LogOut size={16} /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-1 hidden items-center gap-2 sm:flex">
                <Link to="/login" className="btn-ghost px-3 py-2 text-xs">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary px-3.5 py-2 text-xs">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-[88%] max-w-sm animate-slide-down flex-col overflow-y-auto bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-xl p-2 text-ink-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 px-4 py-4">
              <SearchBar
                onSearch={(keyword) => {
                  setMobileOpen(false);
                  navigate(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : '/products');
                }}
              />

              {user && (
                <div className="flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Shop</p>
                <div className="grid gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-slate-50"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Categories</p>
                <div className="grid grid-cols-2 gap-1">
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      to={`/products?category=${category.slug}`}
                      className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-400">Account</p>
                <div className="grid gap-1">
                  <Link to={accountLink} className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-slate-50">
                    {user ? 'My profile' : 'Log in'}
                  </Link>
                  <Link to={user ? '/orders' : '/login'} className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-slate-50">
                    My orders
                  </Link>
                  <Link to={user ? '/wishlist' : '/login'} className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-slate-50">
                    Wishlist
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-slate-50">
                      Admin dashboard
                    </Link>
                  )}
                  {!user && (
                    <Link to="/register" className="mt-1 rounded-xl bg-brand-600 px-3 py-2.5 text-center text-sm font-bold text-white">
                      Create an account
                    </Link>
                  )}
                  {user && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      Log out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

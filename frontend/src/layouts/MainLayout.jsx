import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, User, Heart } from 'lucide-react';
import clsx from 'clsx';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollToTop from '../components/ScrollToTop';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const MainLayout = () => {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const bottomLinks = [
    { label: 'Home', to: '/', icon: Home },
    { label: 'Shop', to: '/products', icon: LayoutGrid },
    { label: 'Cart', to: '/cart', icon: ShoppingCart, badge: itemCount },
    { label: 'Wishlist', to: user ? '/wishlist' : '/login', icon: Heart },
    { label: 'Account', to: user ? '/profile' : '/login', icon: User },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <div className="h-16 md:hidden" />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {bottomLinks.map((link) => {
            const Icon = link.icon;
            const active =
              link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to.split('?')[0]);
            return (
              <button
                key={link.label}
                type="button"
                onClick={() => navigate(link.to)}
                className={clsx(
                  'relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition',
                  active ? 'text-brand-700' : 'text-ink-400'
                )}
              >
                <span className="relative">
                  <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
                  {link.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[8px] font-bold text-white">
                      {link.badge > 9 ? '9+' : link.badge}
                    </span>
                  )}
                </span>
                {link.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;

import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Home, Search, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { user } = useAuth();

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 shadow-soft">
          <Compass size={38} strokeWidth={1.7} />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">Error 404</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">This aisle does not exist</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-500">
          The page you are looking for may have moved, been removed, or never existed. Let’s get you back to the good stuff.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/" className="btn-primary px-4 py-3 text-sm">
            <Home size={16} /> Back to home
          </Link>
          <Link to="/products" className="btn-outline px-4 py-3 text-sm">
            <ShoppingBag size={16} /> Browse products
          </Link>
          {user && (
            <Link to="/orders" className="btn-ghost px-4 py-3 text-sm">
              <ArrowLeft size={16} /> My orders
            </Link>
          )}
        </div>

        <div className="mx-auto mt-10 flex max-w-md items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-500">
            <Search size={18} />
          </span>
          <div>
            <p className="text-xs font-bold text-ink-800">Looking for something specific?</p>
            <p className="mt-0.5 text-[11px] leading-5 text-ink-400">
              Use the search bar at the top of the store to find products by name or brand.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

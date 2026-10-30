import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const Logo = ({ compact = false, light = false }) => (
  <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="ShopSphere home">
    <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-glow transition-transform duration-300 group-hover:-rotate-6">
      <ShoppingBag size={20} strokeWidth={2.4} />
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-400" />
    </span>
    {!compact && (
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink-900'}`}>
        Shop<span className="text-brand-600">Sphere</span>
      </span>
    )}
  </Link>
);

export default Logo;

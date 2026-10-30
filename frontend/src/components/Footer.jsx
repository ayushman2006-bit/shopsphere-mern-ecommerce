import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Facebook, Github, Instagram, Mail, MapPin, Phone, Send, ShieldCheck, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const Footer = () => {
  const { user, isAdmin } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubscribe = (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('You are on the list! Watch your inbox for offers.');
    setEmail('');
  };

  return (
    <footer className="mt-16 bg-ink-950 text-white">
      <div className="container-page">
        <div className="grid gap-10 border-b border-white/10 py-12 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
              A modern online shopping experience built around quality products, honest prices and a checkout that respects your time.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://github.com/ayushman2006-bit"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition hover:bg-brand-600 hover:text-white"
              >
                <Github size={16} />
              </a>
              <a
                href="mailto:support@shopsphere.dev"
                aria-label="Email support"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition hover:bg-brand-600 hover:text-white"
              >
                <Mail size={16} />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition hover:bg-brand-600 hover:text-white"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition hover:bg-brand-600 hover:text-white"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><Link to="/products" className="transition hover:text-white">All products</Link></li>
              <li><Link to="/products?sort=newest" className="transition hover:text-white">New arrivals</Link></li>
              <li><Link to="/products?sort=popular" className="transition hover:text-white">Best sellers</Link></li>
              <li><Link to="/products?featured=true" className="transition hover:text-white">Featured deals</Link></li>
              <li><Link to="/cart" className="transition hover:text-white">Shopping cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Account</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><Link to={user ? '/profile' : '/login'} className="transition hover:text-white">{user ? 'My profile' : 'Log in'}</Link></li>
              <li><Link to={user ? '/orders' : '/login'} className="transition hover:text-white">My orders</Link></li>
              <li><Link to={user ? '/wishlist' : '/login'} className="transition hover:text-white">Wishlist</Link></li>
              <li><Link to={user ? '/profile' : '/register'} className="transition hover:text-white">{user ? 'Account settings' : 'Create account'}</Link></li>
              {isAdmin && <li><Link to="/admin" className="transition hover:text-white">Admin dashboard</Link></li>}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Stay in the loop</h3>
            <p className="mt-4 text-sm leading-6 text-white/60">
              Join our newsletter for early access to drops, seasonal offers and curated edits.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4">
              <div className="flex overflow-hidden rounded-xl bg-white/10 p-1 ring-1 ring-white/10 focus-within:ring-brand-400">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/40"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-500"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
            <div className="mt-5 space-y-2 text-xs text-white/50">
              <p className="flex items-center gap-2"><MapPin size={13} /> Bengaluru, India</p>
              <p className="flex items-center gap-2"><Phone size={13} /> +91 90000 00000</p>
              <p className="flex items-center gap-2"><Mail size={13} /> support@shopsphere.dev</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ShopSphere. Built with the MERN stack.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5"><Truck size={13} /> Free delivery over ₹999</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> Secure checkout</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 transition hover:bg-white/20 hover:text-white"
            >
              Back to top <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

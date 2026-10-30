import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import Logo from '../components/Logo';
import { handleImageError, resolveImage } from '../utils/image';

const AuthLayout = () => (
  <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
    <div className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative">
        <Logo light />
        <div className="mt-16 max-w-lg">
          <span className="badge bg-white/10 text-white ring-1 ring-white/15">
            <Sparkles size={12} className="text-accent-300" /> Curated for everyday life
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-5xl">
            Shopping that feels
            <span className="block bg-gradient-to-r from-brand-300 via-white to-accent-200 bg-clip-text text-transparent">
              considered, not chaotic.
            </span>
          </h1>
          <p className="mt-5 text-base leading-7 text-white/60">
            Thousands of thoughtfully selected products, transparent pricing and a checkout built to get out of your way.
          </p>
        </div>

        <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
          {[
            { icon: Truck, title: 'Free delivery', text: 'Orders over ₹999' },
            { icon: ShieldCheck, title: 'Secure', text: 'JWT protected' },
            { icon: CheckCircle2, title: 'Easy returns', text: '7-day window' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur">
              <item.icon size={18} className="text-brand-300" />
              <p className="mt-2 text-xs font-bold text-white">{item.title}</p>
              <p className="text-[10px] text-white/50">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-12 flex items-center gap-4 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
        <img
          src={resolveImage('/uploads/seed/p01-1.jpg')}
          alt="Aurora wireless headphones"
          onError={handleImageError}
          className="h-20 w-20 rounded-2xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-300">Customer favourite</p>
          <p className="mt-1 truncate text-sm font-bold text-white">Aurora ANC Wireless Headphones</p>
          <p className="mt-1 text-xs text-white/50">“The noise cancellation is genuinely excellent.”</p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-accent-300">
            ★★★★★ <span className="text-white/40">4.9 · 128 reviews</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:hidden">
        <Logo />
        <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-brand-700">
          <ArrowLeft size={14} /> Back to store
        </Link>
      </div>
      <div className="hidden justify-end px-8 py-5 lg:flex">
        <Link to="/" className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-brand-700">
          <ArrowLeft size={14} /> Back to store
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
        <div className="w-full max-w-md animate-slide-up">
          <Outlet />
        </div>
      </div>
      <p className="pb-6 text-center text-[11px] text-ink-400">
        © {new Date().getFullYear()} ShopSphere · Secure account access
      </p>
    </div>
  </div>
);

export default AuthLayout;

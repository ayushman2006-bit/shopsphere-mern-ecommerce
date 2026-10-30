import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  Zap,
} from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';
import { ProductCardSkeleton } from '../components/ProductCard';
import ErrorState from '../components/ErrorState';
import { categoryService } from '../services/category.service';
import { productService } from '../services/product.service';
import { formatCurrency, getDiscountPercent, getProductPrice } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';

const trustItems = [
  { icon: Truck, title: 'Free delivery', text: 'On all orders above ₹999' },
  { icon: RotateCcw, title: '7-day returns', text: 'Easy, no-questions returns' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'JWT-protected payments' },
  { icon: BadgeCheck, title: 'Genuine products', text: 'Curated and quality checked' },
];

const SectionHeading = ({ eyebrow, title, description, to = '/products', action = 'View all' }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>}
      <h2 className="section-heading">{title}</h2>
      {description && <p className="mt-1.5 max-w-xl text-sm text-ink-500">{description}</p>}
    </div>
    <Link to={to} className="group inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-900">
      {action}
      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  </div>
);

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newest, setNewest] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryData, featuredData, trendingData, newestData, metaData] = await Promise.all([
        categoryService.list(),
        productService.list({ featured: true, limit: 8, sort: 'popular' }),
        productService.list({ trending: true, limit: 4, sort: 'popular' }),
        productService.list({ limit: 4, sort: 'newest' }),
        productService.meta(),
      ]);
      setCategories(categoryData.categories || []);
      setFeatured(featuredData.products || []);
      setTrending(trendingData.products || []);
      setNewest(newestData.products || []);
      setMeta(metaData);
    } catch (err) {
      setError(err?.response?.data?.message || 'We could not load the storefront. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deal = useMemo(() => {
    const pool = [...featured, ...trending, ...newest];
    if (!pool.length) return null;
    return pool.reduce((best, product) => {
      const discount = getDiscountPercent(product.price, product.discountPrice);
      return discount > best.discount ? { product, discount } : best;
    }, { product: pool[0], discount: getDiscountPercent(pool[0].price, pool[0].discountPrice) });
  }, [featured, trending, newest]);

  const heroImages = useMemo(() => {
    const images = featured.flatMap((product) => product.images?.slice(0, 1) || []).slice(0, 3);
    return images.length ? images : ['/uploads/seed/p01-1.jpg', '/uploads/seed/p02-1.jpg', '/uploads/seed/p10-1.jpg'];
  }, [featured]);

  const productCount = meta?.total || 0;
  const categoryCount = categories.length;

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState title="The storefront is taking a break" message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />

        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="animate-slide-up">
            <span className="badge bg-white/10 text-white ring-1 ring-white/15">
              <Sparkles size={12} className="text-accent-300" /> New season, considered essentials
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
              Shop smarter.
              <span className="block bg-gradient-to-r from-brand-300 via-white to-accent-200 bg-clip-text text-transparent">
                Live better.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/60 sm:text-base">
              Discover {productCount > 0 ? `${productCount}+` : 'a curated selection of'} products across {categoryCount || 6} categories — honest prices, fast delivery and a checkout that respects your time.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/products" className="btn bg-white px-6 py-3 text-ink-900 hover:bg-brand-50">
                Shop the catalogue <ArrowRight size={16} />
              </Link>
              <Link to="/products?featured=true" className="btn border border-white/20 bg-white/5 px-6 py-3 text-white hover:bg-white/10">
                Explore featured deals <Zap size={16} className="text-accent-300" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><Truck size={14} className="text-brand-300" /> Free delivery over ₹999</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-300" /> Secure checkout</span>
              <span className="flex items-center gap-1.5"><RotateCcw size={14} className="text-brand-300" /> 7-day returns</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
              <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
                <img
                  src={resolveImage(heroImages[0])}
                  alt="Featured product"
                  onError={handleImageError}
                  className="h-56 w-full object-cover sm:h-72"
                />
              </div>
              <div className="mt-8 space-y-3 sm:mt-12 sm:space-y-4">
                <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
                  <img
                    src={resolveImage(heroImages[1])}
                    alt="Featured product"
                    onError={handleImageError}
                    className="h-32 w-full object-cover sm:h-40"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
                  <img
                    src={resolveImage(heroImages[2])}
                    alt="Featured product"
                    onError={handleImageError}
                    className="h-40 w-full object-cover sm:h-48"
                  />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-2.5 shadow-lift backdrop-blur sm:left-auto sm:right-6 sm:translate-x-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <PackageCheck size={16} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Dispatch promise</p>
                <p className="text-xs font-bold text-white">Same-day dispatch before 4 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container-page grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-slate-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">{item.title}</p>
                <p className="text-[11px] text-ink-400">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12 sm:py-14">
        <SectionHeading
          eyebrow="Browse by category"
          title="Find your next favourite"
          description="Six carefully edited departments, each with products chosen for quality and value."
          to="/products"
          action="All products"
        />
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton min-h-[180px]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category._id} category={category} />
            ))}
          </div>
        )}
      </section>

      {/* Featured products */}
      <section className="bg-white py-12 sm:py-14">
        <div className="container-page">
          <SectionHeading
            eyebrow="Handpicked for you"
            title="Featured this week"
            description="The products our team keeps coming back to — and customers keep reordering."
            to="/products?featured=true"
          />
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <ProductGrid products={featured} skeletonCount={8} />
          )}
        </div>
      </section>

      {/* Promo banner */}
      {deal && (
        <section className="container-page py-10 sm:py-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 text-white shadow-lift">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="relative grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <span className="badge bg-white/15 text-white ring-1 ring-white/20">
                  <Tag size={12} /> Deal of the week
                </span>
                <h2 className="mt-4 max-w-xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                  Up to {deal.discount || 20}% off {deal.product.name}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/70">
                  Now {formatCurrency(getProductPrice(deal.product))} — down from {formatCurrency(deal.product.price)}. While stocks last.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to={`/products/${deal.product._id}`} className="btn bg-white px-5 py-2.5 text-ink-900 hover:bg-brand-50">
                    Shop the deal <ArrowRight size={15} />
                  </Link>
                  <Link to="/products?sort=price_asc" className="btn border border-white/25 bg-white/5 px-5 py-2.5 text-white hover:bg-white/10">
                    Browse budget picks
                  </Link>
                </div>
              </div>
              <div className="hidden justify-self-end lg:block">
                <img
                  src={resolveImage(deal.product.images?.[0])}
                  alt={deal.product.name}
                  onError={handleImageError}
                  className="h-56 w-56 rotate-3 rounded-3xl object-cover shadow-2xl ring-4 ring-white/20 transition hover:rotate-0"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="container-page py-4 sm:py-6">
        <SectionHeading
          eyebrow="Trending now"
          title="What everyone is buying"
          description="Ranked by real sales and customer interest across the store."
          to="/products?sort=popular"
        />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <ProductGrid products={trending} skeletonCount={4} />
        )}
      </section>

      {/* New arrivals + editorial */}
      <section className="container-page py-12 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <SectionHeading
              eyebrow="Just landed"
              title="New arrivals"
              description="Fresh additions to the catalogue, updated as new stock arrives."
              to="/products?sort=newest"
            />
            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <ProductGrid products={newest} skeletonCount={4} className="xl:grid-cols-2" />
            )}
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-7 text-white shadow-card sm:p-9">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-600/30 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <span className="badge bg-white/10 text-white ring-1 ring-white/15">
                <Headphones size={12} className="text-accent-300" /> Need a hand?
              </span>
              <h2 className="mt-4 text-2xl font-extrabold leading-tight text-white">
                We are here to help you choose well.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Questions about compatibility, sizing or delivery? Our support team replies within one business day.
              </p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="flex items-center gap-2 text-white/70"><MailIcon /> support@shopsphere.dev</p>
                <p className="flex items-center gap-2 text-white/70"><PhoneIcon /> +91 90000 00000</p>
              </div>
              <div className="mt-auto pt-8">
                <Link to="/profile" className="btn bg-white px-5 py-2.5 text-ink-900 hover:bg-brand-50">
                  Manage your account <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-300">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-300">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

export default Home;

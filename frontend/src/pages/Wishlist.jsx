import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import RatingStars from '../components/RatingStars';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency, getProductPrice } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';

const Wishlist = () => {
  const { products, loading, remove, moveToCart } = useWishlist();

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs current="Wishlist" />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Saved for later</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            My wishlist <span className="text-base font-semibold text-ink-400">({products.length} item{products.length === 1 ? '' : 's'})</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">Keep an eye on the things you love and move them to your cart when you are ready.</p>
        </div>
        <Link to="/products" className="btn-outline px-3.5 py-2.5 text-xs">Browse more products</Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <div className="skeleton aspect-square rounded-none" />
                <div className="space-y-3 p-4">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for later. Your wishlist is tied to your account."
            actionLabel="Discover products"
            actionTo="/products"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const outOfStock = product.stock < 1;
              return (
                <article key={product._id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
                  <div className="relative aspect-square overflow-hidden bg-slate-50">
                    <Link to={`/products/${product._id}`} aria-label={product.name}>
                      <img
                        src={resolveImage(product.images?.[0])}
                        alt={product.name}
                        loading="lazy"
                        onError={handleImageError}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(product._id)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-ink-400 shadow-sm backdrop-blur transition hover:scale-105 hover:text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                    {outOfStock && (
                      <span className="absolute inset-x-0 bottom-0 bg-ink-950/70 py-2 text-center text-xs font-semibold text-white">Out of stock</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{product.brand || 'ShopSphere'}</p>
                    <Link to={`/products/${product._id}`} className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-ink-900 transition hover:text-brand-700">
                      {product.name}
                    </Link>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <RatingStars rating={product.ratings} size={12} showValue count={product.numReviews} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-ink-900">{formatCurrency(getProductPrice(product))}</span>
                      {product.discountPrice && product.discountPrice < product.price && (
                        <span className="text-xs text-ink-400 line-through">{formatCurrency(product.price)}</span>
                      )}
                    </div>
                    <div className="mt-auto flex gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => moveToCart(product._id)}
                        disabled={outOfStock}
                        className="btn-primary flex-1 px-3 py-2 text-xs"
                      >
                        <ShoppingCart size={14} /> {outOfStock ? 'Out of stock' : 'Move to cart'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(product._id)}
                        aria-label="Remove from wishlist"
                        className="btn-outline px-3 py-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

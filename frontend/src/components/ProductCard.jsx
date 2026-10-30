import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency, getDiscountPercent, getProductPrice } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';

const ProductCard = ({ product, className = '' }) => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [adding, setAdding] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  if (!product) return null;

  const price = getProductPrice(product);
  const discount = getDiscountPercent(product.price, product.discountPrice);
  const wishlisted = isWishlisted(product._id);
  const outOfStock = product.stock < 1;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const isNew = product.createdAt && Date.now() - new Date(product.createdAt).getTime() < 14 * 24 * 60 * 60 * 1000;

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAdding(true);
    await addItem(product, 1);
    setAdding(false);
  };

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setWishBusy(true);
    await toggle(product._id);
    setWishBusy(false);
  };

  return (
    <article
      className={clsx(
        'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-100 hover:shadow-card',
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <Link to={`/products/${product._id}`} aria-label={product.name}>
          <img
            src={resolveImage(product.images?.[0])}
            alt={product.name}
            loading="lazy"
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="badge bg-rose-500 text-white shadow-sm">{discount}% off</span>
          )}
          {isNew && discount === 0 && <span className="badge bg-brand-600 text-white shadow-sm">New</span>}
        </div>

        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishBusy}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={clsx(
            'absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-105',
            wishlisted ? 'border-rose-100 text-rose-500' : 'border-slate-100 text-ink-400 hover:text-rose-500'
          )}
        >
          <Heart size={17} className={wishlisted ? 'fill-rose-500' : ''} />
        </button>

        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-ink-950/70 py-2 text-center text-xs font-semibold text-white backdrop-blur-sm">
            Out of stock
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            {product.brand || product.category?.name || 'ShopSphere'}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-600">
            <Star size={12} className="fill-accent-400 text-accent-400" />
            {Number(product.ratings || 0).toFixed(1)}
            <span className="font-normal text-ink-400">({product.numReviews || 0})</span>
          </span>
        </div>

        <Link to={`/products/${product._id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-ink-900 transition hover:text-brand-700">
          {product.name}
        </Link>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-extrabold text-ink-900">{formatCurrency(price)}</span>
          {product.discountPrice && product.discountPrice < product.price && (
            <span className="text-xs font-medium text-ink-400 line-through">{formatCurrency(product.price)}</span>
          )}
        </div>

        <div className="mt-auto pt-3">
          {lowStock && (
            <p className="mb-2 text-[11px] font-semibold text-rose-600">Only {product.stock} left — order soon</p>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock || adding}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50 py-2.5 text-xs font-bold text-brand-700 transition hover:border-brand-600 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-ink-400"
          >
            <ShoppingCart size={15} />
            {outOfStock ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
};

export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-soft">
    <div className="skeleton aspect-square rounded-none" />
    <div className="space-y-3 p-4">
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-4 w-5/6" />
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-5 w-1/2" />
      <div className="skeleton h-9 w-full" />
    </div>
  </div>
);

export default ProductCard;

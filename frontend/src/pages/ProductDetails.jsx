import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmationModal from '../components/ConfirmationModal';
import ErrorState from '../components/ErrorState';
import Price from '../components/Price';
import ProductGrid from '../components/ProductGrid';
import QuantitySelector from '../components/QuantitySelector';
import RatingStars from '../components/RatingStars';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productService } from '../services/product.service';
import { reviewService } from '../services/review.service';
import { getApiError } from '../services/api';
import { formatDate, getInitials } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, numReviews: 0, distribution: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');
  const [adding, setAdding] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [editingReview, setEditingReview] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);

  const loadReviews = useCallback(async (productId) => {
    setReviewsLoading(true);
    try {
      const data = await reviewService.list(productId, { limit: 50 });
      setReviews(data.reviews || []);
      setReviewStats({
        averageRating: data.averageRating || 0,
        numReviews: data.numReviews || 0,
        distribution: data.distribution || [],
      });
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await productService.get(id);
      setProduct(data.product);
      setActiveImage(0);
      setQuantity(1);
      setTab('description');
      setEditingReview(null);
      setReviewForm({ rating: 5, title: '', comment: '' });
      loadReviews(data.product._id);
      productService
        .related(data.product._id)
        .then((relatedData) => setRelated(relatedData.products || []))
        .catch(() => setRelated([]));
    } catch (err) {
      setError(getApiError(err, 'This product could not be found.'));
    } finally {
      setLoading(false);
    }
  }, [id, loadReviews]);

  useEffect(() => {
    load();
  }, [load]);

  const ownReview = useMemo(
    () => (user ? reviews.find((review) => String(review.user?._id || review.user) === String(user._id)) : null),
    [reviews, user]
  );

  if (loading) return <LoadingSpinner fullPage label="Loading product details…" />;

  if (error || !product) {
    return (
      <div className="container-page py-12">
        <Breadcrumbs items={[{ label: 'Shop', to: '/products' }]} current="Product" />
        <ErrorState
          className="mt-6"
          title="We could not open this product"
          message={error || 'The product may have been removed from the catalogue.'}
          onRetry={load}
        />
        <div className="mt-6 text-center">
          <Link to="/products" className="btn-primary">Back to the catalogue</Link>
        </div>
      </div>
    );
  }

  const price = product.finalPrice ?? product.discountPrice ?? product.price;
  const discount = product.discountPercent || 0;
  const outOfStock = product.stock < 1;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const wishlisted = isWishlisted(product._id);
  const images = product.images?.length ? product.images : ['/placeholder.svg'];

  const handleAddToCart = async () => {
    setAdding(true);
    const added = await addItem(product, quantity);
    setAdding(false);
    return added;
  };

  const handleBuyNow = async () => {
    const added = await handleAddToCart();
    if (added) navigate(user ? '/checkout' : '/cart');
  };

  const handleWishlist = async () => {
    if (!user) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setWishBusy(true);
    await toggle(product._id);
    setWishBusy(false);
  };

  const startEditReview = () => {
    if (!ownReview) return;
    setEditingReview(ownReview);
    setReviewForm({
      rating: ownReview.rating,
      title: ownReview.title || '',
      comment: ownReview.comment || '',
    });
    setTab('reviews');
    window.setTimeout(() => {
      document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const cancelEditReview = () => {
    setEditingReview(null);
    setReviewForm({ rating: 5, title: '', comment: '' });
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (reviewForm.comment.trim().length < 3) {
      toast.error('Please write at least 3 characters');
      return;
    }
    setSubmittingReview(true);
    try {
      if (editingReview) {
        await reviewService.update(editingReview._id, reviewForm);
        toast.success('Your review has been updated');
      } else {
        await reviewService.create(product._id, reviewForm);
        toast.success('Thanks for reviewing this product');
      }
      cancelEditReview();
      await loadReviews(product._id);
      const refreshed = await productService.get(product._id);
      setProduct(refreshed.product);
    } catch (err) {
      toast.error(getApiError(err, 'Could not submit your review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;
    setDeletingReview(true);
    try {
      await reviewService.remove(reviewToDelete._id);
      toast.success('Review deleted');
      setReviewToDelete(null);
      await loadReviews(product._id);
      const refreshed = await productService.get(product._id);
      setProduct(refreshed.product);
    } catch (err) {
      toast.error(getApiError(err, 'Could not delete the review'));
    } finally {
      setDeletingReview(false);
    }
  };

  const totalRatings = reviewStats.distribution.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: 'Shop', to: '/products' },
          ...(product.category ? [{ label: product.category.name, to: `/products?category=${product.category.slug}` }] : []),
        ]}
        current={product.name}
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.05fr_1fr] xl:gap-12">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft">
            <img
              src={resolveImage(images[activeImage])}
              alt={product.name}
              onError={handleImageError}
              className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {discount > 0 && <span className="badge bg-rose-500 text-white shadow-sm">{discount}% off</span>}
              {product.isFeatured && <span className="badge bg-brand-600 text-white shadow-sm">Featured</span>}
            </div>
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishBusy}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={clsx(
                'absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-105',
                wishlisted ? 'border-rose-100 text-rose-500' : 'border-slate-100 text-ink-400 hover:text-rose-500'
              )}
            >
              <Heart size={19} className={wishlisted ? 'fill-rose-500' : ''} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  className={clsx(
                    'overflow-hidden rounded-xl border-2 bg-white transition',
                    activeImage === index ? 'border-brand-600 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                >
                  <img
                    src={resolveImage(image)}
                    alt={`${product.name} view ${index + 1}`}
                    onError={handleImageError}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Truck, label: 'Free delivery', text: 'Over ₹999' },
              { icon: RotateCcw, label: '7-day returns', text: 'Easy returns' },
              { icon: ShieldCheck, label: 'Secure', text: 'Protected' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-100 bg-white px-2 py-3">
                <item.icon size={17} className="mx-auto text-brand-600" />
                <p className="mt-1.5 text-[11px] font-bold text-ink-800">{item.label}</p>
                <p className="text-[10px] text-ink-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">{product.brand || 'ShopSphere'}</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingStars rating={product.ratings} showValue count={product.numReviews} />
            <button
              type="button"
              onClick={() => {
                setTab('reviews');
                document.getElementById('product-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              {product.numReviews > 0 ? `Read ${product.numReviews} review${product.numReviews === 1 ? '' : 's'}` : 'Be the first to review'}
            </button>
            {product.soldCount > 0 && <span className="text-xs text-ink-400">· {product.soldCount} sold</span>}
          </div>

          <div className="mt-5">
            <Price price={product.price} discountPrice={product.discountPrice} size="lg" />
            <p className="mt-1 text-[11px] text-ink-400">Inclusive of all taxes · Free delivery over ₹999</p>
          </div>

          <p className="mt-5 text-sm leading-7 text-ink-600">{product.shortDescription || product.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {outOfStock ? (
              <span className="badge bg-rose-50 text-rose-700 ring-1 ring-rose-100">Out of stock</span>
            ) : lowStock ? (
              <span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-100">Only {product.stock} left in stock</span>
            ) : (
              <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <Check size={12} /> In stock · {product.stock} available
              </span>
            )}
            <span className="badge bg-slate-100 text-slate-600">
              <PackageCheck size={12} /> Dispatch in 24 hours
            </span>
          </div>

          {product.highlights?.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.highlights.slice(0, 4).map((highlight) => (
                <li key={highlight} className="flex items-start gap-2 text-sm text-ink-600">
                  <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  {highlight}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">Quantity</p>
                <QuantitySelector value={quantity} onChange={setQuantity} max={Math.max(product.stock, 1)} disabled={outOfStock} />
              </div>
              <div className="flex flex-1 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock || adding}
                  className="btn-outline min-w-[150px] flex-1 py-3"
                >
                  <ShoppingCart size={17} />
                  {adding ? 'Adding…' : 'Add to cart'}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={outOfStock || adding}
                  className="btn-primary min-w-[150px] flex-1 py-3"
                >
                  <Zap size={17} /> Buy now
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishBusy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-100 py-2.5 text-xs font-bold text-ink-500 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
            >
              <Heart size={15} className={wishlisted ? 'fill-rose-500 text-rose-500' : ''} />
              {wishlisted ? 'Saved to wishlist' : 'Save to wishlist'}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-ink-800"><Truck size={15} className="text-brand-600" /> Delivery</p>
              <p className="mt-1.5 text-[11px] leading-5 text-ink-500">Free delivery on orders above ₹999. Otherwise a flat ₹49 shipping fee applies at checkout.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-ink-800"><RotateCcw size={15} className="text-brand-600" /> Returns</p>
              <p className="mt-1.5 text-[11px] leading-5 text-ink-500">Cancel while pending or processing. Return within 7 days of delivery in original packaging.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div id="product-tabs" className="mt-12 scroll-mt-28">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 no-scrollbar">
          {[
            { key: 'description', label: 'Description' },
            { key: 'highlights', label: 'Highlights' },
            { key: 'reviews', label: `Reviews (${reviewStats.numReviews || product.numReviews || 0})` },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={clsx(
                'relative whitespace-nowrap px-4 py-3 text-sm font-bold transition',
                tab === item.key ? 'text-brand-700' : 'text-ink-400 hover:text-ink-700'
              )}
            >
              {item.label}
              {tab === item.key && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === 'description' && (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-lg font-bold text-ink-900">About this product</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-600">{product.description}</p>
              </div>
              <div className="card p-5">
                <h3 className="text-sm font-bold text-ink-900">Specifications</h3>
                <dl className="mt-3 space-y-2.5 text-sm">
                  {[
                    ['Brand', product.brand || 'ShopSphere'],
                    ['Category', product.category?.name || '—'],
                    ['SKU', product.slug?.toUpperCase() || product._id?.slice(-8)],
                    ['Availability', outOfStock ? 'Out of stock' : `${product.stock} in stock`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <dt className="text-ink-400">{label}</dt>
                      <dd className="text-right font-semibold text-ink-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {tab === 'highlights' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(product.highlights?.length ? product.highlights : ['Quality checked by the ShopSphere team', 'Secure packaging on every order', 'Backed by our 7-day return policy']).map((highlight) => (
                <div key={highlight} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Check size={15} />
                  </span>
                  <p className="pt-0.5 text-sm text-ink-600">{highlight}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <div className="space-y-4">
                <div className="card p-5 text-center">
                  <p className="text-4xl font-extrabold text-ink-900">{(reviewStats.averageRating || product.ratings || 0).toFixed(1)}</p>
                  <RatingStars rating={reviewStats.averageRating || product.ratings} className="mt-2 justify-center" size={17} />
                  <p className="mt-1 text-xs text-ink-400">{reviewStats.numReviews || product.numReviews || 0} verified reviews</p>

                  <div className="mt-4 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewStats.distribution.find((entry) => entry.rating === rating)?.count || 0;
                      const percent = totalRatings ? Math.round((count / totalRatings) * 100) : 0;
                      return (
                        <div key={rating} className="flex items-center gap-2 text-[11px] text-ink-400">
                          <span className="flex w-8 items-center gap-0.5">{rating} <Star size={9} className="fill-accent-400 text-accent-400" /></span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-accent-400" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs leading-5 text-brand-800">
                  <p className="font-bold">Reviews are tied to accounts</p>
                  <p className="mt-1 text-brand-700/80">One review per customer per product. Verified purchases are marked automatically.</p>
                </div>
              </div>

              <div>
                {!user && (
                  <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
                    <p className="text-sm font-bold text-ink-900">Want to share your experience?</p>
                    <p className="mt-1 text-xs text-ink-500">Log in to write a review for this product.</p>
                    <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="btn-primary mt-4">
                      Log in to review
                    </Link>
                  </div>
                )}

                {user && (!ownReview || editingReview) && (
                  <form id="review-form" onSubmit={submitReview} className="card mb-6 p-5">
                    <h3 className="text-sm font-bold text-ink-900">{editingReview ? 'Edit your review' : 'Write a review'}</h3>
                    <div className="mt-3">
                      <span className="label">Your rating</span>
                      <RatingStars
                        interactive
                        rating={reviewForm.rating}
                        onChange={(rating) => setReviewForm((current) => ({ ...current, rating }))}
                      />
                    </div>
                    <div className="mt-3">
                      <label htmlFor="review-title" className="label">Title <span className="font-normal normal-case text-ink-300">(optional)</span></label>
                      <input
                        id="review-title"
                        value={reviewForm.title}
                        onChange={(event) => setReviewForm((current) => ({ ...current, title: event.target.value }))}
                        maxLength={120}
                        placeholder="Summarise your experience"
                        className="input"
                      />
                    </div>
                    <div className="mt-3">
                      <label htmlFor="review-comment" className="label">Your review</label>
                      <textarea
                        id="review-comment"
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                        rows={4}
                        maxLength={1000}
                        placeholder="What did you like or dislike? How did you use the product?"
                        className="input resize-none"
                        required
                      />
                      <p className="mt-1 text-right text-[10px] text-ink-400">{reviewForm.comment.length}/1000</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="submit" disabled={submittingReview} className="btn-primary">
                        {submittingReview ? 'Submitting…' : editingReview ? 'Save changes' : 'Submit review'}
                      </button>
                      {editingReview && (
                        <button type="button" onClick={cancelEditReview} className="btn-outline">Cancel</button>
                      )}
                    </div>
                  </form>
                )}

                {ownReview && !editingReview && (
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                    <p className="text-sm font-semibold text-brand-800">You have already reviewed this product.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={startEditReview} className="btn-outline px-3 py-2 text-xs">Edit review</button>
                      <button type="button" onClick={() => setReviewToDelete(ownReview)} className="btn-danger px-3 py-2 text-xs">Delete</button>
                    </div>
                  </div>
                )}

                {reviewsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="skeleton h-28" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    <Star size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-ink-900">No reviews yet</p>
                    <p className="mt-1 text-xs text-ink-500">Be the first to share what you think about this product.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <article key={review._id} className="card p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                            {getInitials(review.user?.name || 'ShopSphere customer')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-ink-900">{review.user?.name || 'ShopSphere customer'}</p>
                              {review.isVerifiedPurchase && (
                                <span className="badge bg-emerald-50 text-emerald-700">
                                  <BadgeCheck size={11} /> Verified purchase
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <RatingStars rating={review.rating} size={13} />
                              <span className="text-[11px] text-ink-400">{formatDate(review.createdAt)}</span>
                            </div>
                            {review.title && <p className="mt-2 text-sm font-bold text-ink-800">{review.title}</p>}
                            <p className="mt-1 text-sm leading-6 text-ink-600">{review.comment}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8 border-t border-slate-100 pt-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">You may also like</p>
              <h2 className="mt-1 text-xl font-extrabold text-ink-900 sm:text-2xl">Similar products</h2>
            </div>
            <Link to={`/products?category=${product.category?.slug || ''}`} className="text-sm font-bold text-brand-700 hover:text-brand-900">
              More in {product.category?.name || 'this category'}
            </Link>
          </div>
          <ProductGrid products={related} skeletonCount={4} />
        </section>
      )}

      <ConfirmationModal
        open={Boolean(reviewToDelete)}
        title="Delete this review?"
        message="Your review and rating will be removed from this product. This cannot be undone."
        confirmLabel="Delete review"
        danger
        loading={deletingReview}
        onClose={() => setReviewToDelete(null)}
        onConfirm={confirmDeleteReview}
      />
    </div>
  );
};

export default ProductDetails;

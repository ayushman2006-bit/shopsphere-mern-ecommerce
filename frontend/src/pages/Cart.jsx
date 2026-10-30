import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  Minus,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import QuantitySelector from '../components/QuantitySelector';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatCurrency, getProductPrice } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/constants';

const Cart = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const { add } = useWishlist();
  const navigate = useNavigate();
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  if (loading) return <LoadingSpinner fullPage label="Loading your cart…" />;

  const subtotal = cart.subtotal || 0;
  const shipping = cart.shippingEstimate || 0;
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const stockIssue = cart.items.some((item) => item.product.stock < 1 || item.quantity > item.product.stock);

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    await removeItem(productId);
    setRemovingId(null);
  };

  const handleMoveToWishlist = async (productId) => {
    if (!user) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    const added = await add(productId);
    if (added) await removeItem(productId);
  };

  const handleClear = async () => {
    setClearing(true);
    const cleared = await clearCart();
    setClearing(false);
    if (cleared) setClearOpen(false);
  };

  if (!cart.items.length) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs current="Shopping cart" />
        <div className="mx-auto mt-10 max-w-2xl">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you have not added anything yet. Explore the catalogue and find something you love."
            actionLabel="Start shopping"
            actionTo="/products"
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Truck, title: 'Free delivery', text: 'On orders over ₹999' },
              { icon: RotateCcw, title: '7-day returns', text: 'On eligible products' },
              { icon: ShieldCheck, title: 'Secure checkout', text: 'Your data is protected' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3.5">
                <item.icon size={18} className="text-brand-600" />
                <div>
                  <p className="text-xs font-bold text-ink-800">{item.title}</p>
                  <p className="text-[10px] text-ink-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs current="Shopping cart" />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Your bag</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            Shopping cart <span className="text-base font-semibold text-ink-400">({cart.totalItems} item{cart.totalItems === 1 ? '' : 's'})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setClearOpen(true)} className="btn-ghost px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">
            <Trash2 size={14} /> Clear cart
          </button>
          <Link to="/products" className="btn-outline px-3 py-2 text-xs">Continue shopping</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {remainingForFreeShipping > 0 ? (
            <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-brand-800">
                <Truck size={15} /> Add {formatCurrency(remainingForFreeShipping)} more for free delivery
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <PackageCheck size={15} /> You have unlocked free delivery
              </p>
            </div>
          )}

          {stockIssue && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              Some quantities exceed current stock. Please update your cart before checking out.
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
            {cart.items.map((item, index) => {
              const { product, quantity, lineTotal } = item;
              const price = getProductPrice(product);
              const lowStock = product.stock > 0 && product.stock <= 5;
              return (
                <div
                  key={product._id}
                  className={`flex gap-4 p-4 sm:p-5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                >
                  <Link to={`/products/${product._id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-28">
                    <img
                      src={resolveImage(product.images?.[0])}
                      alt={product.name}
                      onError={handleImageError}
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">{product.brand || 'ShopSphere'}</p>
                        <Link to={`/products/${product._id}`} className="mt-0.5 line-clamp-2 text-sm font-bold text-ink-900 transition hover:text-brand-700">
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-ink-400">
                          {formatCurrency(price)} each
                          {product.stock > 0 && <span className="ml-2 text-emerald-600">· In stock</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(product._id)}
                        disabled={removingId === product._id}
                        aria-label={`Remove ${product.name} from cart`}
                        className="rounded-lg p-1.5 text-ink-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    {product.stock < 1 ? (
                      <p className="mt-2 text-xs font-bold text-rose-600">Out of stock — remove this item to continue</p>
                    ) : lowStock ? (
                      <p className="mt-2 text-xs font-semibold text-amber-600">Only {product.stock} left</p>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                      <div className="flex items-center gap-3">
                        <QuantitySelector
                          value={quantity}
                          onChange={(value) => updateItem(product._id, value)}
                          max={Math.max(product.stock, 1)}
                          disabled={product.stock < 1}
                          size="sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveToWishlist(product._id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-ink-400 transition hover:text-rose-500"
                        >
                          <Heart size={13} /> Save for later
                        </button>
                      </div>
                      <p className="text-base font-extrabold text-ink-900">{formatCurrency(lineTotal)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-ink-500">
            <span className="flex items-center gap-2"><RotateCcw size={14} className="text-brand-600" /> Easy 7-day returns on eligible items</span>
            <Link to="/products" className="font-semibold text-brand-700 hover:text-brand-900">Add more items</Link>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-ink-900">Order summary</h2>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              <div className="flex items-center justify-between text-ink-600">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span className="font-semibold text-ink-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-ink-600">
                <span>Delivery</span>
                <span className={shipping === 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-ink-900'}>
                  {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex items-center justify-between text-ink-400">
                <span>Taxes</span>
                <span className="text-xs">Included</span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-900">Total</span>
                  <span className="text-xl font-extrabold text-ink-900">{formatCurrency(total)}</span>
                </div>
                {shipping > 0 && (
                  <p className="mt-1 text-[11px] text-ink-400">Add {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotal)} more to save {formatCurrency(SHIPPING_FEE)} on delivery.</p>
                )}
              </div>
            </div>
            <div className="space-y-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                disabled={stockIssue}
                className="btn-primary w-full py-3"
              >
                Proceed to checkout <ArrowRight size={16} />
              </button>
              {!user && (
                <p className="text-center text-[11px] text-ink-400">You will be asked to log in before placing the order.</p>
              )}
              <Link to="/products" className="btn-outline w-full py-2.5 text-xs">
                Continue shopping
              </Link>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Coupons at checkout</p>
              <div className="flex flex-wrap gap-1.5">
                {['SAVE10', 'WELCOME100', 'FREESHIP'].map((code) => (
                  <span key={code} className="rounded-md border border-dashed border-brand-200 bg-white px-2 py-1 text-[10px] font-bold text-brand-700">{code}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2.5 rounded-2xl border border-slate-100 bg-white p-4 text-xs text-ink-500">
            <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-brand-600" /> Secure JWT-protected checkout</p>
            <p className="flex items-center gap-2"><Truck size={14} className="text-brand-600" /> Dispatch within 24 hours</p>
            <p className="flex items-center gap-2"><PackageCheck size={14} className="text-brand-600" /> Carefully packed, every time</p>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={clearOpen}
        title="Clear your cart?"
        message="This will remove every item from your cart. You can always add them back later."
        confirmLabel="Clear cart"
        danger
        loading={clearing}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClear}
      />
    </div>
  );
};

export default Cart;

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  CreditCard,
  Lock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Tag,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { couponService } from '../services/coupon.service';
import { orderService } from '../services/order.service';
import { getApiError } from '../services/api';
import { formatCurrency } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/constants';

const emptyAddress = {
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

const Checkout = () => {
  const { user, updateProfile } = useAuth();
  const { cart, loading, refreshCart } = useCart();
  const navigate = useNavigate();

  const [address, setAddress] = useState(() => ({
    ...emptyAddress,
    fullName: user?.name || user?.address?.fullName || '',
    phone: user?.phone || user?.address?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India',
  }));
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [saveAddress, setSaveAddress] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    couponService
      .list()
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]));
  }, []);

  const subtotal = cart.subtotal || 0;
  const discount = coupon?.discount || 0;
  const shipping = coupon?.freeShipping ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shipping);

  if (loading) return <LoadingSpinner fullPage label="Preparing checkout…" />;

  if (!cart.items.length) {
    return (
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }]} current="Checkout" />
        <div className="mx-auto mt-8 max-w-2xl">
          <EmptyState
            icon={PackageCheck}
            title="Nothing to check out yet"
            description="Your cart is empty. Add a few products before placing an order."
            actionLabel="Browse products"
            actionTo="/products"
          />
        </div>
      </div>
    );
  }

  const stockIssue = cart.items.some((item) => item.product.stock < 1 || item.quantity > item.product.stock);

  const updateField = (key, value) => setAddress((current) => ({ ...current, [key]: value }));

  const applyCoupon = async (code = couponInput) => {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) {
      toast.error('Enter a coupon code');
      return;
    }
    setCouponBusy(true);
    try {
      const data = await couponService.validate(clean, subtotal);
      setCoupon(data.coupon);
      setCouponInput(data.coupon.code);
      toast.success(`Coupon applied — ${data.coupon.description}`);
    } catch (err) {
      toast.error(getApiError(err, 'This coupon could not be applied'));
      setCoupon(null);
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    toast.success('Coupon removed');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (stockIssue) {
      toast.error('Please fix the stock issues in your cart first');
      return;
    }
    if (!address.fullName.trim() || !address.phone.trim() || !address.street.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
      toast.error('Please complete every required address field');
      return;
    }

    setPlacing(true);
    try {
      const data = await orderService.create({
        shippingAddress: address,
        paymentMethod,
        couponCode: coupon?.code || '',
      });

      if (saveAddress) {
        try {
          await updateProfile({ phone: address.phone, address });
        } catch {
          // The order is already placed; saving the address is a convenience only.
        }
      }

      await refreshCart();
      toast.success('Order placed successfully');
      navigate(`/order-confirmation/${data.order._id}`, { replace: true, state: { order: data.order } });
    } catch (err) {
      toast.error(getApiError(err, 'We could not place your order. Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }]} current="Checkout" />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Almost there</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Secure checkout</h1>
          <p className="mt-1 text-sm text-ink-500">Confirm your delivery details and choose how you would like to pay.</p>
        </div>
        <Link to="/cart" className="btn-ghost px-3 py-2 text-xs">
          <ArrowLeft size={14} /> Back to cart
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Address */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><MapPin size={16} /></span>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Delivery address</h2>
                <p className="text-[11px] text-ink-400">Where should we send your order?</p>
              </div>
              <span className="ml-auto badge bg-slate-100 text-slate-500">Step 1 of 2</span>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label>
                <span className="label">Full name *</span>
                <input value={address.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="input" placeholder="Your full name" required />
              </label>
              <label>
                <span className="label">Phone number *</span>
                <input value={address.phone} onChange={(event) => updateField('phone', event.target.value)} className="input" placeholder="10-digit mobile number" inputMode="tel" required />
              </label>
              <label className="sm:col-span-2">
                <span className="label">Street address *</span>
                <input value={address.street} onChange={(event) => updateField('street', event.target.value)} className="input" placeholder="House / flat number, building, street" required />
              </label>
              <label>
                <span className="label">City *</span>
                <input value={address.city} onChange={(event) => updateField('city', event.target.value)} className="input" placeholder="City" required />
              </label>
              <label>
                <span className="label">State *</span>
                <input value={address.state} onChange={(event) => updateField('state', event.target.value)} className="input" placeholder="State" required />
              </label>
              <label>
                <span className="label">PIN code *</span>
                <input value={address.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} className="input" placeholder="6-digit PIN code" inputMode="numeric" required />
              </label>
              <label>
                <span className="label">Country</span>
                <input value={address.country} onChange={(event) => updateField('country', event.target.value)} className="input" placeholder="Country" />
              </label>
              <label className="flex items-center gap-2.5 text-xs font-medium text-ink-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Save this address to my profile for next time
              </label>
            </div>
          </section>

          {/* Payment */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Wallet size={16} /></span>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Payment method</h2>
                <p className="text-[11px] text-ink-400">All online payments are simulated for this demo.</p>
              </div>
              <span className="ml-auto badge bg-slate-100 text-slate-500">Step 2 of 2</span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {[
                {
                  value: 'COD',
                  icon: Truck,
                  title: 'Cash on delivery',
                  text: 'Pay in cash when your order arrives.',
                },
                {
                  value: 'Online',
                  icon: CreditCard,
                  title: 'ShopSphere Pay (simulated)',
                  text: 'A simulated online payment. No real charge is made.',
                },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                    paymentMethod === method.value
                      ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-100'
                      : 'border-slate-200 bg-white hover:border-brand-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                    className="sr-only"
                  />
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${paymentMethod === method.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-500'}`}>
                    <method.icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink-900">{method.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-ink-500">{method.text}</span>
                  </span>
                  {paymentMethod === method.value && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={12} /></span>
                  )}
                </label>
              ))}
            </div>
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-ink-500">
              {paymentMethod === 'Online'
                ? 'This is a simulated payment gateway. Placing the order marks it as paid and generates a demo transaction ID.'
                : 'You will pay the delivery partner in cash. Your order is marked as payment pending until delivery.'}
            </div>
          </section>

          {/* Coupon */}
          <section className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Tag size={16} /></span>
              <div>
                <h2 className="text-sm font-bold text-ink-900">Coupon code</h2>
                <p className="text-[11px] text-ink-400">Discounts are recalculated securely on the server.</p>
              </div>
            </div>
            <div className="p-5">
              {coupon ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-800"><BadgeCheck size={16} /> {coupon.code} applied</p>
                    <p className="mt-0.5 text-[11px] text-emerald-700">{coupon.description}</p>
                  </div>
                  <button type="button" onClick={removeCoupon} className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100">
                    <X size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input flex-1 uppercase tracking-wide"
                    aria-label="Coupon code"
                  />
                  <button type="button" onClick={() => applyCoupon()} disabled={couponBusy} className="btn-secondary px-5">
                    {couponBusy ? 'Checking…' : 'Apply'}
                  </button>
                </div>
              )}

              {!coupon && coupons.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Available offers</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {coupons.map((offer) => (
                      <button
                        key={offer.code}
                        type="button"
                        onClick={() => applyCoupon(offer.code)}
                        className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/50"
                      >
                        <p className="text-xs font-extrabold text-brand-700">{offer.code}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-ink-500">{offer.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-ink-900">Your order</h2>
              <Link to="/cart" className="text-[11px] font-semibold text-brand-600 hover:text-brand-800">Edit cart</Link>
            </div>

            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.product._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    <img src={resolveImage(item.product.images?.[0])} alt={item.product.name} onError={handleImageError} className="h-full w-full object-cover" />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900 px-1 text-[9px] font-bold text-white">{item.quantity}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold text-ink-800">{item.product.name}</p>
                    <p className="mt-0.5 text-[10px] text-ink-400">{formatCurrency(item.product.finalPrice ?? item.product.price)} each</p>
                  </div>
                  <p className="text-xs font-bold text-ink-900">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-slate-100 px-5 py-4 text-sm">
              <div className="flex items-center justify-between text-ink-600">
                <span>Subtotal</span>
                <span className="font-semibold text-ink-900">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Coupon discount</span>
                  <span className="font-semibold">− {formatCurrency(discount)}</span>
                </div>
              )}
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
              <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                <span className="font-bold text-ink-900">Total payable</span>
                <span className="text-xl font-extrabold text-ink-900">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <button type="submit" disabled={placing || stockIssue} className="btn-primary w-full py-3">
                <Lock size={16} />
                {placing ? 'Placing your order…' : paymentMethod === 'Online' ? `Pay ${formatCurrency(total)}` : `Place order · ${formatCurrency(total)}`}
              </button>
              <p className="mt-2 text-center text-[10px] leading-4 text-ink-400">
                By placing this order you agree to our terms of service and return policy.
              </p>
            </div>

            <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] text-ink-500">
              <p className="flex items-center gap-2"><ShieldCheck size={13} className="text-brand-600" /> Encrypted, token-protected checkout</p>
              <p className="flex items-center gap-2"><Truck size={13} className="text-brand-600" /> Delivery in 3–5 business days</p>
              <p className="flex items-center gap-2"><PackageCheck size={13} className="text-brand-600" /> Stock reserved instantly</p>
            </div>
          </div>

          <Link to="/products" className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-ink-400 transition hover:text-brand-700">
            Continue shopping <ChevronRight size={13} />
          </Link>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;

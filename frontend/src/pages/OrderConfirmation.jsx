import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Download, MapPin, Package, Printer, ShoppingBag, Truck } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { orderService } from '../services/order.service';
import { getApiError } from '../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { handleImageError, resolveImage } from '../utils/image';

const OrderConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.get(id);
      setOrder(data.order);
    } catch (err) {
      setError(getApiError(err, 'We could not load this order.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!location.state?.order) load();
  }, [load, location.state]);

  if (loading) return <LoadingSpinner fullPage label="Confirming your order…" />;

  if (error || !order) {
    return (
      <div className="container-page py-12">
        <ErrorState title="Order not available" message={error || 'This order could not be found.'} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn-primary">View my orders</Link>
        </div>
      </div>
    );
  }

  const estimatedDelivery = new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000);

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'My orders', to: '/orders' }]} current="Order confirmation" />

      <div className="mx-auto mt-6 max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-soft sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-brand-500 to-indigo-500" />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Thank you for your order!</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Your order <span className="font-bold text-ink-800">{order.orderNumber}</span> has been placed successfully.
            {order.paymentMethod === 'Online' ? ' Your simulated payment was approved.' : ' You will pay in cash on delivery.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status={order.orderStatus} />
            <StatusBadge status={order.paymentStatus} type="payment" />
            <span className="badge bg-slate-100 text-slate-600">{order.paymentMethod === 'COD' ? 'Cash on delivery' : 'ShopSphere Pay (simulated)'}</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to={`/orders/${order._id}`} className="btn-primary">
              <Package size={16} /> Track this order
            </Link>
            <Link to="/products" className="btn-outline">
              <ShoppingBag size={16} /> Continue shopping
            </Link>
            <button type="button" onClick={() => window.print()} className="btn-ghost text-xs">
              <Printer size={15} /> Print receipt
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="card p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-400"><Truck size={15} className="text-brand-600" /> Delivery estimate</p>
            <p className="mt-2 text-lg font-extrabold text-ink-900">{formatDate(estimatedDelivery, { weekday: 'short' })}</p>
            <p className="mt-1 text-xs text-ink-500">Orders are typically delivered within 3–5 business days.</p>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-400"><MapPin size={15} className="text-brand-600" /> Shipping to</p>
            <p className="mt-2 text-sm font-bold text-ink-900">{order.shippingAddress.fullName}</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              {order.shippingAddress.street}, {order.shippingAddress.city}<br />
              {order.shippingAddress.state} — {order.shippingAddress.postalCode}, {order.shippingAddress.country}
              <br />{order.shippingAddress.phone}
            </p>
          </div>
        </div>

        <div className="card mt-5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-ink-900">Order summary</h2>
            <span className="text-[11px] text-ink-400">Placed {formatDateTime(order.createdAt)}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {order.orderItems.map((item) => (
              <div key={`${item.product}-${item.name}`} className="flex items-center gap-3 px-5 py-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                  <img src={resolveImage(item.image)} alt={item.name} onError={handleImageError} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-ink-800">{item.name}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{formatCurrency(item.price)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-ink-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-sm">
            <div className="flex justify-between text-ink-500"><span>Subtotal</span><span>{formatCurrency(order.itemsPrice)}</span></div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Coupon {order.couponCode && `(${order.couponCode})`}</span><span>− {formatCurrency(order.discountAmount)}</span></div>
            )}
            <div className="flex justify-between text-ink-500"><span>Delivery</span><span>{order.shippingPrice === 0 ? 'Free' : formatCurrency(order.shippingPrice)}</span></div>
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-base font-extrabold text-ink-900"><span>Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
            {order.paymentResult?.transactionId && (
              <p className="pt-1 text-[10px] text-ink-400">Transaction: {order.paymentResult.transactionId} · {order.paymentResult.provider}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-xs text-ink-500">
          <Clock size={14} className="text-brand-600" />
          Need help with this order? Email support@shopsphere.dev or visit your order details page.
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;

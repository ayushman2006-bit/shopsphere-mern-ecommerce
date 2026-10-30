import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Printer,
  RotateCcw,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmationModal from '../components/ConfirmationModal';
import ErrorState from '../components/ErrorState';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/order.service';
import { cartService } from '../services/cart.service';
import { getApiError } from '../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import { canCancelOrder, TRACK_STEPS } from '../utils/status';
import { handleImageError, resolveImage } from '../utils/image';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.get(id);
      setOrder(data.order);
    } catch (err) {
      setError(getApiError(err, 'Could not load this order.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const currentStep = useMemo(() => {
    if (!order || order.orderStatus === 'Cancelled') return -1;
    return TRACK_STEPS.findIndex((step) => step.key === order.orderStatus);
  }, [order]);

  if (loading) return <LoadingSpinner fullPage label="Loading order details…" />;

  if (error || !order) {
    return (
      <div className="container-page py-12">
        <ErrorState title="Order not available" message={error || 'This order could not be found.'} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/orders" className="btn-primary">Back to my orders</Link>
        </div>
      </div>
    );
  }

  const estimatedDelivery = new Date(new Date(order.createdAt).getTime() + 4 * 24 * 60 * 60 * 1000);
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const cancelled = order.orderStatus === 'Cancelled';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await orderService.cancel(order._id, cancelReason || 'Cancelled by customer');
      toast.success('Your order has been cancelled');
      setCancelOpen(false);
      setCancelReason('');
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not cancel this order'));
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    setReordering(true);
    try {
      for (const item of order.orderItems) {
        await cartService.add(item.product, item.quantity);
      }
      await refreshCart();
      toast.success('Items added to your cart');
      navigate('/cart');
    } catch (err) {
      toast.error(getApiError(err, 'Some items could not be added to your cart. Stock may have changed.'));
      await refreshCart();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'My orders', to: '/orders' }]} current={order.orderNumber} />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.orderStatus} />
            <StatusBadge status={order.paymentStatus} type="payment" />
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-500">Placed on {formatDateTime(order.createdAt)} · {itemCount} item{itemCount === 1 ? '' : 's'} · {formatCurrency(order.totalPrice)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/orders" className="btn-ghost px-3 py-2 text-xs"><ArrowLeft size={14} /> All orders</Link>
          <button type="button" onClick={() => window.print()} className="btn-outline px-3 py-2 text-xs"><Printer size={14} /> Print</button>
          <button type="button" onClick={handleReorder} disabled={reordering} className="btn-primary px-3.5 py-2 text-xs">
            <ShoppingCart size={14} /> {reordering ? 'Adding…' : 'Buy again'}
          </button>
        </div>
      </div>

      {cancelled ? (
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-rose-800"><RotateCcw size={16} /> This order was cancelled</p>
          <p className="mt-1 text-xs leading-5 text-rose-700">
            Cancelled on {formatDateTime(order.cancelledAt)}{order.cancelReason ? ` · ${order.cancelReason}` : ''}. Reserved stock has been returned to the catalogue.
          </p>
        </div>
      ) : (
        <section className="card mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900"><Truck size={16} className="text-brand-600" /> Order tracking</h2>
            <p className="text-xs text-ink-400">
              Estimated delivery <span className="font-bold text-ink-700">{formatDate(estimatedDelivery, { weekday: 'short' })}</span>
            </p>
          </div>

          <div className="relative mt-6">
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200 sm:left-8 sm:right-8" />
            <div
              className="absolute left-4 top-4 h-0.5 bg-brand-600 transition-all duration-500 sm:left-8"
              style={{ width: `calc(${currentStep >= 0 ? (currentStep / (TRACK_STEPS.length - 1)) * 100 : 0}% - ${currentStep >= 0 ? (currentStep / (TRACK_STEPS.length - 1)) * 32 : 0}px)` }}
            />
            <div className="relative grid grid-cols-4 gap-1">
              {TRACK_STEPS.map((step, index) => {
                const complete = index <= currentStep;
                const active = index === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold transition ${
                        complete ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-ink-400'
                      } ${active ? 'ring-4 ring-brand-100' : ''}`}
                    >
                      {index < currentStep ? <CheckCircle2 size={15} /> : index + 1}
                    </span>
                    <p className={`mt-2 text-[11px] font-bold sm:text-xs ${complete ? 'text-ink-900' : 'text-ink-400'}`}>{step.label}</p>
                    <p className="mt-0.5 hidden max-w-[130px] text-[10px] leading-4 text-ink-400 sm:block">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {canCancelOrder(order.orderStatus) && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-ink-500">Changed your mind? You can cancel while this order is pending or processing.</p>
              <button type="button" onClick={() => setCancelOpen(true)} className="btn-ghost px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">
                <RotateCcw size={14} /> Cancel order
              </button>
            </div>
          )}
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900"><Package size={16} className="text-brand-600" /> Items in this order</h2>
              <span className="text-[11px] text-ink-400">{itemCount} item(s)</span>
            </div>
            <div className="divide-y divide-slate-100">
              {order.orderItems.map((item) => (
                <div key={`${item.product}-${item.name}`} className="flex items-center gap-3 px-5 py-4">
                  <Link to={`/products/${item.product}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                    <img src={resolveImage(item.image)} alt={item.name} onError={handleImageError} className="h-full w-full object-cover transition hover:scale-105" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.product}`} className="line-clamp-2 text-sm font-bold text-ink-900 transition hover:text-brand-700">{item.name}</Link>
                    <p className="mt-1 text-[11px] text-ink-400">{formatCurrency(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-ink-900">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900"><CalendarDays size={16} className="text-brand-600" /> Order timeline</h2>
            <ol className="mt-4 space-y-0">
              {(order.statusHistory || []).map((entry, index, list) => (
                <li key={`${entry.status}-${entry.date}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < list.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />}
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${entry.status === 'Cancelled' ? 'border-rose-400 bg-rose-50' : 'border-brand-500 bg-brand-50'}`} />
                  <div>
                    <p className="text-xs font-bold text-ink-800">{entry.status}</p>
                    <p className="text-[11px] text-ink-400">{formatDateTime(entry.date)}</p>
                    {entry.note && <p className="mt-0.5 text-[11px] text-ink-500">{entry.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900"><MapPin size={16} className="text-brand-600" /> Shipping address</h2>
            <p className="mt-3 text-sm font-bold text-ink-800">{order.shippingAddress.fullName}</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state}<br />
              {order.shippingAddress.postalCode}, {order.shippingAddress.country}<br />
              Phone: {order.shippingAddress.phone}
            </p>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900"><CreditCard size={16} className="text-brand-600" /> Payment</h2>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3"><span className="text-ink-400">Method</span><span className="text-right font-semibold text-ink-800">{order.paymentMethod === 'COD' ? 'Cash on delivery' : 'ShopSphere Pay (simulated)'}</span></div>
              <div className="flex justify-between gap-3"><span className="text-ink-400">Status</span><span className="text-right font-semibold text-ink-800">{order.paymentStatus}</span></div>
              {order.paymentResult?.transactionId && (
                <div className="flex justify-between gap-3"><span className="text-ink-400">Transaction</span><span className="text-right font-mono text-[10px] font-semibold text-ink-700">{order.paymentResult.transactionId}</span></div>
              )}
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-ink-900">Price breakdown</h2>
            </div>
            <div className="space-y-2.5 px-5 py-4 text-sm">
              <div className="flex justify-between text-ink-500"><span>Subtotal</span><span>{formatCurrency(order.itemsPrice)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Coupon {order.couponCode && `(${order.couponCode})`}</span><span>− {formatCurrency(order.discountAmount)}</span></div>
              )}
              <div className="flex justify-between text-ink-500"><span>Delivery</span><span>{order.shippingPrice === 0 ? 'Free' : formatCurrency(order.shippingPrice)}</span></div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5 text-base font-extrabold text-ink-900"><span>Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
              <p className="text-[10px] text-ink-400">Taxes included. All amounts in Indian rupees.</p>
            </div>
          </section>
        </aside>
      </div>

      <ConfirmationModal
        open={cancelOpen}
        title="Cancel this order?"
        message={`Order ${order.orderNumber} will be cancelled and its stock returned to the catalogue.${order.paymentStatus === 'Paid' ? ' Your simulated payment will be marked as refunded.' : ''}`}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        danger
        loading={cancelling}
        onClose={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        onConfirm={handleCancel}
      >
        <div className="mt-4">
          <label htmlFor="order-cancel-reason" className="label">Reason <span className="font-normal normal-case text-ink-300">(optional)</span></label>
          <textarea
            id="order-cancel-reason"
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Tell us why you are cancelling"
            className="input resize-none"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default OrderDetails;

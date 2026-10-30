import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Package, RotateCcw, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmationModal from '../components/ConfirmationModal';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { orderService } from '../services/order.service';
import { getApiError } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { canCancelOrder, ORDER_STATUSES } from '../utils/status';
import { handleImageError, resolveImage } from '../utils/image';

const statusTabs = ['All', ...ORDER_STATUSES];

const MyOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const status = searchParams.get('status') || 'All';
  const page = Number(searchParams.get('page')) || 1;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.my({ status, page, limit: 8 });
      setOrders(data.orders || []);
      setMeta({ page: data.page || 1, pages: data.pages || 0, total: data.total || 0 });
    } catch (err) {
      setError(getApiError(err, 'Could not load your orders.'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = (nextStatus) => {
    const next = new URLSearchParams();
    if (nextStatus !== 'All') next.set('status', nextStatus);
    setSearchParams(next, { replace: true });
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await orderService.cancel(cancelTarget._id, cancelReason || 'Cancelled by customer');
      toast.success('Your order has been cancelled');
      setCancelTarget(null);
      setCancelReason('');
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not cancel this order'));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs current="My orders" />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Your purchases</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">My orders</h1>
          <p className="mt-1 text-sm text-ink-500">Track deliveries, review past purchases and manage cancellations.</p>
        </div>
        <Link to="/products" className="btn-outline px-3.5 py-2.5 text-xs">
          <ShoppingBag size={14} /> Continue shopping
        </Link>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-soft no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => changeStatus(tab)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              status === tab ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-500 hover:bg-slate-50 hover:text-ink-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="skeleton h-40 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="Could not load your orders" message={error} onRetry={load} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={status === 'All' ? 'No orders yet' : `No ${status.toLowerCase()} orders`}
            description={status === 'All' ? 'When you place an order it will appear here with live tracking and delivery updates.' : 'Try a different status filter to see your other orders.'}
            actionLabel={status === 'All' ? 'Start shopping' : 'View all orders'}
            actionTo={status === 'All' ? '/products' : undefined}
            onAction={status === 'All' ? undefined : () => changeStatus('All')}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                    <span className="text-ink-400">Order <span className="font-bold text-ink-800">{order.orderNumber}</span></span>
                    <span className="text-ink-400">Placed {formatDate(order.createdAt)}</span>
                    <span className="font-bold text-ink-900">{formatCurrency(order.totalPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.orderStatus} />
                    <StatusBadge status={order.paymentStatus} type="payment" />
                  </div>
                </div>

                <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.orderItems.slice(0, 4).map((item) => (
                        <div key={`${item.product}-${item.name}`} className="h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-slate-50 shadow-sm">
                          <img src={resolveImage(item.image)} alt={item.name} onError={handleImageError} className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {order.orderItems.length > 4 && (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-[11px] font-bold text-ink-500">
                          +{order.orderItems.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-bold text-ink-900">
                        {order.orderItems[0]?.name}
                        {order.orderItems.length > 1 && ` + ${order.orderItems.length - 1} more`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} item(s) · {order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online payment'}
                      </p>
                      {order.cancelReason && <p className="mt-1 text-[11px] text-rose-500">Reason: {order.cancelReason}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {canCancelOrder(order.orderStatus) && (
                      <button type="button" onClick={() => setCancelTarget(order)} className="btn-ghost px-3 py-2 text-xs text-rose-600 hover:bg-rose-50">
                        <RotateCcw size={14} /> Cancel order
                      </button>
                    )}
                    <Link to={`/orders/${order._id}`} className="btn-outline px-3 py-2 text-xs">
                      View details <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {meta.pages > 1 && (
          <Pagination
            page={meta.page}
            pages={meta.pages}
            onChange={(nextPage) => {
              const next = new URLSearchParams(searchParams);
              if (nextPage <= 1) next.delete('page');
              else next.set('page', String(nextPage));
              setSearchParams(next, { replace: true });
            }}
            className="mt-6"
          />
        )}
      </div>

      <ConfirmationModal
        open={Boolean(cancelTarget)}
        title="Cancel this order?"
        message={`Order ${cancelTarget?.orderNumber || ''} will be cancelled and reserved stock will be returned to the catalogue.${cancelTarget?.paymentStatus === 'Paid' ? ' Your simulated payment will be marked as refunded.' : ''}`}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        danger
        loading={cancelling}
        onClose={() => {
          setCancelTarget(null);
          setCancelReason('');
        }}
        onConfirm={confirmCancel}
      >
        <div className="mt-4">
          <label htmlFor="cancel-reason" className="label">Reason <span className="font-normal normal-case text-ink-300">(optional)</span></label>
          <textarea
            id="cancel-reason"
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

export default MyOrders;

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Eye,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import { adminService } from '../../services/admin.service';
import { orderService } from '../../services/order.service';
import { getApiError } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { handleImageError, resolveImage } from '../../utils/image';
import { ORDER_STATUSES } from '../../utils/status';

const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Failed'];

const TRANSITIONS = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const statusActionClass = (status) => {
  if (status === 'Cancelled') return 'btn-danger';
  if (status === 'Delivered') return 'btn bg-emerald-600 text-white hover:bg-emerald-700';
  return 'btn-primary';
};

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const keyword = searchParams.get('keyword') || '';
  const status = searchParams.get('status') || 'All';
  const paymentStatus = searchParams.get('paymentStatus') || 'All';
  const page = Number(searchParams.get('page')) || 1;
  const [keywordInput, setKeywordInput] = useState(keyword);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [order, setOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [pendingStatus, setPendingStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (keyword) params.keyword = keyword;
      if (status !== 'All') params.status = status;
      if (paymentStatus !== 'All') params.paymentStatus = paymentStatus;
      const data = await adminService.orders(params);
      setOrders(data.orders || []);
      setMeta({ page: data.page || 1, pages: data.pages || 0, total: data.total || 0 });
    } catch (err) {
      setError(getApiError(err, 'Could not load orders.'));
      setOrders([]);
      setMeta({ page: 1, pages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, keyword, status, paymentStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined || value === 'All') next.delete(key);
        else next.set(key, String(value));
      });
      if (!('page' in updates)) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = () => {
    setSearchParams({}, { replace: true });
    setKeywordInput('');
  };

  const openDetail = async (id) => {
    setDetailId(id);
    setDetailOpen(true);
    setOrder(null);
    setDetailError('');
    setPendingStatus(null);
    setStatusNote('');
    setDetailLoading(true);
    try {
      const data = await orderService.get(id);
      setOrder(data.order);
    } catch (err) {
      setDetailError(getApiError(err, 'Could not load this order.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (statusUpdating) return;
    setDetailOpen(false);
    setDetailId(null);
    setOrder(null);
    setDetailError('');
    setPendingStatus(null);
    setStatusNote('');
  };

  const applyStatus = async () => {
    if (!order || !pendingStatus) return;
    setStatusUpdating(true);
    try {
      const data = await adminService.updateOrderStatus(order._id, pendingStatus, statusNote.trim());
      toast.success(data.message || `Order marked as ${pendingStatus}`);
      setOrder(data.order);
      setPendingStatus(null);
      setStatusNote('');
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not update this order'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const availableTransitions = order ? TRANSITIONS[order.orderStatus] || [] : [];
  const itemCount = order?.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Fulfilment</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">Orders</h2>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Loading orders…' : `${meta.total} order${meta.total === 1 ? '' : 's'} matching the current view`}
          </p>
        </div>
        <button type="button" onClick={load} className="btn-outline px-3 py-2 text-xs sm:self-center" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ keyword: keywordInput.trim() });
          }}
          className="relative flex-1"
        >
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="Search by order number or customer name…"
            className="input h-11 py-0 pl-10 pr-24 text-xs"
          />
          <button type="submit" className="btn-primary absolute right-1.5 top-1.5 h-8 px-3 text-[11px]">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={status}
              onChange={(event) => updateParams({ status: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-40"
              aria-label="Filter by order status"
            >
              <option value="All">All statuses</option>
              {ORDER_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          <div className="relative">
            <select
              value={paymentStatus}
              onChange={(event) => updateParams({ paymentStatus: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-40"
              aria-label="Filter by payment status"
            >
              <option value="All">All payments</option>
              {PAYMENT_STATUSES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          {(keyword || status !== 'All' || paymentStatus !== 'All') && (
            <button type="button" onClick={resetFilters} className="btn-ghost px-2.5 py-2 text-xs text-ink-500">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-6"><LoadingSpinner label="Loading orders…" /></div>
      ) : error ? (
        <ErrorState title="Could not load orders" message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders match this view"
          description="When customers place orders they will appear here. Try clearing the filters to see every order."
          actionLabel={keyword || status !== 'All' || paymentStatus !== 'All' ? 'Clear filters' : undefined}
          onAction={keyword || status !== 'All' || paymentStatus !== 'All' ? resetFilters : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="table-th">Order</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Placed</th>
                  <th className="table-th">Items</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Payment</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((entry) => (
                  <tr key={entry._id} className="transition hover:bg-slate-50/60">
                    <td className="table-td font-bold text-ink-900">{entry.orderNumber}</td>
                    <td className="table-td">
                      <p className="font-semibold text-ink-800">{entry.user?.name || 'Deleted customer'}</p>
                      <p className="text-[10px] text-ink-400">{entry.user?.email || entry.shippingAddress?.fullName || '—'}</p>
                    </td>
                    <td className="table-td text-xs text-ink-500">{formatDateTime(entry.createdAt)}</td>
                    <td className="table-td text-xs text-ink-500">
                      {entry.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} item(s)
                    </td>
                    <td className="table-td font-bold text-ink-900">{formatCurrency(entry.totalPrice)}</td>
                    <td className="table-td">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={entry.paymentStatus} type="payment" />
                        <span className="text-[10px] text-ink-400">{entry.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online (simulated)'}</span>
                      </div>
                    </td>
                    <td className="table-td"><StatusBadge status={entry.orderStatus} /></td>
                    <td className="table-td text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(entry._id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && meta.pages > 1 && (
        <Pagination
          page={meta.page}
          pages={meta.pages}
          onChange={(nextPage) => updateParams({ page: nextPage <= 1 ? '' : nextPage })}
        />
      )}

      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={order ? `Order ${order.orderNumber}` : 'Order details'}
        description={order ? `Placed ${formatDateTime(order.createdAt)} · ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Loading the latest order data.'}
        size="xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-ink-400">
              {order ? `Payment: ${order.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online (simulated)'}` : ''}
            </p>
            <button type="button" className="btn-outline px-3.5 py-2 text-xs" onClick={closeDetail} disabled={statusUpdating}>
              Close
            </button>
          </div>
        }
      >
        {detailLoading ? (
          <LoadingSpinner label="Loading order details…" />
        ) : detailError ? (
          <ErrorState
            title="Could not load this order"
            message={detailError}
            onRetry={() => detailId && openDetail(detailId)}
          />
        ) : order ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={order.orderStatus} />
              <StatusBadge status={order.paymentStatus} type="payment" />
              {order.couponCode && <span className="badge bg-emerald-50 text-emerald-700">Coupon {order.couponCode}</span>}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                  <Package size={14} className="text-brand-600" /> Items
                </h3>
                <span className="text-[11px] text-ink-400">{itemCount} unit(s)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {order.orderItems.map((item) => (
                  <div key={`${item.product}-${item.name}`} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      <img src={resolveImage(item.image)} alt={item.name} onError={handleImageError} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-bold text-ink-800">{item.name}</p>
                      <p className="text-[10px] text-ink-400">{formatCurrency(item.price)} × {item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-ink-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                  <MapPin size={14} className="text-brand-600" /> Shipping address
                </h3>
                <p className="mt-2.5 text-sm font-bold text-ink-800">{order.shippingAddress.fullName}</p>
                <p className="mt-1 text-xs leading-5 text-ink-500">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  {order.shippingAddress.postalCode}, {order.shippingAddress.country}<br />
                  Phone: {order.shippingAddress.phone}
                </p>
                {order.user?.email && <p className="mt-2 text-[11px] text-ink-400">Account: {order.user.email}</p>}
              </section>

              <section className="rounded-2xl border border-slate-100 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                  <CreditCard size={14} className="text-brand-600" /> Payment summary
                </h3>
                <div className="mt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between gap-3"><span className="text-ink-400">Subtotal</span><span className="font-semibold text-ink-700">{formatCurrency(order.itemsPrice)}</span></div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-600"><span>Discount</span><span className="font-semibold">− {formatCurrency(order.discountAmount)}</span></div>
                  )}
                  <div className="flex justify-between gap-3"><span className="text-ink-400">Delivery</span><span className="font-semibold text-ink-700">{order.shippingPrice === 0 ? 'Free' : formatCurrency(order.shippingPrice)}</span></div>
                  <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-2 text-sm font-extrabold text-ink-900"><span>Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
                  {order.paymentResult?.transactionId && (
                    <p className="pt-1 font-mono text-[10px] text-ink-400">TXN {order.paymentResult.transactionId}</p>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-100 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                <Truck size={14} className="text-brand-600" /> Status timeline
              </h3>
              <ol className="mt-3 space-y-3">
                {(order.statusHistory || []).map((entry, index, list) => (
                  <li key={`${entry.status}-${entry.date}-${index}`} className="relative flex gap-3 pb-3 last:pb-0">
                    {index < list.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-slate-200" />}
                    <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 ${entry.status === 'Cancelled' ? 'border-rose-400 bg-rose-50' : 'border-brand-500 bg-brand-50'}`} />
                    <div>
                      <p className="text-xs font-bold text-ink-800">{entry.status}</p>
                      <p className="text-[10px] text-ink-400">{formatDateTime(entry.date)}</p>
                      {entry.note && <p className="text-[11px] text-ink-500">{entry.note}</p>}
                    </div>
                  </li>
                ))}
                {!(order.statusHistory || []).length && <li className="text-xs text-ink-400">No status updates yet.</li>}
              </ol>
            </section>

            <section className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-800">
                <CircleDollarSign size={14} /> Update fulfilment status
              </h3>
              {availableTransitions.length === 0 ? (
                <p className="mt-2 text-xs leading-5 text-ink-500">
                  This order is {order.orderStatus.toLowerCase()} and cannot move to another status.
                </p>
              ) : pendingStatus ? (
                <div className="mt-3 space-y-3">
                  <p className="text-xs font-semibold text-ink-700">
                    Mark this order as <span className="font-extrabold text-brand-800">{pendingStatus}</span>?
                    {pendingStatus === 'Cancelled' && ' Reserved stock will be returned to the catalogue and paid orders will be refunded.'}
                  </p>
                  <label className="block">
                    <span className="label">Note <span className="font-normal normal-case text-ink-300">(optional, stored in the timeline)</span></span>
                    <textarea
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      rows={2}
                      maxLength={300}
                      className="input resize-none"
                      placeholder={pendingStatus === 'Cancelled' ? 'Reason for cancelling' : 'Add a note for the customer'}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={statusActionClass(pendingStatus)} onClick={applyStatus} disabled={statusUpdating}>
                      {statusUpdating ? 'Updating…' : `Confirm ${pendingStatus}`}
                    </button>
                    <button type="button" className="btn-outline" onClick={() => { setPendingStatus(null); setStatusNote(''); }} disabled={statusUpdating}>
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableTransitions.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      onClick={() => setPendingStatus(nextStatus)}
                      className={statusActionClass(nextStatus)}
                    >
                      {nextStatus === 'Cancelled' ? 'Cancel order' : `Mark as ${nextStatus}`}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AdminOrders;

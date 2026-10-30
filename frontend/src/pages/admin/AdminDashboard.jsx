import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Box,
  CircleDollarSign,
  Clock,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import SalesChart from '../../components/SalesChart';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { adminService } from '../../services/admin.service';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { handleImageError, resolveImage } from '../../utils/image';

const ranges = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.stats(days);
      setStats(data.stats);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) return <LoadingSpinner fullPage label="Loading dashboard…" />;
  if (error && !stats) return <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Live store overview</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">Good to see you again</h2>
          <p className="mt-1 text-sm text-ink-500">Every number below is calculated from the live database.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/products" className="btn-outline px-3 py-2 text-xs"><Package size={14} /> Manage products</Link>
          <Link to="/admin/orders" className="btn-primary px-3 py-2 text-xs"><ShoppingBag size={14} /> View orders</Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
          {error} Showing the last loaded data.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={CircleDollarSign} tone="emerald" helper="Excludes cancelled orders" />
        <StatCard label="Total orders" value={formatNumber(stats?.totalOrders || 0)} icon={ShoppingBag} tone="brand" helper={`${stats?.pendingOrders || 0} pending`} />
        <StatCard label="Customers" value={formatNumber(stats?.totalCustomers || 0)} icon={Users} tone="indigo" helper="Registered customer accounts" />
        <StatCard label="Products" value={formatNumber(stats?.totalProducts || 0)} icon={Box} tone="amber" helper={`${stats?.lowStockProducts?.length || 0} low-stock alerts`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp size={19} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Delivered</p>
            <p className="text-lg font-extrabold text-ink-900">{formatNumber(stats?.deliveredOrders || 0)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock size={19} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Awaiting action</p>
            <p className="text-lg font-extrabold text-ink-900">{formatNumber(stats?.pendingOrders || 0)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={19} /></span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Cancelled</p>
            <p className="text-lg font-extrabold text-ink-900">{formatNumber(stats?.cancelledOrders || 0)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900"><BarChart3 size={16} className="text-brand-600" /> Sales overview</h3>
              <p className="mt-0.5 text-[11px] text-ink-400">Revenue and order volume over the selected period.</p>
            </div>
            <div className="flex rounded-xl bg-slate-100 p-1">
              {ranges.map((range) => (
                <button
                  key={range.days}
                  type="button"
                  onClick={() => setDays(range.days)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    days === range.days ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <SalesChart data={stats?.salesOverview || []} loading={loading} />
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900"><TrendingUp size={16} className="text-brand-600" /> Best sellers</h3>
              <p className="mt-0.5 text-[11px] text-ink-400">By units sold across active orders.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {(stats?.bestSellers || []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-ink-400">No sales recorded yet.</p>
            ) : (
              stats.bestSellers.map((item, index) => (
                <div key={String(item._id)} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-ink-500">{index + 1}</span>
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    <img src={resolveImage(item.image)} alt={item.name} onError={handleImageError} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-bold text-ink-800">{item.name}</p>
                    <p className="text-[10px] text-ink-400">{item.unitsSold} units · {formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900">Recent orders</h3>
              <p className="mt-0.5 text-[11px] text-ink-400">The six most recent orders placed in the store.</p>
            </div>
            <Link to="/admin/orders" className="flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-900">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="table-th">Order</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(stats?.recentOrders || []).map((order) => (
                  <tr key={order._id} className="transition hover:bg-slate-50/60">
                    <td className="table-td font-bold text-ink-900">
                      <Link to={`/admin/orders?keyword=${encodeURIComponent(order.orderNumber)}`} className="hover:text-brand-700">{order.orderNumber}</Link>
                    </td>
                    <td className="table-td">
                      <p className="font-semibold text-ink-800">{order.user?.name || 'Deleted customer'}</p>
                      <p className="text-[10px] text-ink-400">{order.user?.email || '—'}</p>
                    </td>
                    <td className="table-td text-xs text-ink-500">{formatDate(order.createdAt)}</td>
                    <td className="table-td font-bold text-ink-900">{formatCurrency(order.totalPrice)}</td>
                    <td className="table-td"><StatusBadge status={order.orderStatus} /></td>
                  </tr>
                ))}
                {!(stats?.recentOrders || []).length && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-ink-400">No orders have been placed yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900"><AlertTriangle size={16} className="text-amber-500" /> Low stock</h3>
            <p className="mt-0.5 text-[11px] text-ink-400">Products with five or fewer units remaining.</p>
            <div className="mt-4 space-y-2.5">
              {(stats?.lowStockProducts || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-ink-400">All products are well stocked.</p>
              ) : (
                stats.lowStockProducts.map((product) => (
                  <Link key={product._id} to={`/admin/products?keyword=${encodeURIComponent(product.name)}`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      <img src={resolveImage(product.images?.[0])} alt={product.name} onError={handleImageError} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-bold text-ink-800">{product.name}</p>
                      <p className="text-[10px] text-ink-400">{formatCurrency(product.finalPrice)}</p>
                    </div>
                    <span className={`badge ${product.stock === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{product.stock} left</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900"><Box size={16} className="text-brand-600" /> Catalogue mix</h3>
            <p className="mt-0.5 text-[11px] text-ink-400">Products per category.</p>
            <div className="mt-4 space-y-3">
              {(stats?.categoryBreakdown || []).map((category) => {
                const max = Math.max(...(stats.categoryBreakdown || []).map((entry) => entry.products), 1);
                return (
                  <div key={category.name}>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-ink-700">{category.name}</span>
                      <span className="text-ink-400">{category.products}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(category.products / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
              {!(stats?.categoryBreakdown || []).length && <p className="text-xs text-ink-400">No categories yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

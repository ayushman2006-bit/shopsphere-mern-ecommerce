import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  Eye,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  ShoppingBag,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { adminService } from '../../services/admin.service';
import { getApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, formatDateTime, formatNumber, getInitials } from '../../utils/format';
import { ORDER_STATUS_CLASSES } from '../../utils/status';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const keyword = searchParams.get('keyword') || '';
  const role = searchParams.get('role') || 'All';
  const blocked = searchParams.get('blocked') || 'All';
  const page = Number(searchParams.get('page')) || 1;
  const [keywordInput, setKeywordInput] = useState(keyword);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [roleDraft, setRoleDraft] = useState('customer');
  const [roleSaving, setRoleSaving] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockSaving, setBlockSaving] = useState(false);

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (keyword) params.keyword = keyword;
      if (role !== 'All') params.role = role;
      if (blocked !== 'All') params.blocked = blocked;
      const data = await adminService.users(params);
      setUsers(data.users || []);
      setMeta({ page: data.page || 1, pages: data.pages || 0, total: data.total || 0 });
    } catch (err) {
      setError(getApiError(err, 'Could not load customers.'));
      setUsers([]);
      setMeta({ page: 1, pages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, keyword, role, blocked]);

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

  const loadDetail = async (id) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await adminService.user(id);
      setDetail(data);
      setRoleDraft(data.user.role);
    } catch (err) {
      setDetailError(getApiError(err, 'Could not load this customer.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (id) => {
    setDetailId(id);
    setDetailOpen(true);
    setDetail(null);
    setRoleDraft('customer');
    loadDetail(id);
  };

  const closeDetail = () => {
    if (roleSaving || blockSaving) return;
    setDetailOpen(false);
    setDetailId(null);
    setDetail(null);
    setDetailError('');
  };

  const isSelf = (id) => String(id) === String(currentUser?._id);

  const updateRole = async () => {
    if (!detail) return;
    if (roleDraft === detail.user.role) {
      toast.error('That is already this account’s role');
      return;
    }
    setRoleSaving(true);
    try {
      const data = await adminService.updateRole(detail.user._id, roleDraft);
      toast.success(data.message || 'Role updated');
      await Promise.all([load(), loadDetail(detail.user._id)]);
    } catch (err) {
      toast.error(getApiError(err, 'Could not update this role'));
      setRoleDraft(detail.user.role);
    } finally {
      setRoleSaving(false);
    }
  };

  const confirmBlock = async () => {
    if (!blockTarget) return;
    setBlockSaving(true);
    try {
      const data = await adminService.blockUser(blockTarget._id, !blockTarget.isBlocked);
      toast.success(data.message || (data.user?.isBlocked ? 'User blocked' : 'User unblocked'));
      setBlockTarget(null);
      await load();
      if (detailId) await loadDetail(detailId);
    } catch (err) {
      toast.error(getApiError(err, 'Could not update this account'));
    } finally {
      setBlockSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Accounts</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">Customers</h2>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Loading accounts…' : `${formatNumber(meta.total)} account${meta.total === 1 ? '' : 's'} matching the current view`}
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
            placeholder="Search by name or email…"
            className="input h-11 py-0 pl-10 pr-24 text-xs"
          />
          <button type="submit" className="btn-primary absolute right-1.5 top-1.5 h-8 px-3 text-[11px]">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={role}
              onChange={(event) => updateParams({ role: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-40"
              aria-label="Filter by role"
            >
              <option value="All">All roles</option>
              <option value="customer">Customers</option>
              <option value="admin">Administrators</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          <div className="relative">
            <select
              value={blocked}
              onChange={(event) => updateParams({ blocked: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-40"
              aria-label="Filter by account status"
            >
              <option value="All">All accounts</option>
              <option value="false">Active only</option>
              <option value="true">Blocked only</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          {(keyword || role !== 'All' || blocked !== 'All') && (
            <button type="button" onClick={resetFilters} className="btn-ghost px-2.5 py-2 text-xs text-ink-500">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-6"><LoadingSpinner label="Loading accounts…" /></div>
      ) : error ? (
        <ErrorState title="Could not load customers" message={error} onRetry={load} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No accounts match this view"
          description="Try clearing the filters to see every registered customer and administrator."
          actionLabel={keyword || role !== 'All' || blocked !== 'All' ? 'Clear filters' : undefined}
          onAction={keyword || role !== 'All' || blocked !== 'All' ? resetFilters : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Spent</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((entry) => (
                  <tr key={entry._id} className="transition hover:bg-slate-50/60">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-[11px] font-bold text-white">
                          {getInitials(entry.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-bold text-ink-900">
                            {entry.name}
                            {isSelf(entry._id) && <span className="badge bg-slate-100 text-slate-600">You</span>}
                          </p>
                          <p className="truncate text-[11px] text-ink-400">{entry.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-xs text-ink-500">{formatDate(entry.createdAt)}</td>
                    <td className="table-td font-semibold text-ink-800">{entry.orderCount || 0}</td>
                    <td className="table-td font-bold text-ink-900">{formatCurrency(entry.totalSpent || 0)}</td>
                    <td className="table-td">
                      <span className={`badge ${entry.role === 'admin' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                        {entry.role === 'admin' ? <ShieldCheck size={12} /> : <UserRound size={12} />}
                        {entry.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={`badge ${entry.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {entry.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
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
        title={detail ? detail.user.name : 'Customer details'}
        description={detail ? detail.user.email : 'Loading the latest account data.'}
        size="lg"
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-ink-400">
              {detail ? `Joined ${formatDate(detail.user.createdAt)}` : ''}
            </p>
            <button type="button" className="btn-outline px-3.5 py-2 text-xs" onClick={closeDetail} disabled={roleSaving || blockSaving}>
              Close
            </button>
          </div>
        }
      >
        {detailLoading ? (
          <LoadingSpinner label="Loading account…" />
        ) : detailError ? (
          <ErrorState title="Could not load this account" message={detailError} onRetry={() => detailId && loadDetail(detailId)} />
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-lg font-extrabold text-white">
                {getInitials(detail.user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-extrabold text-ink-900">{detail.user.name}</p>
                  {isSelf(detail.user._id) && <span className="badge bg-slate-100 text-slate-600">Your account</span>}
                </div>
                <p className="truncate text-xs text-ink-400">{detail.user.email}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className={`badge ${detail.user.role === 'admin' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                    {detail.user.role === 'admin' ? <ShieldCheck size={12} /> : <UserRound size={12} />}
                    {detail.user.role === 'admin' ? 'Administrator' : 'Customer'}
                  </span>
                  <span className={`badge ${detail.user.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {detail.user.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Orders</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{formatNumber(detail.stats?.orderCount || 0)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Spent</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">{formatCurrency(detail.stats?.totalSpent || 0)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Last login</p>
                <p className="mt-1 text-xs font-bold text-ink-800">{detail.user.lastLoginAt ? formatDate(detail.user.lastLoginAt) : 'Never'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <section className="rounded-2xl border border-slate-100 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                  <Mail size={14} className="text-brand-600" /> Contact
                </h3>
                <p className="mt-2.5 flex items-center gap-2 text-xs text-ink-600"><Mail size={13} className="text-ink-400" /> {detail.user.email}</p>
                <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-600"><Phone size={13} className="text-ink-400" /> {detail.user.phone || 'No phone saved'}</p>
              </section>

              <section className="rounded-2xl border border-slate-100 p-4">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                  <MapPin size={14} className="text-brand-600" /> Saved address
                </h3>
                {detail.user.address?.street || detail.user.address?.city ? (
                  <p className="mt-2.5 text-xs leading-5 text-ink-600">
                    {detail.user.address.fullName && <span className="block font-bold text-ink-800">{detail.user.address.fullName}</span>}
                    {detail.user.address.street}<br />
                    {[detail.user.address.city, detail.user.address.state].filter(Boolean).join(', ')}<br />
                    {[detail.user.address.postalCode, detail.user.address.country].filter(Boolean).join(', ')}
                  </p>
                ) : (
                  <p className="mt-2.5 text-xs text-ink-400">No address has been saved yet.</p>
                )}
              </section>
            </div>

            <section className="rounded-2xl border border-slate-100 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                <ShoppingBag size={14} className="text-brand-600" /> Recent orders
              </h3>
              {detail.orders?.length ? (
                <ul className="mt-2 divide-y divide-slate-100">
                  {detail.orders.slice(0, 5).map((order) => (
                    <li key={order._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div>
                        <p className="text-xs font-bold text-ink-800">{order.orderNumber}</p>
                        <p className="text-[10px] text-ink-400">{formatDateTime(order.createdAt)} · {order.orderItems?.length || 0} line item(s)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-900">{formatCurrency(order.totalPrice)}</span>
                        <span className={`badge ${ORDER_STATUS_CLASSES[order.orderStatus] || 'bg-slate-100 text-slate-600'}`}>{order.orderStatus}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2.5 text-xs text-ink-400">This account has not placed any orders yet.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-100 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-600">
                <ShieldCheck size={14} className="text-brand-600" /> Access management
              </h3>
              {isSelf(detail.user._id) ? (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
                  You cannot block your own account or change your own role. Ask another administrator to make changes.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="flex-1">
                      <span className="label">Account role</span>
                      <select value={roleDraft} onChange={(event) => setRoleDraft(event.target.value)} className="input">
                        <option value="customer">Customer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={updateRole}
                      disabled={roleSaving || roleDraft === detail.user.role}
                      className="btn-primary px-3.5 py-2.5 text-xs"
                    >
                      {roleSaving ? 'Updating…' : 'Update role'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-[11px] leading-5 text-ink-500">
                      {detail.user.isBlocked
                        ? 'This account is blocked and cannot log in or place orders.'
                        : 'Blocking immediately prevents this account from logging in.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBlockTarget(detail.user)}
                      className={`${detail.user.isBlocked ? 'btn-outline' : 'btn-danger'} px-3 py-2 text-xs`}
                    >
                      {detail.user.isBlocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                      {detail.user.isBlocked ? 'Unblock account' : 'Block account'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </Modal>

      <ConfirmationModal
        open={Boolean(blockTarget)}
        title={blockTarget?.isBlocked ? 'Unblock this account?' : 'Block this account?'}
        message={
          blockTarget?.isBlocked
            ? `${blockTarget?.name || 'This account'} will be able to log in and shop again.`
            : `${blockTarget?.name || 'This account'} will be signed out and prevented from logging in or placing new orders. Existing orders are not affected.`
        }
        confirmLabel={blockTarget?.isBlocked ? 'Unblock account' : 'Block account'}
        cancelLabel="Cancel"
        danger={!blockTarget?.isBlocked}
        loading={blockSaving}
        onClose={() => setBlockTarget(null)}
        onConfirm={confirmBlock}
      />
    </div>
  );
};

export default AdminUsers;

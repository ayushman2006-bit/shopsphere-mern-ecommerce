import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { categoryService } from '../../services/category.service';
import { getApiError } from '../../services/api';
import { formatNumber } from '../../utils/format';
import { handleImageError, resolveImage } from '../../utils/image';

const emptyForm = { name: '', description: '', image: '' };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await categoryService.list();
      setCategories(data.categories || []);
    } catch (err) {
      setError(getApiError(err, 'Could not load categories.'));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description || '').toLowerCase().includes(term)
    );
  }, [categories, search]);

  const totalProducts = categories.reduce((sum, category) => sum + (category.productCount || 0), 0);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
    });
    setFormOpen(true);
  };

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
      };
      if (editing) {
        await categoryService.update(editing._id, payload);
        toast.success('Category updated');
      } else {
        await categoryService.create(payload);
        toast.success('Category created');
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not save this category'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoryService.remove(deleteTarget._id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not delete this category'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Merchandising</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">Categories</h2>
          <p className="mt-1 text-sm text-ink-500">
            {loading
              ? 'Loading categories…'
              : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} · ${formatNumber(totalProducts)} product${totalProducts === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className="btn-outline px-3 py-2 text-xs" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button type="button" onClick={openCreate} className="btn-primary px-3.5 py-2 text-xs">
            <Plus size={15} /> Add category
          </button>
        </div>
      </div>

      <div className="card flex items-center gap-3 p-3">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories by name or description…"
            className="input h-11 py-0 pl-10 pr-10 text-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-6"><LoadingSpinner label="Loading categories…" /></div>
      ) : error ? (
        <ErrorState title="Could not load categories" message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={search ? 'No categories match that search' : 'No categories yet'}
          description={
            search
              ? 'Try a different search term or clear the search to see every category.'
              : 'Create categories to organise how customers browse the catalogue.'
          }
          actionLabel={search ? 'Clear search' : 'Add category'}
          onAction={search ? () => setSearch('') : openCreate}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <article key={category._id} className="card group overflow-hidden">
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800">
                {category.image ? (
                  <img
                    src={resolveImage(category.image)}
                    alt={category.name}
                    onError={handleImageError}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/70">
                    <Tags size={34} strokeWidth={1.6} />
                  </div>
                )}
                <span className="absolute left-3 top-3 badge bg-white/90 text-ink-700 backdrop-blur">
                  {category.productCount || 0} product{category.productCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-ink-900">{category.name}</h3>
                    <p className="truncate text-[10px] font-mono text-ink-400">/{category.slug}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      title="Edit category"
                      aria-label={`Edit ${category.name}`}
                      className="rounded-lg p-1.5 text-ink-400 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      disabled={(category.productCount || 0) > 0}
                      title={(category.productCount || 0) > 0 ? 'Move or delete its products first' : 'Delete category'}
                      aria-label={`Delete ${category.name}`}
                      className="rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-ink-500">
                  {category.description || 'No description added yet.'}
                </p>
                {(category.productCount || 0) > 0 && (
                  <p className="mt-2 text-[10px] text-ink-400">
                    Reassign its {category.productCount} product{category.productCount === 1 ? '' : 's'} before deleting.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={saving ? () => {} : () => setFormOpen(false)}
        title={editing ? 'Edit category' : 'Add a category'}
        description={editing ? 'Update how this category appears to customers.' : 'Group related products into a browsable category.'}
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="category-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <label>
            <span className="label">Category name</span>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="input"
              placeholder="e.g. Electronics"
              maxLength={80}
              required
            />
          </label>

          <label>
            <span className="label">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="A short line shown on the category page."
              maxLength={500}
            />
          </label>

          <label>
            <span className="label">Cover image URL <span className="font-normal normal-case text-ink-300">optional</span></span>
            <input
              value={form.image}
              onChange={(event) => updateField('image', event.target.value)}
              className="input"
              placeholder="/uploads/seed/p01-1.jpg or https://…"
            />
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-white">
              {form.image ? (
                <img src={resolveImage(form.image)} alt="Category preview" onError={handleImageError} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ink-300">
                  <ImagePlus size={22} />
                </div>
              )}
            </div>
            <p className="text-[11px] leading-5 text-ink-500">
              Paste a path to an uploaded image or a full external URL. Leave empty to use the default category tile.
            </p>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete this category?"
        message={`“${deleteTarget?.name || ''}” will be removed from the storefront. Categories that still contain products cannot be deleted.`}
        confirmLabel="Delete category"
        cancelLabel="Keep category"
        danger
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminCategories;

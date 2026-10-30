import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ImagePlus,
  Minus,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { categoryService } from '../../services/category.service';
import { getApiError } from '../../services/api';
import { productService } from '../../services/product.service';
import { formatCurrency, formatNumber, formatDate } from '../../utils/format';
import { handleImageError, resolveImage } from '../../utils/image';
import { SORT_OPTIONS } from '../../utils/constants';

const emptyForm = {
  name: '',
  shortDescription: '',
  description: '',
  price: '',
  discountPrice: '',
  category: '',
  brand: 'ShopSphere',
  stock: '0',
  highlights: '',
  images: '',
  isFeatured: false,
  isTrending: false,
};

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const [keywordInput, setKeywordInput] = useState(keyword);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockValue, setStockValue] = useState('0');
  const [stockSaving, setStockSaving] = useState(false);
  const [stockBusy, setStockBusy] = useState(null);

  const queryString = searchParams.toString();

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  useEffect(() => {
    categoryService
      .list()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10, sort };
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      const data = await productService.list(params);
      setProducts(data.products || []);
      setMeta({ page: data.page || 1, pages: data.pages || 0, total: data.total || 0 });
    } catch (err) {
      setError(getApiError(err, 'Could not load the product catalogue.'));
      setProducts([]);
      setMeta({ page: 1, pages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, sort, keyword, category]);

  useEffect(() => {
    load();
  }, [load]);

  const updateParams = useCallback(
    (updates) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) next.delete(key);
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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, category: categories[0]?._id || '' });
    setFiles([]);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      discountPrice: product.discountPrice == null ? '' : String(product.discountPrice),
      category: product.category?._id || product.category || '',
      brand: product.brand || 'ShopSphere',
      stock: String(product.stock ?? 0),
      highlights: (product.highlights || []).join('\n'),
      images: (product.images || []).join('\n'),
      isFeatured: Boolean(product.isFeatured),
      isTrending: Boolean(product.isTrending),
    });
    setFiles([]);
    setFormOpen(true);
  };

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const imageUrls = useMemo(
    () => form.images.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    [form.images]
  );

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 6) {
      toast.error('You can upload up to 6 images at a time');
      event.target.value = '';
      return;
    }
    setFiles(selected);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Product name must be at least 2 characters');
      return;
    }
    if (form.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    if (!form.category) {
      toast.error('Please choose a category');
      return;
    }
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (form.discountPrice !== '' && Number(form.discountPrice) >= price) {
      toast.error('Discount price must be lower than the regular price');
      return;
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error('Stock must be a non-negative whole number');
      return;
    }
    if (imageUrls.length === 0 && files.length === 0) {
      toast.error('Add at least one image URL or upload an image');
      return;
    }

    const payload = new FormData();
    payload.append('name', form.name.trim());
    payload.append('shortDescription', form.shortDescription.trim());
    payload.append('description', form.description.trim());
    payload.append('price', String(price));
    payload.append('discountPrice', form.discountPrice === '' ? '' : String(Number(form.discountPrice)));
    payload.append('category', form.category);
    payload.append('brand', form.brand.trim());
    payload.append('stock', String(stock));
    payload.append('highlights', JSON.stringify(
      form.highlights.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
    ));
    payload.append('images', JSON.stringify(imageUrls));
    payload.append('isFeatured', String(form.isFeatured));
    payload.append('isTrending', String(form.isTrending));
    files.forEach((file) => payload.append('images', file));

    setSaving(true);
    try {
      if (editing) {
        await productService.update(editing._id, payload);
        toast.success('Product updated');
      } else {
        await productService.create(payload);
        toast.success('Product created');
      }
      setFormOpen(false);
      setEditing(null);
      setFiles([]);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not save this product'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productService.remove(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      if (products.length === 1 && page > 1) updateParams({ page: page - 1 });
      else await load();
    } catch (err) {
      toast.error(getApiError(err, 'Could not delete this product'));
    } finally {
      setDeleting(false);
    }
  };

  const openStock = (product) => {
    setStockTarget(product);
    setStockValue(String(product.stock ?? 0));
  };

  const applyStock = (id, nextStock) => {
    setProducts((current) =>
      current.map((product) => (product._id === id ? { ...product, stock: nextStock } : product))
    );
  };

  const saveStock = async () => {
    if (!stockTarget) return;
    const value = Number(stockValue);
    if (!Number.isInteger(value) || value < 0) {
      toast.error('Stock must be a non-negative whole number');
      return;
    }
    setStockSaving(true);
    try {
      const data = await productService.updateStock(stockTarget._id, { stock: value });
      applyStock(stockTarget._id, data.stock);
      toast.success('Stock updated');
      setStockTarget(null);
    } catch (err) {
      toast.error(getApiError(err, 'Could not update stock'));
    } finally {
      setStockSaving(false);
    }
  };

  const adjustStock = async (product, delta) => {
    if (product.stock + delta < 0) return;
    setStockBusy(product._id);
    try {
      const data = await productService.updateStock(product._id, { delta });
      applyStock(product._id, data.stock);
    } catch (err) {
      toast.error(getApiError(err, 'Could not update stock'));
    } finally {
      setStockBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Catalogue</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">Products</h2>
          <p className="mt-1 text-sm text-ink-500">
            {loading ? 'Loading catalogue…' : `${formatNumber(meta.total)} product${meta.total === 1 ? '' : 's'} in the catalogue`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className="btn-outline px-3 py-2 text-xs" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button type="button" onClick={openCreate} className="btn-primary px-3.5 py-2 text-xs">
            <Plus size={15} /> Add product
          </button>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
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
            placeholder="Search by product name, brand or description…"
            className="input h-11 py-0 pl-10 pr-24 text-xs"
          />
          <button type="submit" className="btn-primary absolute right-1.5 top-1.5 h-8 px-3 text-[11px]">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={category}
              onChange={(event) => updateParams({ category: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-44"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-44"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>

          {(keyword || category || sort !== 'newest') && (
            <button type="button" onClick={resetFilters} className="btn-ghost px-2.5 py-2 text-xs text-ink-500">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-6"><LoadingSpinner label="Loading products…" /></div>
      ) : error ? (
        <ErrorState title="Could not load products" message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={keyword || category ? 'No products match those filters' : 'No products yet'}
          description={
            keyword || category
              ? 'Try a broader search or clear the filters to see the full catalogue.'
              : 'Add your first product to start selling on ShopSphere.'
          }
          actionLabel={keyword || category ? 'Clear filters' : 'Add product'}
          onAction={keyword || category ? resetFilters : openCreate}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Stock</th>
                  <th className="table-th">Rating</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product._id} className="transition hover:bg-slate-50/60">
                    <td className="table-td max-w-[280px]">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                          <img
                            src={resolveImage(product.images?.[0])}
                            alt={product.name}
                            onError={handleImageError}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-bold text-ink-900">{product.name}</p>
                          <p className="text-[10px] text-ink-400">{product.brand || 'ShopSphere'} · {formatDate(product.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-xs text-ink-500">{product.category?.name || '—'}</td>
                    <td className="table-td">
                      <p className="font-bold text-ink-900">{formatCurrency(product.finalPrice ?? product.price)}</p>
                      {product.discountPrice != null && product.discountPrice < product.price && (
                        <p className="text-[10px] text-ink-400 line-through">{formatCurrency(product.price)}</p>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustStock(product, -1)}
                          disabled={stockBusy === product._id || product.stock <= 0}
                          aria-label={`Decrease stock for ${product.name}`}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-ink-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openStock(product)}
                          title="Set stock"
                          className={`min-w-10 rounded-md px-1.5 py-0.5 text-center text-xs font-bold transition hover:bg-slate-100 ${
                            product.stock === 0 ? 'text-rose-600' : product.stock <= 5 ? 'text-amber-600' : 'text-ink-800'
                          }`}
                        >
                          {stockBusy === product._id ? '…' : product.stock}
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStock(product, 1)}
                          disabled={stockBusy === product._id}
                          aria-label={`Increase stock for ${product.name}`}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-ink-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="flex items-center gap-1 text-xs font-semibold text-ink-700">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {Number(product.ratings || 0).toFixed(1)}
                        <span className="font-normal text-ink-400">({product.numReviews || 0})</span>
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`badge ${
                            product.stock === 0
                              ? 'bg-rose-50 text-rose-700'
                              : product.stock <= 5
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? 'Low stock' : 'In stock'}
                        </span>
                        {product.isFeatured && <span className="badge bg-brand-50 text-brand-700">Featured</span>}
                        {product.isTrending && <span className="badge bg-indigo-50 text-indigo-700">Trending</span>}
                      </div>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-brand-50 hover:text-brand-700"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                          className="rounded-lg p-2 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
        open={formOpen}
        onClose={saving ? () => {} : () => setFormOpen(false)}
        title={editing ? 'Edit product' : 'Add a product'}
        description={editing ? 'Update the catalogue details, pricing and stock.' : 'Create a new listing for the ShopSphere catalogue.'}
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </button>
          </div>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Product name</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="input"
                placeholder="e.g. Aurora ANC Wireless Headphones"
                maxLength={160}
                required
              />
            </label>

            <label className="sm:col-span-2">
              <span className="label">Short description</span>
              <input
                value={form.shortDescription}
                onChange={(event) => updateField('shortDescription', event.target.value)}
                className="input"
                placeholder="One line that appears on product cards"
                maxLength={300}
              />
            </label>

            <label className="sm:col-span-2">
              <span className="label">Full description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                rows={4}
                className="input resize-none"
                placeholder="Describe the product, materials, features and what is included."
                maxLength={5000}
                required
              />
            </label>

            <label>
              <span className="label">Category</span>
              <select
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
                className="input"
                required
              >
                <option value="">Select a category</option>
                {categories.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Brand</span>
              <input
                value={form.brand}
                onChange={(event) => updateField('brand', event.target.value)}
                className="input"
                placeholder="ShopSphere"
                maxLength={80}
              />
            </label>

            <label>
              <span className="label">Regular price (₹)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) => updateField('price', event.target.value)}
                className="input"
                placeholder="4999"
                required
              />
            </label>

            <label>
              <span className="label">Discount price (₹) <span className="font-normal normal-case text-ink-300">optional</span></span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.discountPrice}
                onChange={(event) => updateField('discountPrice', event.target.value)}
                className="input"
                placeholder="Leave empty for no discount"
              />
            </label>

            <label>
              <span className="label">Stock quantity</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField('stock', event.target.value)}
                className="input"
                required
              />
            </label>

            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-ink-600">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateField('isFeatured', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Feature on the homepage
              </label>
              <label className="flex items-center gap-2.5 text-xs font-semibold text-ink-600">
                <input
                  type="checkbox"
                  checked={form.isTrending}
                  onChange={(event) => updateField('isTrending', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Mark as trending
              </label>
            </div>

            <label className="sm:col-span-2">
              <span className="label">Highlights <span className="font-normal normal-case text-ink-300">one per line</span></span>
              <textarea
                value={form.highlights}
                onChange={(event) => updateField('highlights', event.target.value)}
                rows={3}
                className="input resize-none"
                placeholder={'Active noise cancellation\n40-hour battery life\nUSB-C fast charging'}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <ImagePlus size={16} className="text-brand-600" />
              <h3 className="text-sm font-bold text-ink-900">Product images</h3>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">
              Add image URLs or upload files (JPG, PNG, WEBP or GIF, up to 5 MB each). The first image is used as the cover.
            </p>

            <label className="mt-3 block">
              <span className="label">Image URLs <span className="font-normal normal-case text-ink-300">one per line</span></span>
              <textarea
                value={form.images}
                onChange={(event) => updateField('images', event.target.value)}
                rows={3}
                className="input resize-none font-mono text-[11px]"
                placeholder={'https://example.com/product.jpg\n/uploads/seed/p01-1.jpg'}
              />
            </label>

            {imageUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {imageUrls.slice(0, 8).map((url, index) => (
                  <div key={`${url}-${index}`} className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img src={resolveImage(url)} alt={`Preview ${index + 1}`} onError={handleImageError} className="h-full w-full object-cover" />
                    {index === 0 && (
                      <span className="absolute inset-x-0 bottom-0 bg-ink-950/70 py-0.5 text-center text-[8px] font-bold uppercase tracking-wider text-white">Cover</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-xs font-semibold text-ink-500 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700">
                <UploadCloud size={17} />
                Choose images to upload
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleFiles} className="sr-only" />
              </label>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-ink-600">
                      <span className="truncate">{file.name} <span className="text-ink-400">({Math.round(file.size / 1024)} KB)</span></span>
                      <button
                        type="button"
                        onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        className="rounded p-0.5 text-ink-400 hover:text-rose-600"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(stockTarget)}
        onClose={stockSaving ? () => {} : () => setStockTarget(null)}
        title="Update stock"
        description={stockTarget ? `Set the available units for ${stockTarget.name}.` : ''}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-outline" onClick={() => setStockTarget(null)} disabled={stockSaving}>Cancel</button>
            <button type="button" className="btn-primary" onClick={saveStock} disabled={stockSaving}>
              {stockSaving ? 'Saving…' : 'Save stock'}
            </button>
          </div>
        }
      >
        <label>
          <span className="label">Available units</span>
          <input
            type="number"
            min="0"
            step="1"
            value={stockValue}
            onChange={(event) => setStockValue(event.target.value)}
            className="input"
            autoFocus
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 5, 10, 25, 50].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStockValue(String(value))}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              Set {value}
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        title="Delete this product?"
        message={`“${deleteTarget?.name || ''}” will be removed from the catalogue, along with its reviews and cart/wishlist references. This cannot be undone.`}
        confirmLabel="Delete product"
        cancelLabel="Keep product"
        danger
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AdminProducts;

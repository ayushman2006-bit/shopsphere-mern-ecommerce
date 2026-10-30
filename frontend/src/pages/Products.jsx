import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import FilterSidebar from '../components/FilterSidebar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ProductGrid from '../components/ProductGrid';
import SearchBar from '../components/SearchBar';
import { categoryService } from '../services/category.service';
import { productService } from '../services/product.service';
import { SORT_OPTIONS } from '../utils/constants';
import { formatNumber } from '../utils/format';

const FILTER_KEYS = ['keyword', 'category', 'brand', 'minPrice', 'maxPrice', 'rating', 'inStock', 'featured'];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState({ products: [], page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const queryString = searchParams.toString();

  const filters = useMemo(() => {
    const params = new URLSearchParams(queryString);
    return {
      keyword: params.get('keyword') || '',
      category: params.get('category') || '',
      brand: params.get('brand') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      rating: params.get('rating') || '',
      inStock: params.get('inStock') || '',
      featured: params.get('featured') || '',
      sort: params.get('sort') || 'newest',
      page: Number(params.get('page')) || 1,
    };
  }, [queryString]);

  useEffect(() => {
    Promise.all([categoryService.list(), productService.meta()])
      .then(([categoryData, metaData]) => {
        setCategories(categoryData.categories || []);
        setMeta(metaData);
      })
      .catch(() => {
        setCategories([]);
        setMeta(null);
      });
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = Object.fromEntries(new URLSearchParams(queryString));
      const result = await productService.list({ ...params, limit: 12 });
      setData({
        products: result.products || [],
        page: result.page || 1,
        pages: result.pages || 0,
        total: result.total || 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load products. Please try again.');
      setData({ products: [], page: 1, pages: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateParams = useCallback(
    (updates, { resetPage = true } = {}) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined || (key === 'page' && Number(value) <= 1)) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      if (resetPage) next.delete('page');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      if (key === 'priceRange') {
        updateParams({ minPrice: value.min, maxPrice: value.max });
        return;
      }
      if (key === 'customPrice') {
        updateParams({ minPrice: value.min, maxPrice: value.max });
        return;
      }
      updateParams({ [key]: value });
    },
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const activeCategory = categories.find((category) => category.slug === filters.category);
  const activeChips = [];

  if (filters.keyword) activeChips.push({ key: 'keyword', label: `“${filters.keyword}”` });
  if (filters.category) activeChips.push({ key: 'category', label: activeCategory?.name || filters.category });
  if (filters.brand) activeChips.push({ key: 'brand', label: filters.brand });
  if (filters.rating) activeChips.push({ key: 'rating', label: `${filters.rating}★ & above` });
  if (filters.minPrice || filters.maxPrice) {
    activeChips.push({
      key: 'price',
      label: `₹${filters.minPrice || 0} – ${filters.maxPrice ? `₹${filters.maxPrice}` : 'Any'}`,
    });
  }
  if (filters.inStock === 'true') activeChips.push({ key: 'inStock', label: 'In stock' });
  if (filters.featured === 'true') activeChips.push({ key: 'featured', label: 'Featured' });

  const removeChip = (key) => {
    if (key === 'price') updateParams({ minPrice: '', maxPrice: '' });
    else updateParams({ [key]: '' });
  };

  const heading = filters.keyword
    ? `Results for “${filters.keyword}”`
    : activeCategory?.name || (filters.featured === 'true' ? 'Featured deals' : 'All products');

  return (
    <div className="container-page py-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Shop', to: '/products' }]} current={heading} />

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">Catalogue</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{heading}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-500">
            {activeCategory?.description ||
              'Search, filter and sort the full ShopSphere catalogue. Every product is in stock unless marked otherwise.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-ink-400 sm:block">
            {loading ? 'Loading…' : `${formatNumber(data.total)} product${data.total === 1 ? '' : 's'}`}
          </span>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="btn-outline px-3.5 py-2.5 text-xs lg:hidden"
          >
            <Filter size={15} /> Filters
            {activeChips.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {activeChips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-soft sm:flex-row sm:items-center">
        <SearchBar
          defaultValue={filters.keyword}
          onSearch={(keyword) => updateParams({ keyword })}
          className="flex-1"
          placeholder="Search the catalogue…"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="hidden text-xs font-semibold text-ink-400 sm:block">
            Sort by
          </label>
          <div className="relative flex-1 sm:flex-none">
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => updateParams({ sort: event.target.value })}
              className="input h-11 appearance-none py-0 pr-9 text-xs font-semibold sm:w-52"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {activeChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => removeChip(chip.key)}
            className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-100"
          >
            {chip.label} <X size={12} />
          </button>
        ))}
        {activeChips.length > 0 && (
          <button type="button" onClick={clearFilters} className="px-2 text-xs font-semibold text-ink-400 underline-offset-2 transition hover:text-rose-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        <FilterSidebar
          categories={categories}
          meta={meta}
          filters={filters}
          onChange={handleFilterChange}
          onClear={clearFilters}
          className="hidden lg:block"
        />

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-ink-400">
              {loading ? 'Finding the best matches…' : `Showing ${data.products.length} of ${formatNumber(data.total)} results`}
            </p>
            {filters.category && (
              <Link to={`/products?category=${filters.category}`} className="hidden text-xs font-semibold text-brand-600 hover:text-brand-800 sm:block">
                View category only
              </Link>
            )}
          </div>

          <ProductGrid
            products={data.products}
            loading={loading}
            error={error}
            skeletonCount={12}
            onRetry={loadProducts}
            onClearFilters={activeChips.length ? clearFilters : undefined}
            emptyTitle={filters.keyword ? 'No matches for that search' : 'No products match those filters'}
            emptyDescription="Try a broader search, remove a filter, or explore another category."
          />

          {data.pages > 1 && (
            <Pagination
              page={data.page}
              pages={data.pages}
              onChange={(page) => updateParams({ page }, { resetPage: false })}
              className="mt-8"
            />
          )}
        </div>
      </div>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter products"
        description="Narrow the catalogue to exactly what you need."
        size="sm"
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={clearFilters} className="btn-outline flex-1">
              Clear all
            </button>
            <button type="button" onClick={() => setFilterOpen(false)} className="btn-primary flex-1">
              Show results
            </button>
          </div>
        }
      >
        <FilterSidebar
          categories={categories}
          meta={meta}
          filters={filters}
          onChange={handleFilterChange}
          onClear={clearFilters}
        />
      </Modal>
    </div>
  );
};

export default Products;

import { useEffect, useState } from 'react';
import { Check, RotateCcw, SlidersHorizontal, Star } from 'lucide-react';
import clsx from 'clsx';
import { PRICE_RANGES, RATING_OPTIONS } from '../utils/constants';
import { formatCurrency } from '../utils/format';

const FilterSidebar = ({ categories = [], meta, filters, onChange, onClear, className = '' }) => {
  const [minPrice, setMinPrice] = useState(filters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice || '');

  useEffect(() => {
    setMinPrice(filters.minPrice || '');
    setMaxPrice(filters.maxPrice || '');
  }, [filters.minPrice, filters.maxPrice]);

  const selectedRange = PRICE_RANGES.find(
    (range) =>
      String(range.min) === String(filters.minPrice || '') &&
      String(range.max) === String(filters.maxPrice || '')
  );

  return (
    <aside className={clsx('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <SlidersHorizontal size={16} className="text-brand-600" /> Filters
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-800"
        >
          <RotateCcw size={13} /> Clear all
        </button>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">Category</h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onChange('category', '')}
            className={clsx(
              'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
              !filters.category ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:bg-slate-50'
            )}
          >
            All categories
            {!filters.category && <Check size={14} />}
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => onChange('category', category.slug)}
              className={clsx(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
                filters.category === category.slug
                  ? 'bg-brand-50 font-semibold text-brand-700'
                  : 'text-ink-600 hover:bg-slate-50'
              )}
            >
              <span>{category.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-ink-400">{category.productCount}</span>
                {filters.category === category.slug && <Check size={14} />}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">Price</h3>
        <div className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const active = selectedRange?.label === range.label;
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => onChange('priceRange', range)}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
                  active ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:bg-slate-50'
                )}
              >
                {range.label}
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-[10px] font-semibold uppercase text-ink-400">Min</span>
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder={meta?.minPrice ? String(meta.minPrice) : '0'}
              className="input px-2.5 py-2 text-xs"
            />
          </label>
          <span className="pb-2.5 text-ink-300">–</span>
          <label className="flex-1">
            <span className="mb-1 block text-[10px] font-semibold uppercase text-ink-400">Max</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder={meta?.maxPrice ? String(meta.maxPrice) : 'Any'}
              className="input px-2.5 py-2 text-xs"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => onChange('customPrice', { min: minPrice, max: maxPrice })}
          className="btn-outline mt-3 w-full py-2 text-xs"
        >
          Apply price
        </button>
        {meta?.maxPrice > 0 && (
          <p className="mt-2 text-[11px] text-ink-400">
            Range in store: {formatCurrency(meta.minPrice)} – {formatCurrency(meta.maxPrice)}
          </p>
        )}
      </div>

      <div className="card p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">Customer rating</h3>
        <div className="space-y-1">
          {RATING_OPTIONS.map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange('rating', filters.rating === String(rating) ? '' : rating)}
              className={clsx(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition',
                filters.rating === String(rating)
                  ? 'bg-brand-50 font-semibold text-brand-700'
                  : 'text-ink-600 hover:bg-slate-50'
              )}
            >
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={13}
                    className={star <= rating ? 'fill-accent-400 text-accent-400' : 'text-slate-300'}
                  />
                ))}
              </span>
              <span>& above</span>
            </button>
          ))}
        </div>
      </div>

      {meta?.brands?.length > 0 && (
        <div className="card p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400">Brand</h3>
          <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onChange('brand', '')}
              className={clsx(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
                !filters.brand ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:bg-slate-50'
              )}
            >
              All brands {!filters.brand && <Check size={14} />}
            </button>
            {meta.brands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => onChange('brand', filters.brand === brand ? '' : brand)}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition',
                  filters.brand === brand ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:bg-slate-50'
                )}
              >
                {brand} {filters.brand === brand && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-ink-700">
          In stock only
          <input
            type="checkbox"
            checked={filters.inStock === 'true'}
            onChange={(event) => onChange('inStock', event.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
        </label>
        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-ink-700">
          Featured only
          <input
            type="checkbox"
            checked={filters.featured === 'true'}
            onChange={(event) => onChange('featured', event.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
        </label>
      </div>
    </aside>
  );
};

export default FilterSidebar;

import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const getPages = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const items = [1];
  if (page > 3) items.push('start-ellipsis');
  for (let value = Math.max(2, page - 1); value <= Math.min(pages - 1, page + 1); value += 1) {
    items.push(value);
  }
  if (page < pages - 2) items.push('end-ellipsis');
  items.push(pages);
  return items;
};

const Pagination = ({ page = 1, pages = 1, onChange, className = '' }) => {
  if (pages <= 1) return null;

  return (
    <nav className={clsx('flex flex-wrap items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange?.(page - 1)}
        disabled={page <= 1}
        className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-ink-600 transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={15} /> Prev
      </button>
      {getPages(page, pages).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            onClick={() => onChange?.(item)}
            aria-current={item === page ? 'page' : undefined}
            className={clsx(
              'h-9 w-9 rounded-lg text-xs font-bold transition',
              item === page
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-ink-600 hover:border-brand-200 hover:text-brand-700'
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-1 text-xs text-ink-400">
            …
          </span>
        )
      )}
      <button
        type="button"
        onClick={() => onChange?.(page + 1)}
        disabled={page >= pages}
        className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-ink-600 transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight size={15} />
      </button>
    </nav>
  );
};

export default Pagination;

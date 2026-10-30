import { Star } from 'lucide-react';
import clsx from 'clsx';

const RatingStars = ({
  rating = 0,
  size = 15,
  showValue = false,
  count,
  interactive = false,
  onChange,
  className = '',
}) => {
  const rounded = Math.round(Number(rating) || 0);

  if (interactive) {
    return (
      <div className={clsx('flex items-center gap-1', className)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rounded === value}
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            onClick={() => onChange?.(value)}
            className="rounded p-0.5 transition hover:scale-110"
          >
            <Star
              size={size + 6}
              className={value <= rounded ? 'fill-accent-400 text-accent-400' : 'text-slate-300'}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5" aria-label={`${Number(rating).toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            size={size}
            className={value <= rounded ? 'fill-accent-400 text-accent-400' : 'text-slate-300'}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-ink-700">
          {Number(rating || 0).toFixed(1)}
          {count !== undefined && <span className="ml-1 font-normal text-ink-400">({count})</span>}
        </span>
      )}
    </div>
  );
};

export default RatingStars;

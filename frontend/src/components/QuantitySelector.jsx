import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

const QuantitySelector = ({
  value = 1,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  disabled = false,
}) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
  };
  const buttonSize = sizes[size] || sizes.md;

  return (
    <div
      className={clsx(
        'inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm',
        disabled && 'opacity-60'
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange?.(Math.max(min, value - 1))}
        className={clsx(
          buttonSize,
          'flex items-center justify-center rounded-lg text-ink-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'
        )}
      >
        <Minus size={15} />
      </button>
      <span className="min-w-9 text-center text-sm font-bold text-ink-900" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange?.(Math.min(max, value + 1))}
        className={clsx(
          buttonSize,
          'flex items-center justify-center rounded-lg text-ink-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'
        )}
      >
        <Plus size={15} />
      </button>
    </div>
  );
};

export default QuantitySelector;

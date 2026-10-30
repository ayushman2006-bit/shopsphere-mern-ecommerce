import { formatCurrency, getDiscountPercent } from '../utils/format';

const Price = ({ price, discountPrice, size = 'md', showDiscount = true, className = '' }) => {
  const finalPrice = discountPrice || price;
  const discount = getDiscountPercent(price, discountPrice);
  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-extrabold tracking-tight text-ink-900 ${sizes[size] || sizes.md}`}>
        {formatCurrency(finalPrice)}
      </span>
      {discountPrice && discountPrice < price && (
        <>
          <span className="text-sm font-medium text-ink-400 line-through">{formatCurrency(price)}</span>
          {showDiscount && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
              {discount}% off
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default Price;

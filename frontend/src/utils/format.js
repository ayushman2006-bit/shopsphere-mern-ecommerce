// Small helpers used by several pages.

// Format a number as Indian Rupees, for example 2499 -> ₹2,499
export const formatPrice = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

// Format a date like "31 Oct 2026"
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

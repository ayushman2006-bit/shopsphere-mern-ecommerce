export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Most popular' },
  { value: 'name', label: 'Name: A to Z' },
];

export const PRICE_RANGES = [
  { label: 'Under ₹1,000', min: 0, max: 999 },
  { label: '₹1,000 – ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 – ₹15,000', min: 5000, max: 15000 },
  { label: '₹15,000 – ₹30,000', min: 15000, max: 30000 },
  { label: 'Above ₹30,000', min: 30000, max: '' },
];

export const RATING_OPTIONS = [4, 3, 2, 1];

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 49;

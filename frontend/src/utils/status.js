export const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export const ORDER_STATUS_CLASSES = {
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Processing: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Shipped: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

export const PAYMENT_STATUS_CLASSES = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Refunded: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  Failed: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
};

export const TRACK_STEPS = [
  { key: 'Pending', label: 'Order placed', description: 'We have received your order.' },
  { key: 'Processing', label: 'Processing', description: 'Your items are being prepared.' },
  { key: 'Shipped', label: 'Shipped', description: 'Your parcel is on the way.' },
  { key: 'Delivered', label: 'Delivered', description: 'Delivered to your address.' },
];

export const canCancelOrder = (status) => ['Pending', 'Processing'].includes(status);

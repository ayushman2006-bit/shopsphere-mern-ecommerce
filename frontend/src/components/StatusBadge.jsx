import clsx from 'clsx';
import { ORDER_STATUS_CLASSES, PAYMENT_STATUS_CLASSES } from '../utils/status';

const StatusBadge = ({ status, type = 'order', className = '' }) => {
  const classes = type === 'payment' ? PAYMENT_STATUS_CLASSES : ORDER_STATUS_CLASSES;
  return (
    <span className={clsx('badge', classes[status] || 'bg-slate-100 text-slate-600', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;

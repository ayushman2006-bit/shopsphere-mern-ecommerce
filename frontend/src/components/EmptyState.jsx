import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  actionTo,
  onAction,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center ${className}`}>
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
      <Icon size={30} strokeWidth={1.8} />
    </div>
    <h3 className="text-lg font-bold text-ink-900">{title}</h3>
    {description && <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>}
    {actionLabel && actionTo && (
      <Link to={actionTo} className="btn-primary mt-6">
        {actionLabel}
      </Link>
    )}
    {actionLabel && onAction && (
      <button type="button" onClick={onAction} className="btn-primary mt-6">
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;

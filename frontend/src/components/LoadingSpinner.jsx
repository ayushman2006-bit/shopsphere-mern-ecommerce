import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const LoadingSpinner = ({ label = 'Loading…', fullPage = false, size = 28, className = '' }) => {
  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 size={size} className="animate-spin text-brand-600" />
        <p className="text-sm font-medium text-ink-500">{label}</p>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center justify-center gap-2 py-10', className)}>
      <Loader2 size={size} className="animate-spin text-brand-600" />
      <span className="text-sm font-medium text-ink-500">{label}</span>
    </div>
  );
};

export default LoadingSpinner;

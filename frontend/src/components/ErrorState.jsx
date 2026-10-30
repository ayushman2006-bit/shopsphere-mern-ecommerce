import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorState = ({ title = 'Something went wrong', message = 'We could not load this page.', onRetry, className = '' }) => (
  <div className={`flex flex-col items-center justify-center rounded-3xl border border-rose-100 bg-rose-50/50 px-6 py-14 text-center ${className}`}>
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
      <AlertTriangle size={26} />
    </div>
    <h3 className="text-lg font-bold text-ink-900">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-outline mt-6">
        <RefreshCw size={16} /> Try again
      </button>
    )}
  </div>
);

export default ErrorState;

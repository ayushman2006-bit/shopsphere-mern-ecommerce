import clsx from 'clsx';

const tones = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  slate: 'bg-slate-100 text-slate-600',
};

const StatCard = ({ label, value, icon: Icon, tone = 'brand', helper, className = '' }) => (
  <div className={clsx('card p-5 transition hover:shadow-card', className)}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900">{value}</p>
        {helper && <p className="mt-1 text-xs text-ink-400">{helper}</p>}
      </div>
      {Icon && (
        <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone] || tones.brand)}>
          <Icon size={21} strokeWidth={2} />
        </span>
      )}
    </div>
  </div>
);

export default StatCard;

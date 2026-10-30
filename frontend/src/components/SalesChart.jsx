import { formatCurrency, formatNumber } from '../utils/format';

const SalesChart = ({ data = [], loading = false }) => {
  if (loading) {
    return <div className="skeleton h-64 w-full" />;
  }

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-ink-400">
        No sales data for this period yet.
      </div>
    );
  }

  const max = Math.max(...data.map((entry) => entry.revenue), 1);
  const total = data.reduce((sum, entry) => sum + entry.revenue, 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Revenue in period</p>
          <p className="mt-1 text-2xl font-extrabold text-ink-900">{formatCurrency(total)}</p>
        </div>
        <p className="text-xs text-ink-400">{formatNumber(data.reduce((sum, entry) => sum + entry.orders, 0))} orders</p>
      </div>

      <div className="relative flex h-56 items-end gap-1.5 sm:gap-2">
        {[0, 25, 50, 75, 100].map((percent) => (
          <div
            key={percent}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-100"
            style={{ bottom: `${percent}%` }}
          />
        ))}
        {data.map((entry) => {
          const height = Math.max(3, Math.round((entry.revenue / max) * 100));
          return (
            <div key={entry.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="relative flex flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-300 group-hover:from-brand-700 group-hover:to-brand-500"
                  style={{ height: `${height}%` }}
                  title={`${entry.label}: ${formatCurrency(entry.revenue)} (${entry.orders} orders)`}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                  {formatCurrency(entry.revenue)}
                  <span className="block font-normal text-white/60">{entry.orders} orders</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((entry) => (
          <div key={entry.date} className="flex-1 text-center text-[10px] font-medium text-ink-400">
            {entry.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesChart;

const PageHeader = ({ eyebrow, title, description, action, className = '' }) => (
  <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div>
      {eyebrow && (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
      )}
      <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default PageHeader;

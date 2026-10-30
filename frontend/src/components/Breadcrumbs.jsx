import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ items = [], current }) => (
  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-400">
    <Link to="/" className="transition hover:text-brand-600">
      Home
    </Link>
    {items.map((item) => (
      <span key={item.label} className="flex items-center gap-1.5">
        <ChevronRight size={13} />
        {item.to ? (
          <Link to={item.to} className="transition hover:text-brand-600">
            {item.label}
          </Link>
        ) : (
          <span>{item.label}</span>
        )}
      </span>
    ))}
    {current && (
      <span className="flex items-center gap-1.5">
        <ChevronRight size={13} />
        <span className="max-w-[220px] truncate text-ink-600">{current}</span>
      </span>
    )}
  </nav>
);

export default Breadcrumbs;

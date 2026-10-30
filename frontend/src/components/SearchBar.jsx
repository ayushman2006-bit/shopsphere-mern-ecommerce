import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const SearchBar = ({
  defaultValue = '',
  placeholder = 'Search for products, brands and more…',
  className = '',
  onSearch,
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(defaultValue);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const keyword = query.trim();
    if (onSearch) {
      onSearch(keyword);
      return;
    }
    navigate(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : '/products');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search products"
        className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-24 text-sm text-ink-800 transition placeholder:text-ink-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full bg-brand-600 px-4 text-xs font-semibold text-white transition hover:bg-brand-700"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;

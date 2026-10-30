import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { handleImageError, resolveImage } from '../utils/image';

const CategoryCard = ({ category, className = '' }) => (
  <Link
    to={`/products?category=${category.slug}`}
    className={`group relative flex min-h-[180px] flex-col justify-end overflow-hidden rounded-2xl bg-ink-900 p-5 text-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card ${className}`}
  >
    <img
      src={resolveImage(category.image)}
      alt={category.name}
      loading="lazy"
      onError={handleImageError}
      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-transparent" />
    <div className="relative">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-white">{category.name}</h3>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-ink-900">
          <ArrowUpRight size={15} />
        </span>
      </div>
      <p className="text-xs text-white/70">{category.productCount || 0} products</p>
    </div>
  </Link>
);

export default CategoryCard;

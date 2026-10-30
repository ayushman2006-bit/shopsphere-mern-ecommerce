import ProductCard, { ProductCardSkeleton } from './ProductCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

const ProductGrid = ({
  products = [],
  loading = false,
  error = '',
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search or filters to find what you are looking for.',
  onRetry,
  onClearFilters,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${className}`}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load products" message={error} onRetry={onRetry} />;
  }

  if (!products.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onClearFilters ? 'Clear filters' : undefined}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [searchParams] = useSearchParams();

  // The category can come from a link on the home page, for example /products?category=Books
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the list of categories once.
  useEffect(() => {
    api
      .get('/products/categories')
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  // Load products again whenever the search text or category changes.
  useEffect(() => {
    setLoading(true);
    setError('');

    const params = {};
    if (search.trim()) params.search = search.trim();
    if (category !== 'All') params.category = category;

    api
      .get('/products', { params })
      .then((response) => setProducts(response.data))
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [search, category]);

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
  };

  const hasFilters = search.trim() !== '' || category !== 'All';

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>All Products</h1>
          <p>Search our catalogue and add your favourites to the cart.</p>
        </div>

        <div className="filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button type="button" className="btn btn-outline" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!loading && !error && (
          <p className="results-info">
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            {category !== 'All' ? ` in ${category}` : ''}
            {search.trim() ? ` for "${search.trim()}"` : ''}
          </p>
        )}

        {loading ? (
          <div className="page-loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <h2>No products found</h2>
            <p>Try a different search term or category.</p>
            {hasFilters && (
              <button type="button" className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

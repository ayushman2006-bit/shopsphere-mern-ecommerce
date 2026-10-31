import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load products from the backend when the page opens.
  useEffect(() => {
    api
      .get('/products')
      .then((response) => setProducts(response.data))
      .catch(() => setError('Could not load products. Please check that the backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = products.slice(0, 4);
  const categories = [...new Set(products.map((product) => product.category))];

  return (
    <div className="page">
      <div className="container">
        {/* Hero section */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">Simple. Fast. Reliable.</span>
            <h1>Everything you need, in one place.</h1>
            <p>
              Discover quality products at honest prices. Browse our collection, add
              your favourites to the cart and place your order in a few clicks.
            </p>

            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary">
                Shop Now
              </Link>
              <Link to="/cart" className="btn btn-outline">
                View Cart
              </Link>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <strong>{products.length || '—'}</strong>
                <span>Products</span>
              </div>
              <div className="hero-stat">
                <strong>{categories.length || '—'}</strong>
                <span>Categories</span>
              </div>
              <div className="hero-stat">
                <strong>100%</strong>
                <span>Secure Login</span>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img src="/uploads/seed/p01-1.jpg" alt="Featured headphones" />
          </div>
        </section>

        {/* Small feature strip */}
        <section className="features">
          <div className="feature">
            <div className="feature-icon">✓</div>
            <h3>Quality Products</h3>
            <p>Every item is stored and managed directly in our MongoDB database.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <h3>Secure Accounts</h3>
            <p>Passwords are hashed with bcrypt and protected with JWT authentication.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">↺</div>
            <h3>Easy Ordering</h3>
            <p>Add products to your cart, place an order and track its status.</p>
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="section">
            <div className="section-heading">
              <div>
                <h2>Shop by category</h2>
                <p>Find what you need faster.</p>
              </div>
            </div>

            <div className="category-row">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="category-chip"
                >
                  {category}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
        <section className="section">
          <div className="section-heading">
            <div>
              <h2>Featured products</h2>
              <p>A few popular picks from our store.</p>
            </div>
            <Link to="/products" className="text-link">
              View all products →
            </Link>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="page-loading">Loading products...</div>
          ) : featuredProducts.length === 0 ? (
            <div className="empty-state">
              <h2>No products yet</h2>
              <p>Run the seed script to add demo products to the database.</p>
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

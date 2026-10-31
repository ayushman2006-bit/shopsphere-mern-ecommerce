import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Load the product that matches the id in the URL.
  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((response) => setProduct(response.data))
      .catch(() => setError('This product could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setMessage(`${quantity} × ${product.name} added to your cart.`);
  };

  if (loading) {
    return <div className="page-loading">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h2>Product not found</h2>
            <p>{error || 'The product you are looking for does not exist.'}</p>
            <Link to="/products" className="btn btn-primary">
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <p className="breadcrumb">
          <Link to="/products">Products</Link> / {product.category}
        </p>

        <div className="product-detail">
          <img
            className="detail-image"
            src={product.image || '/placeholder.svg'}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src = '/placeholder.svg';
            }}
          />

          <div className="detail-info">
            <span className="product-category">{product.category}</span>
            <h1>{product.name}</h1>

            <div className="detail-price">{formatPrice(product.price)}</div>

            <p className="detail-description">{product.description}</p>

            <div className="detail-meta">
              <span>
                <strong>Availability:</strong>{' '}
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
              <span>
                <strong>Category:</strong> {product.category}
              </span>
            </div>

            {message && <div className="alert alert-success">{message}</div>}

            <div className="detail-actions">
              <div className="qty-controls">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
              </button>

              <Link to="/cart" className="btn btn-outline">
                Go to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

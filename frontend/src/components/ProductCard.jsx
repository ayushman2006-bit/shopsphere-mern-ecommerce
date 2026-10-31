import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // Show "Added" on the button for a moment so the user gets feedback.
  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`}>
        <img
          className="product-image"
          src={product.image || '/placeholder.svg'}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = '/placeholder.svg';
          }}
        />
      </Link>

      <div className="product-card-body">
        <span className="product-category">{product.category}</span>

        <Link to={`/products/${product._id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>

        <p className="product-description">{product.description}</p>

        <div className="product-card-footer">
          <div>
            <div className="price">{formatPrice(product.price)}</div>
            <div className="stock-note">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? 'Out of stock' : added ? 'Added ✓' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

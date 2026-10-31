import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/format';

export default function Cart() {
  const {
    cartItems,
    totalItems,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const placeOrder = async () => {
    // A user must be logged in before an order can be saved.
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }

    setPlacing(true);
    setError('');

    try {
      // Only send product ids and quantities. The backend calculates the real total.
      await api.post('/orders', {
        items: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigate('/orders', { state: { message: 'Order placed successfully!' } });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not place the order. Please try again.'
      );
    } finally {
      setPlacing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="page-header">
            <h1>Your Cart</h1>
          </div>

          <div className="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add a few products and they will appear here.</p>
            <Link to="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Your Cart</h1>
          <p>
            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item._id}>
                <img
                  src={item.image || '/placeholder.svg'}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.src = '/placeholder.svg';
                  }}
                />

                <div>
                  <Link to={`/products/${item._id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <div className="cart-item-price">{formatPrice(item.price)} each</div>

                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => decreaseQuantity(item._id)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => increaseQuantity(item._id)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="link-button"
                      onClick={() => removeFromCart(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Items</span>
              <span>{totalItems}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? 'Placing order...' : user ? 'Place Order' : 'Login to Place Order'}
            </button>

            {!user && (
              <p className="summary-note">
                You need to <Link to="/login?redirect=/cart">log in</Link> before placing
                an order.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

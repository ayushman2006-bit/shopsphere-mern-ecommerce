import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { formatDate, formatPrice } from '../utils/format';

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load only the logged-in user's orders.
  useEffect(() => {
    api
      .get('/orders/my')
      .then((response) => setOrders(response.data))
      .catch(() => setError('Could not load your orders. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Orders</h1>
          <p>View your previous orders and their current status.</p>
        </div>

        {/* The success message is passed from the Cart page after placing an order. */}
        {location.state?.message && (
          <div className="alert alert-success">{location.state.message}</div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="page-loading">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h2>No orders yet</h2>
            <p>Once you place an order, it will appear here.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order._id}>
                <div className="order-header">
                  <div>
                    <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                    <span className="order-date">
                      Placed on {formatDate(order.orderDate)}
                    </span>
                  </div>
                  <span className={`badge badge-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                <div className="order-body">
                  {order.products.map((item, index) => (
                    <div className="order-item" key={`${item.productId}-${index}`}>
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="order-item-info">
                        <p>{item.name}</p>
                        <span>
                          {item.quantity} × {formatPrice(item.price)}
                        </span>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  ))}

                  <div className="order-total">
                    <span>Total Amount:</span>
                    <strong>{formatPrice(order.totalAmount)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

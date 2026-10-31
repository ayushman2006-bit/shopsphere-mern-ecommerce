import { useEffect, useState } from 'react';
import api from '../api';
import { formatDate, formatPrice } from '../utils/format';

// A blank product form. Used when adding a product and after saving.
const emptyForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: '',
  stock: '',
};

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load products and orders together.
  const loadData = async () => {
    try {
      const [productResponse, orderResponse] = await Promise.all([
        api.get('/products'),
        api.get('/orders'),
      ]);

      setProducts(productResponse.data);
      setOrders(orderResponse.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not load admin data. Please refresh the page.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  // Add a new product or save changes to an existing one.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const productData = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      image: form.image.trim() || '/placeholder.svg',
      category: form.category,
      stock: Number(form.stock),
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, productData);
        setMessage('Product updated successfully.');
      } else {
        await api.post('/products', productData);
        setMessage('Product added successfully.');
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Could not save the product.'
      );
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      stock: product.stock,
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);

    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      await api.delete(`/products/${product._id}`);
      setMessage('Product deleted successfully.');
      await loadData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Could not delete the product.'
      );
    }
  };

  // Change an order's status from the dropdown in the orders table.
  const updateStatus = async (orderId, status) => {
    setMessage('');
    setError('');

    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order._id === orderId ? response.data : order))
      );
      setMessage('Order status updated.');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Could not update the order status.'
      );
    }
  };

  const categories = [...new Set(products.map((product) => product.category))];
  const revenue = orders.reduce((total, order) => total + order.totalAmount, 0);

  if (loading) {
    return <div className="page-loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Manage products, stock and customer orders.</p>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Real numbers calculated from the data loaded from MongoDB. */}
        <div className="admin-stats">
          <div className="stat-card">
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
          <div className="stat-card">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="stat-card">
            <span>Total Sales</span>
            <strong>{formatPrice(revenue)}</strong>
          </div>
        </div>

        <div className="admin-grid">
          {/* Add / edit product form */}
          <div className="admin-form-card">
            <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Wireless Headphones"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  list="category-options"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Electronics"
                  required
                />
                <datalist id="category-options">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Price (₹)</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="2499"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Stock</label>
                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="25"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="image">Image URL</label>
                <input
                  id="image"
                  name="image"
                  type="text"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="/uploads/seed/p01-1.jpg"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="A short description of the product..."
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Add Product'}
                </button>

                {editingId && (
                  <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Product list */}
          <div className="table-card">
            <div className="table-card-header">
              <h2>Products</h2>
              <span className="muted-text">{products.length} total</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="table-empty">
                        No products yet. Add your first product using the form.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div className="table-product">
                            <img
                              src={product.image || '/placeholder.svg'}
                              alt={product.name}
                              onError={(event) => {
                                event.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => startEdit(product)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteProduct(product)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Orders list */}
        <div className="table-card">
          <div className="table-card-header">
            <h2>All Orders</h2>
            <span className="muted-text">{orders.length} total</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty">
                      No orders have been placed yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id.slice(-6).toUpperCase()}</td>
                      <td>
                        <div>{order.userId?.name || 'Deleted user'}</div>
                        <span className="muted-text">{order.userId?.email || ''}</span>
                      </td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td className="order-items-cell">
                        {order.products
                          .map((item) => `${item.name} (${item.quantity})`)
                          .join(', ')}
                      </td>
                      <td>{formatPrice(order.totalAmount)}</td>
                      <td>
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(event) => updateStatus(order._id, event.target.value)}
                          aria-label={`Status for order ${order._id}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

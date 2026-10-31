import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <span className="brand-mark">S</span>
              ShopSphere
            </div>
            <p>
              A simple online shopping system built with MongoDB, Express, React and
              Node.js. Browse products, add them to your cart and place an order.
            </p>
          </div>

          <div>
            <h3>Quick Links</h3>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/products">Products</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/orders">My Orders</Link>
            </div>
          </div>

          <div>
            <h3>Contact</h3>
            <p>
              support@shopsphere.com
              <br />
              +91 98765 43210
              <br />
              Mon - Sat, 9:00 AM - 6:00 PM
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} ShopSphere. Built for a college MERN project.
        </div>
      </div>
    </footer>
  );
}

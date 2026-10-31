import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If the user was sent here from the cart or admin page, send them back there.
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      const destination = redirect || (loggedInUser.role === 'admin' ? '/admin' : '/');
      navigate(destination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <form className="form-card" onSubmit={handleSubmit}>
          <h1>Welcome back</h1>
          <p className="form-subtitle">
            Log in to place orders and view your order history.
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="form-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>

          <div className="demo-box">
            <strong>Demo accounts</strong>
            <br />
            Customer: customer@shopsphere.com / Customer@123
            <br />
            Admin: admin@shopsphere.com / Admin@12345
          </div>
        </form>
      </div>
    </div>
  );
}

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

// AuthContext keeps the logged-in user and the JWT token.
const AuthContext = createContext();

// A small custom hook so pages can write: const { user } = useAuth();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // When the page is refreshed, ask the backend who the saved token belongs to.
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      })
      .catch(() => {
        // The token is invalid or expired, so clear the session.
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Send login details to the backend and save the returned token.
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: loggedInUser } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    return loggedInUser;
  };

  // Create an account. The backend also logs the new user in.
  const register = async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user: newUser } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  };

  // Logging out only happens in the browser because JWTs are stateless.
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { wishlistService } from '../services/wishlist.service';
import { getApiError } from '../services/api';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const userId = user?._id;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setProducts([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    wishlistService
      .get()
      .then((data) => {
        if (active) setProducts(data.wishlist.products || []);
      })
      .catch((error) => {
        if (active && error?.response?.status !== 401) {
          toast.error(getApiError(error, 'Could not load your wishlist'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const add = useCallback(
    async (productId) => {
      if (!userId) {
        toast.error('Please log in to save items to your wishlist');
        return false;
      }
      try {
        await wishlistService.add(productId);
        const data = await wishlistService.get();
        setProducts(data.wishlist.products || []);
        toast.success('Added to wishlist');
        return true;
      } catch (error) {
        toast.error(getApiError(error, 'Could not update your wishlist'));
        return false;
      }
    },
    [userId]
  );

  const remove = useCallback(
    async (productId, { silent = false } = {}) => {
      if (!userId) return false;
      try {
        await wishlistService.remove(productId);
        setProducts((current) => current.filter((product) => product._id !== productId));
        if (!silent) toast.success('Removed from wishlist');
        return true;
      } catch (error) {
        toast.error(getApiError(error, 'Could not update your wishlist'));
        return false;
      }
    },
    [userId]
  );

  const toggle = useCallback(
    async (productId) => {
      if (products.some((product) => product._id === productId)) return remove(productId);
      return add(productId);
    },
    [products, add, remove]
  );

  const moveToCart = useCallback(
    async (productId) => {
      if (!userId) return false;
      try {
        await wishlistService.moveToCart(productId);
        setProducts((current) => current.filter((product) => product._id !== productId));
        await refreshCart();
        toast.success('Moved to cart');
        return true;
      } catch (error) {
        toast.error(getApiError(error, 'Could not move this item to your cart'));
        return false;
      }
    },
    [userId, refreshCart]
  );

  const value = useMemo(
    () => ({
      products,
      loading,
      count: products.length,
      add,
      remove,
      toggle,
      moveToCart,
      isWishlisted: (productId) => products.some((product) => product._id === productId),
    }),
    [products, loading, add, remove, toggle, moveToCart]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
};

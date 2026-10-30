import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cartService } from '../services/cart.service';
import { getApiError } from '../services/api';
import { getProductPrice } from '../utils/format';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/constants';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'shopsphere_guest_cart';

const emptyCart = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  shippingEstimate: 0,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
};

const readGuestCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const normalizeGuestCart = (items = []) => {
  const normalized = items
    .filter((item) => item?.product?._id && item.quantity > 0)
    .map((item) => {
      const price = getProductPrice(item.product);
      return {
        product: item.product,
        quantity: Math.min(item.quantity, Math.max(item.product.stock || 0, 0)),
        lineTotal: price * item.quantity,
      };
    })
    .filter((item) => item.quantity > 0);

  const subtotal = normalized.reduce((sum, item) => sum + item.lineTotal, 0);
  return {
    items: normalized,
    totalItems: normalized.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shippingEstimate: subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?._id;
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        if (userId) {
          const guestItems = readGuestCart();
          if (guestItems.length > 0) {
            const data = await cartService.merge(
              guestItems.map((item) => ({
                productId: item.product._id,
                quantity: item.quantity,
              }))
            );
            localStorage.removeItem(GUEST_CART_KEY);
            if (active) setCart(data.cart);
          } else {
            const data = await cartService.get();
            if (active) setCart(data.cart);
          }
        } else if (active) {
          setCart(normalizeGuestCart(readGuestCart()));
        }
      } catch (error) {
        if (active) {
          setCart(normalizeGuestCart(readGuestCart()));
          if (error?.response?.status !== 401) {
            toast.error(getApiError(error, 'Could not load your cart'));
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshCart = useCallback(async () => {
    if (!userId) {
      setCart(normalizeGuestCart(readGuestCart()));
      return;
    }
    const data = await cartService.get();
    setCart(data.cart);
  }, [userId]);

  const addItem = useCallback(
    async (product, quantity = 1) => {
      try {
        if (!product?._id) throw new Error('Invalid product');
        if (product.stock < 1) {
          toast.error('This product is out of stock');
          return false;
        }

        if (userId) {
          const data = await cartService.add(product._id, quantity);
          setCart(data.cart);
        } else {
          const items = readGuestCart();
          const existing = items.find((item) => item.product._id === product._id);
          const nextQuantity = (existing?.quantity || 0) + quantity;
          if (nextQuantity > product.stock) {
            toast.error(`Only ${product.stock} item(s) available in stock`);
            return false;
          }
          if (existing) existing.quantity = nextQuantity;
          else items.push({ product, quantity });
          writeGuestCart(items);
          setCart(normalizeGuestCart(items));
        }
        toast.success(`${product.name} added to cart`);
        return true;
      } catch (error) {
        toast.error(getApiError(error, 'Could not add this product to your cart'));
        return false;
      }
    },
    [userId]
  );

  const updateItem = useCallback(
    async (productId, quantity) => {
      try {
        if (userId) {
          const data = await cartService.update(productId, quantity);
          setCart(data.cart);
        } else {
          const items = readGuestCart();
          if (quantity <= 0) {
            writeGuestCart(items.filter((item) => item.product._id !== productId));
          } else {
            const item = items.find((entry) => entry.product._id === productId);
            if (item) {
              if (quantity > item.product.stock) {
                toast.error(`Only ${item.product.stock} item(s) available in stock`);
                return false;
              }
              item.quantity = quantity;
            }
            writeGuestCart(items);
          }
          setCart(normalizeGuestCart(items));
        }
        return true;
      } catch (error) {
        toast.error(getApiError(error, 'Could not update your cart'));
        return false;
      }
    },
    [userId]
  );

  const removeItem = useCallback(
    async (productId) => {
      try {
        if (userId) {
          const data = await cartService.remove(productId);
          setCart(data.cart);
        } else {
          const items = readGuestCart().filter((item) => item.product._id !== productId);
          writeGuestCart(items);
          setCart(normalizeGuestCart(items));
        }
        toast.success('Item removed from cart');
        return true;
      } catch (error) {
        toast.error(getApiError(error, 'Could not remove this item'));
        return false;
      }
    },
    [userId]
  );

  const clearCart = useCallback(async () => {
    try {
      if (userId) {
        const data = await cartService.clear();
        setCart(data.cart);
      } else {
        writeGuestCart([]);
        setCart(emptyCart);
      }
      toast.success('Cart cleared');
      return true;
    } catch (error) {
      toast.error(getApiError(error, 'Could not clear your cart'));
      return false;
    }
  }, [userId]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount: cart.totalItems,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      refreshCart,
      isInCart: (productId) => cart.items.some((item) => item.product._id === productId),
      getQuantity: (productId) => cart.items.find((item) => item.product._id === productId)?.quantity || 0,
    }),
    [cart, loading, addItem, updateItem, removeItem, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};

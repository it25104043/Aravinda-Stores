import React, { createContext, useState, useEffect, useContext } from "react";
import { ProductService } from "../api/services";
import {
  getItemUnitPrice,
  calculateCartSubtotal,
  formatMoney,
} from "../utils/pricing";
import { AuthContext } from "./AuthContext";
export const StoreContext = createContext();
export const StoreProvider = ({ children }) => {
  const { user, ready } = useContext(AuthContext) || {};
  const [loginRequired, setLoginRequired] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("aravinda_cart");
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      return Array.isArray(parsed)
        ? parsed.filter(
            (i) => Number.isInteger(i.qty) && i.qty > 0 && i.productId,
          )
        : [];
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Persist cart changes
  useEffect(() => {
    localStorage.setItem("aravinda_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    const reset = () => setCart([]);
    window.addEventListener("auth-cleared", reset);
    return () => window.removeEventListener("auth-cleared", reset);
  }, []);
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getAllProducts();
      if (!Array.isArray(response.data))
        throw new Error("Invalid product response");
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products from backend server.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Add product to cart with distinct tracking for EXCHANGE vs NEW
   */
  const addToCart = (product, targetPurchaseType = null, quantity = 1) => {
    if (!user) {
      setLoginRequired(true);
      return false;
    }
    if (ready === false || user.role !== "CUSTOMER") return false;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000)
      return false;
    const pId = product.productId || product.id;
    const purchaseType =
      targetPurchaseType || product.purchaseType || "EXCHANGE";
    const unitPrice = getItemUnitPrice(product, purchaseType);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          (item.productId || item.id) === pId &&
          item.purchaseType === purchaseType,
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          qty: Math.min(1000, updated[existingIndex].qty + quantity),
        };
        return updated;
      }
      return [
        ...prev,
        {
          ...product,
          productId: pId,
          purchaseType,
          unitPrice,
          qty: quantity,
        },
      ];
    });
    return true;
  };

  /**
   * Remove item from cart by productId and specific purchaseType
   */
  const removeFromCart = (productId, purchaseType = null) => {
    setCart((prev) =>
      prev.filter((item) => {
        const idMatch = (item.productId || item.id) === productId;
        if (!purchaseType) return !idMatch;
        return !(idMatch && item.purchaseType === purchaseType);
      }),
    );
  };

  /**
   * Increment/Decrement cart item quantity
   */
  const updateQuantity = (productId, delta, purchaseType = null) => {
    setCart((prev) =>
      prev
        .map((item) => {
          const idMatch = (item.productId || item.id) === productId;
          const typeMatch = !purchaseType || item.purchaseType === purchaseType;
          if (idMatch && typeMatch) {
            const newQty = Math.min(1000, item.qty + delta);
            return newQty > 0
              ? {
                  ...item,
                  qty: newQty,
                }
              : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };
  const clearCart = () => setCart([]);

  // Derived grand subtotal using centralized utility
  const cartSubtotal = calculateCartSubtotal(cart);
  return (
    <StoreContext.Provider
      value={{
        products,
        loginRequired,
        closeLoginRequired: () => setLoginRequired(false),
        cart,
        loading,
        error,
        cartSubtotal,
        formatMoney,
        fetchProducts,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

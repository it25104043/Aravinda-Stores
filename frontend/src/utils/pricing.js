/**
 * Calculates the unit price of a product based on the selected purchase type.
 * @param {Object} item - Product entity or cart item
 * @param {string} [overrideType] - Optional type override ('EXCHANGE' | 'NEW')
 * @returns {number} The resolved unit price
 */
export const getItemUnitPrice = (item, overrideType = null) => {
  if (!item) return 0;

  // Use explicitly selected type or default to 'EXCHANGE'
  const type = overrideType || item.purchaseType || "EXCHANGE";
  if (type === "NEW") {
    return Number(item.newPrice || item.selectedPrice || item.price || 0);
  }

  // Default to EXCHANGE price
  return Number(item.exchangePrice || item.selectedPrice || item.price || 0);
};

/**
 * Calculates the subtotal for a single item (unitPrice * quantity).
 * @param {Object} item - Cart item
 * @returns {number} Item subtotal
 */
export const getItemSubtotal = (item) => {
  if (!item) return 0;
  const qty = Number(item.qty || item.quantity || 1);
  return getItemUnitPrice(item) * qty;
};

/**
 * Calculates the grand subtotal for an entire cart list.
 * @param {Array} cartList - Array of cart items
 * @returns {number} Cart total
 */
export const calculateCartSubtotal = (cartList = []) => {
  if (!Array.isArray(cartList)) return 0;
  return cartList.reduce((acc, item) => acc + getItemSubtotal(item), 0);
};

/**
 * Currency formatter for LKR displaying two decimal places.
 * @param {number|string} amount
 * @returns {string} Formatted currency string
 */
export const formatMoney = (amount) => {
  return (
    "LKR " +
    Number(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

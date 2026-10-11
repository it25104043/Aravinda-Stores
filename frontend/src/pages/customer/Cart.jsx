import ProductImage from "../../components/ProductImage";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
export default function Cart() {
  const { cart, updateQuantity, cartSubtotal, formatMoney } =
    useContext(StoreContext);
  const navigate = useNavigate();
  return (
    <div className="view active">
      <Navbar />

      <section className="section">
        <h2>Your Cart</h2>
        <p className="muted">Review your cylinders before checkout.</p>

        <div className="grid2 cart-grid">
          {/* Cart Items List Panel */}
          <div className="panel">
            {cart.length > 0 ? (
              cart.map((x) => {
                const id = x.productId || x.id;
                const purchaseType = x.purchaseType || "EXCHANGE";
                const itemUnitPrice =
                  x.unitPrice ||
                  (purchaseType === "NEW" ? x.newPrice : x.exchangePrice) ||
                  x.price ||
                  0;
                const itemSubtotal = itemUnitPrice * x.qty;
                const itemKey = `${id}-${purchaseType}`;
                return (
                  <div key={itemKey} className="cart-item">
                    <ProductImage product={x} compact />
                    <div className="cart-item-info">
                      <b>{x.brand ? `${x.brand} LPG Cylinder` : x.name}</b>
                      <div className="cart-item-meta">
                        <span className="muted">
                          {x.sizeKg ? `${x.sizeKg} kg` : x.size}
                        </span>
                        <span
                          className={`pill ${purchaseType === "NEW" ? "status-completed" : "status-pending"}`}
                        >
                          {purchaseType === "NEW"
                            ? "New Package"
                            : "Exchange / Refill"}
                        </span>
                      </div>
                      <div className="muted cart-item-price">
                        {formatMoney(itemUnitPrice)} each
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <b>{formatMoney(itemSubtotal)}</b>
                      <div className="qty cart-qty-controls">
                        <button
                          onClick={() => updateQuantity(id, -1, purchaseType)}
                        >
                          −
                        </button>
                        <span>{x.qty}</span>
                        <button
                          onClick={() => updateQuantity(id, 1, purchaseType)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">Your cart is currently empty.</p>
            )}
          </div>

          {/* Order Summary Panel */}
          <div className="panel">
            <h3>Order Summary</h3>
            <p className="summary-row">
              Subtotal
              <b className="summary-val">{formatMoney(cartSubtotal)}</b>
            </p>
            <p className="summary-row">
              Delivery
              <b className="summary-val">Calculated at checkout</b>
            </p>
            <hr />
            <h3 className="summary-row">
              Total
              <b className="summary-val">
                {formatMoney(cartSubtotal)} + Delivery
              </b>
            </h3>

            <button
              className="primary checkout-btn"
              onClick={() => navigate("/checkout")}
              disabled={!cart.length}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

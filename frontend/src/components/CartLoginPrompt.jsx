import React, { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
import Modal from "./Modal";
import { safeCustomerReturn } from "../utils/customerReturn";
export default function CartLoginPrompt() {
  const { loginRequired, closeLoginRequired } = useContext(StoreContext);
  const { user } = useContext(AuthContext);
  const location = useLocation(),
    navigate = useNavigate();
  if (!loginRequired || user) return null;
  return (
    <Modal
      className="cart-login-modal"
      label="Login Required"
      onClose={closeLoginRequired}
    >
      <div className="cart-login-prompt">
        <span className="login-prompt-icon" aria-hidden="true">
          ↪
        </span>
        <h2>Login Required</h2>
        <p>To place an order, please log in to your account.</p>
        <div className="dialog-actions">
          <button type="button" onClick={closeLoginRequired}>
            Cancel
          </button>

          <button
            type="button"
            className="primary"
            onClick={() => {
              const returnTo = safeCustomerReturn(
                location.pathname + location.search + location.hash,
              );
              closeLoginRequired();
              navigate("/auth", { state: { returnTo } });
            }}
          >
            Login
          </button>
        </div>
      </div>
    </Modal>
  );
}

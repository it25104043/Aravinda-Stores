import React, { useContext, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import { AuthContext } from "../context/AuthContext";
export default function Navbar() {
  const { cart = [] } = useContext(StoreContext),
    { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const customer = !user || user.role === "CUSTOMER";
  const links = customer
    ? [
        ["/", "Home"],
        ["/products", "LPG Cylinders"],
        ["/how-it-works", "How It Works"],
        ["/about", "About"],
        ["/contact", "Contact"],
      ]
    : [
        ...(["OWNER", "STORE_STAFF"].includes(user.role)
          ? [
              ["/admin/customers-orders", "Orders"],
              ["/admin/walk-in-pos", "Walk-in POS"],
              ["/admin/products-inventory", "Inventory"],
            ]
          : []),
        ["/admin/delivery-reports", "Deliveries"],
        ...(user.role === "OWNER"
          ? [
              ["/admin/staff", "Staff"],
              ["/admin/reports", "Reports"],
            ]
          : []),
      ];
  return (
    <nav className="nav" aria-label="Main">
      <Link className="navbar-brand" to="/" onClick={() => setOpen(false)}>
        <span className="navbar-brand-title">ARAVINDA STORES</span>
        <span className="navbar-brand-subtitle">LITRO LPG · ALUTHGAMA</span>
      </Link>
      <button
        className="mobile-menu"
        aria-label="Toggle navigation"
        aria-expanded={open}
        aria-controls="main-links"
        onClick={() => setOpen(!open)}
      >
        Menu
      </button>
      <div id="main-links" className={`navlinks ${open ? "is-open" : ""}`}>
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setOpen(false)}
          >
            {label}
          </NavLink>
        ))}
      </div>
      <div className="nav-actions">
        {user?.role === "CUSTOMER" && (
          <Link className="cart-button" to="/cart">
            Cart{" "}
            <span className="cart-count" aria-label="Cart item count">
              {cart.reduce((n, item) => n + item.qty, 0)}
            </span>
          </Link>
        )}
        {user ? (
          <Link
            className="profile-link"
            to="/profile"
            aria-label="My profile"
            title="My profile"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle
                cx="12"
                cy="8"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M4 21v-2a8 8 0 0 1 16 0v2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </Link>
        ) : (
          <Link className="cart-button" to="/auth">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

import { Link } from "react-router-dom";
import React from "react";
export default function Footer() {
  return (
    <footer>
      <div>
        <h3>Aravinda Stores</h3>
        <p>LPG cylinder retail and home delivery.</p>
        <p>No. 05, Welipitiya Junction, Dharga Town, Aluthgama, Sri Lanka</p>
        <p className="footer-credit">Made by Group33</p>
      </div>
      <div>
        <h3>Quick Links</h3>
        <p>
          <Link to="/">Home</Link>
        </p>
        <p>
          <Link to="/products">LPG Cylinders</Link>
        </p>
        <p>
          <Link to="/profile">My Orders</Link>
        </p>
      </div>
      <div>
        <h3>Contact</h3>
        <p>Phone: 034 227 0756</p>
        <p>Hours: 8:00 AM – 7:00 PM</p>
      </div>
    </footer>
  );
}

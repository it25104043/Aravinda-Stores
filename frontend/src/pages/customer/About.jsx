import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
export default function About() {
  const navigate = useNavigate();
  return (
    <div className="view active">
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div>
          <div className="eyebrow">ABOUT US</div>
          <h1>Our Story</h1>
          <p>
            Aravinda Stores has been serving Sri Lankan families with reliable
            LPG solutions since 2003.
          </p>
          <div className="heroactions">
            <button className="primary" onClick={() => navigate("/products")}>
              View Our Products
            </button>
            <button className="secondary" onClick={() => navigate("/profile")}>
              My Orders
            </button>
          </div>
        </div>
        <div className="cylinder">
          <div className="tank"></div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="section section-surface">
        <div className="about-content">
          <h2>From Small Beginnings to Trusted Service</h2>
          <p>
            What started as a small family business in Aluthgama in 2003 has
            grown into one of the most trusted LPG suppliers in the region. Our
            commitment to quality, safety, and customer service has made us the
            preferred choice for thousands of households and businesses.
          </p>
          <p>
            We understand that reliable LPG supply is essential for daily
            cooking needs, which is why we've built our business on the pillars
            of consistency, safety, and customer-centric service.
          </p>

          <div className="about-stats">
            <div className="stat">
              <strong>20+</strong>
              <small>Years in Business</small>
            </div>
            <div className="stat">
              <strong>5000+</strong>
              <small>Happy Customers</small>
            </div>
            <div className="stat">
              <strong>99%</strong>
              <small>On-time Delivery</small>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Section */}
      <section className="section">
        <div className="owner-section">
          <div className="owner-avatar">AS</div>
          <div className="owner-info">
            <h2>Aravinda Silva</h2>
            <p className="owner-role">Founder & Owner</p>
            <p>
              With over 20 years of experience in the LPG distribution industry,
              Aravinda Silva founded the business with a vision to provide
              reliable, high-quality LPG solutions to Sri Lankan families. His
              dedication to customer service and safety standards has been the
              foundation of our success.
            </p>
            <p>
              Today, Aravinda continues to oversee operations personally,
              ensuring that every customer receives the same level of service
              and quality that he committed to when he started the business.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

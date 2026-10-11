import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
export default function PublicInfo({ type }) {
  return (
    <div className="view active">
      <Navbar />
      <main className="section workflow-page">
        {type === "how" ? (
          <>
            <div className="eyebrow">Simple LPG ordering</div>
            <h1>How It Works</h1>
            <div className="features">
              {[
                [
                  "1. Choose your cylinder",
                  "Browse available cylinders and choose a refill exchange or a new cylinder package.",
                ],
                [
                  "2. Place your order",
                  "Sign in, review your cart, then select a delivery address in a supported zone.",
                ],
                [
                  "3. Arrange payment",
                  "Choose an available payment method. Upload a bank slip for staff review when paying by transfer.",
                ],
                [
                  "4. Receive and track",
                  "Follow your order through My Orders in your profile. For an exchange, provide the matching empty cylinder at handover.",
                ],
              ].map(([title, description]) => (
                <article className="panel" key={title}>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1>Contact Aravinda Stores</h1>
            <section className="panel">
              <h2>Visit our shop</h2>
              <p>
                No. 05, Welipitiya Junction, Dharga Town, Aluthgama, Sri Lanka
              </p>
              <p>
                Phone: <a href="tel:+94342270756">034 227 0756</a>
              </p>
              <p>Hours: 8:00 AM – 7:00 PM</p>
              <p>
                For delivery availability, check the supported zones at checkout
                or contact the shop.
              </p>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

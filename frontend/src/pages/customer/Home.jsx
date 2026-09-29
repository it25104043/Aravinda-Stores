import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Home() {
    const { products, addToCart, updateQuantity, cart } = useContext(StoreContext);
    const navigate = useNavigate();

    const formatMoney = (amount) => "LKR " + Number(amount).toLocaleString("en-LK");

    return (
        <div className="view active">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div>
                    <div className="eyebrow">
                        ORDER AT ONE PLACE
                    </div>
                    <h1>Your LPG Cylinder Delivered to Your Door</h1>
                    <p>
                        Order LPG cylinders online from Aravinda Stores in Aluthgama.
                        Simple ordering and convenient home-delivery service for you.
                    </p>
                    <div className="heroactions">
                        <button className="primary" onClick={() => navigate('/products')}>
                            Order Now
                        </button>
                        <button className="secondary" onClick={() => navigate('/products')}>
                            View Cylinders
                        </button>
                    </div>
                </div>
                <div className="cylinder">
                    <div className="tank"></div>
                </div>
            </section>

            {/* Value Proposition Features */}
            <section className="section">
                <div className="features">
                    <div className="feature">
                        ✓
                        <b>Genuine LPG</b>
                        <span className="muted">Litro and laugfs cylinder products</span>
                    </div>
                    <div className="feature">
                        ⌂
                        <b>Home Delivery</b>
                        <span className="muted">Delivery within service area</span>
                    </div>
                    <div className="feature">
                        ▣
                        <b>Easy Ordering</b>
                        <span className="muted">Simple online checkout</span>
                    </div>
                    <div className="feature">
                        →
                        <b>Order Tracking</b>
                        <span className="muted">Follow your delivery status</span>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="section" style={{ background: '#fff' }}>
                <div className="sectionhead">
                    <div>
                        <h2>Popular LPG Cylinders</h2>
                        <p className="muted">Choose the cylinder size you need.</p>
                    </div>
                    <button className="secondary" onClick={() => navigate('/products')}>
                        View all
                    </button>
                </div>

                <div className="products">
                    {products.slice(0, 3).map((p) => {
                        const productId = p.productId || p.id;
                        const cartItem = cart.find(x => (x.productId || x.id) === productId);
                        const qtyInCart = cartItem ? cartItem.qty : 0;
                        const isOutOfStock = p.stock === 0 || p.fullQty === 0;
                        const isLowStock = (p.stock || p.fullQty) < (p.min || p.lowStockLevel || 10);
                        const displayPrice = p.newPrice || p.price;

                        return (
                            <div className="card" key={productId}>
                                <div className="productimg">
                                    <div className="mini-tank"></div>
                                </div>

                                <div className="producttop">
                                    <div>
                                        <b>{p.brand ? `${p.brand} LPG Cylinder` : p.name}</b>
                                        <div className="muted">{p.sizeKg ? `${p.sizeKg} kg` : p.size}</div>
                                    </div>
                                    <span className={`stock ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`}>
                                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                    </span>
                                </div>

                                <p className="muted" style={{ margin: '12px 0' }}>
                                    {p.desc || `Standard ${p.brand || 'Litro'} LPG cylinder.`}
                                </p>

                                <div className="producttop">
                                    <span className="price">{formatMoney(displayPrice)}</span>
                                    <span className="muted">per cylinder</span>
                                </div>

                                <div className="productactions">
                                    <div className="qty">
                                        <button onClick={() => updateQuantity(productId, -1)}>−</button>
                                        <span>{qtyInCart}</span>
                                        <button
                                            onClick={() => updateQuantity(productId, 1)}
                                            disabled={isOutOfStock}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className="primary"
                                        style={{ flex: 1 }}
                                        onClick={() => addToCart(p)}
                                        disabled={isOutOfStock}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <Footer />
        </div>
    );
}
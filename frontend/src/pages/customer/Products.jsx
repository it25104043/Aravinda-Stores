import React, { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Products() {
    const { products, addToCart, updateQuantity, cart, loading, error } = useContext(StoreContext);

    const formatMoney = (amount) => "LKR " + Number(amount).toLocaleString("en-LK");

    return (
        <div className="view active">
            <Navbar />

            <section className="section">
                <div className="sectionhead">
                    <div>
                        <div className="eyebrow">Litro & laugfs LPG</div>
                        <h2>Cylinder Catalogue</h2>
                        <p className="muted">Current store products and stock status.</p>
                    </div>
                </div>

                {loading && <p>Loading product catalogue...</p>}
                {error && <p className="muted" style={{ color: 'red' }}>{error}</p>}

                {!loading && (
                    <div className="products">
                        {products.map((p) => {
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
                                        {p.desc || `Standard domestic ${p.brand || 'Litro'} LPG cylinder.`}
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
                )}
            </section>

            <Footer />
        </div>
    );
}
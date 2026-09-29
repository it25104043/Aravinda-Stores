import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Cart() {
    const { cart, updateQuantity } = useContext(StoreContext);
    const navigate = useNavigate();

    const formatMoney = (amount) => "LKR " + Number(amount).toLocaleString("en-LK");

    const subtotal = cart.reduce((s, x) => {
        const itemPrice = x.newPrice || x.price || 0;
        return s + itemPrice * x.qty;
    }, 0);

    const deliveryFee = cart.length ? 300 : 0;
    const total = subtotal + deliveryFee;

    return (
        <div className="view active">
            <Navbar />

            <section className="section">
                <h2>Your Cart</h2>
                <p className="muted">Review your cylinders before checkout.</p>

                <div className="grid2">
                    <div className="panel">
                        {cart.length > 0 ? (
                            cart.map((x) => {
                                const id = x.productId || x.id;
                                const itemPrice = x.newPrice || x.price || 0;

                                return (
                                    <div
                                        key={id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid var(--line)',
                                            padding: '14px 0'
                                        }}
                                    >
                                        <div>
                                            <b>{x.brand ? `${x.brand} LPG Cylinder` : x.name}</b>
                                            <div className="muted">{x.sizeKg ? `${x.sizeKg} kg` : x.size}</div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <b>{formatMoney(itemPrice * x.qty)}</b>
                                            <div className="qty" style={{ marginTop: '6px' }}>
                                                <button onClick={() => updateQuantity(id, -1)}>−</button>
                                                <span>{x.qty}</span>
                                                <button onClick={() => updateQuantity(id, 1)}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="muted">Your cart is currently empty.</p>
                        )}
                    </div>

                    <div className="panel">
                        <h3>Order Summary</h3>
                        <p>
                            Subtotal
                            <b style={{ float: 'right' }}>{formatMoney(subtotal)}</b>
                        </p>
                        <p>
                            Delivery
                            <b style={{ float: 'right' }}>{formatMoney(deliveryFee)}</b>
                        </p>
                        <hr />
                        <h3>
                            Total
                            <b style={{ float: 'right' }}>{formatMoney(total)}</b>
                        </h3>

                        <button
                            className="primary"
                            style={{ width: '100%', marginTop: '15px' }}
                            onClick={() => navigate('/checkout')}
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
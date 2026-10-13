import ProductImage from '../../components/ProductImage';
import React, { useContext, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
export default function Products() {
    const { user, ready } = useContext(AuthContext);
    const restricted = Boolean(user && user.role !== 'CUSTOMER');
    const {
        products,
        addToCart,
        updateQuantity,
        cart,
        loading,
        error,
        formatMoney
    } = useContext(StoreContext);

    // Track selected purchase type per product: { [productId]: 'EXCHANGE' | 'NEW' }
    const [purchaseTypes, setPurchaseTypes] = useState({});
    const handleTypeChange = (productId, type) => {
        setPurchaseTypes(prev => ({
            ...prev,
            [productId]: type
        }));
    };
    const handleAddToCart = (product, selectedType) => {
        addToCart(product, selectedType);
    };
    return <div className="view active">
        <Navbar />

        <section className="section">
            <div className="sectionhead">
                <div>
                    <div className="eyebrow">Litro LPG</div>
                    <h2>Cylinder Catalogue</h2>
                    <p className="muted">Select Exchange (Refill) or New Cylinder Package before adding to cart.</p>
                </div>
            </div>

            {loading && <p>Loading product catalogue...</p>}
            {error && <p className="muted catalogue-error">{error}</p>}

            {!loading && <div className="products">
                {products.map(p => {
                    const productId = p.productId || p.id;

                    // Determine Purchase Type Selection (Default: EXCHANGE)
                    const selectedType = purchaseTypes[productId] || 'EXCHANGE';

                    // Find cart item matching both ID and currently selected purchaseType
                    const cartItem = cart.find(x => (x.productId || x.id) === productId && x.purchaseType === selectedType);
                    const qtyInCart = cartItem ? cartItem.qty : 0;
                    const isOutOfStock = p.availableQty <= 0;
                    const isLowStock = p.fullQty < p.lowStockLevel;

                    // Map entity BigDecimal properties
                    const exchangePrice = p.exchangePrice || 0;
                    const newPrice = p.newPrice || 0;
                    const activePrice = selectedType === 'EXCHANGE' ? exchangePrice : newPrice;
                    return <div className="card product-card" key={productId}>
                        <div className="productimg">
                            <ProductImage product={p} />
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

                        <p className="muted product-desc">
                            {p.description || p.desc || `Standard domestic ${p.brand || 'Litro'} LPG cylinder.`}
                        </p>

                        {/* Purchase Type Selector Tabs */}
                        <div className="purchase-type-selector">
                            <button type="button" aria-pressed={selectedType === 'EXCHANGE'} className={`type-btn ${selectedType === 'EXCHANGE' ? 'active' : ''}`} onClick={() => handleTypeChange(productId, 'EXCHANGE')}>
                                <span className="type-title">Refill / Exchange</span>
                                <span className="type-price">{formatMoney(exchangePrice)}</span>
                            </button>

                            <button type="button" aria-pressed={selectedType === 'NEW'} className={`type-btn ${selectedType === 'NEW' ? 'active' : ''}`} onClick={() => handleTypeChange(productId, 'NEW')}>
                                <span className="type-title">New Cylinder</span>
                                <span className="type-price">{formatMoney(newPrice)}</span>
                            </button>
                        </div>

                        {/* Active Price Row */}
                        <div className="producttop product-price-row">
                            <span className="price">{formatMoney(activePrice)}</span>
                            <span className="muted">
                                {selectedType === 'EXCHANGE' ? 'cylinder (empty swap)' : 'cylinder (new)'}
                            </span>
                        </div>

                        {/* Cart Actions */}
                        <div className="productactions">
                            {qtyInCart > 0 && <div className="qty">
                                <button aria-label={`Remove one ${p.brand} ${p.sizeKg} kg ${selectedType.toLowerCase()} cylinder`} onClick={() => updateQuantity(productId, -1, selectedType)}>−</button>
                            </div>}
                            <button className="primary add-to-cart-btn" onClick={() => handleAddToCart(p, selectedType)} disabled={isOutOfStock || restricted || ready === false}>
                                Add {selectedType === 'EXCHANGE' ? 'Refill' : 'New'} to Cart
                                {qtyInCart > 0 && <span className="badge">{qtyInCart}</span>}
                            </button>
                        </div>
                    </div>;
                })}
            </div>}
        </section>

        <Footer />
    </div>;
}

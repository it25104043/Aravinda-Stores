import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import './App.css';

// Customer Pages
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import Cart from './pages/customer/Cart';
//import Checkout from './pages/customer/Checkout';
//import TrackOrder from './pages/customer/TrackOrder';
import Auth from './pages/customer/Auth';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Orders from './pages/admin/Orders';
import Inventory from './pages/admin/Inventory';
//import Payments from './pages/admin/Payments';
//import Deliveries from './pages/admin/Deliveries';

function App() {
    return (
        <StoreProvider>
            <BrowserRouter>
                <Routes>
                    {/* Customer Web Pages */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/cart" element={<Cart />} />
                    {/*<Route path="/checkout" element={<Checkout />} />*/}
                    {/*<Route path="/track" element={<TrackOrder />} />*/}
                    <Route path="/auth" element={<Auth />} />

                    {/* Member-Specific Staff Administration */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route path="customers-orders" element={<Orders />} />
                        <Route path="products-inventory" element={<Inventory />} />
                        {/*<Route path="payments-sales" element={<Payments />} />
                        <Route path="delivery-reports" element={<Deliveries />} />*/}
                    </Route>
                </Routes>
            </BrowserRouter>
        </StoreProvider>
    );
}

export default App;

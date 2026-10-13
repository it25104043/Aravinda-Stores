import CartLoginPrompt from './components/CartLoginPrompt';
import PublicInfo from './pages/customer/PublicInfo';
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Customer Pages
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderDetails from './pages/customer/OrderDetails';
import Auth from './pages/customer/Auth';
import About from './pages/customer/About';
import Profile from './pages/customer/Profile';

// Admin & Staff Pages
import AdminLayout from './pages/admin/AdminLayout';
import Orders from './pages/admin/Orders';
import Inventory from './pages/admin/Inventory';
import Deliveries from './pages/admin/Deliveries';
import Staff from './pages/admin/Staff';
import WalkInSales from './pages/admin/WalkInSales';
import OwnerReports from './pages/admin/OwnerReports';
function App() {
  return <AuthProvider>
            <StoreProvider>
                <BrowserRouter>
                    <CartLoginPrompt />
                    <Routes>
                        {/* Public Customer Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><Checkout /></ProtectedRoute>} />
                        <Route path="/profile/orders/:id" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER', 'STORE_STAFF']}><OrderDetails /></ProtectedRoute>} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/how-it-works" element={<PublicInfo type="how" />} /><Route path="/contact" element={<PublicInfo type="contact" />} /><Route path="/products/*" element={<Navigate to="/products" replace />} /><Route path="/about" element={<About />} />

                        <Route path="/profile" element={<ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER', 'STORE_STAFF', 'DELIVERY_STAFF']}>
                                <Profile />
                            </ProtectedRoute>} />

                        {/* Protected Administration Routes */}
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminStart />} />
                            <Route path="customers-orders" element={<ProtectedRoute allowedRoles={['STORE_STAFF', 'OWNER']}>
                                    <Orders />
                                </ProtectedRoute>} />
                            <Route path="walk-in-pos" element={<ProtectedRoute allowedRoles={['STORE_STAFF', 'OWNER']}>
                                    <WalkInSales />
                                </ProtectedRoute>} />
                            <Route path="products-inventory" element={<ProtectedRoute allowedRoles={['STORE_STAFF', 'OWNER']}>
                                    <Inventory />
                                </ProtectedRoute>} />
                            <Route path="reports" element={<ProtectedRoute allowedRoles={['OWNER']}>
                                    <OwnerReports />
                                </ProtectedRoute>} />
                            <Route path="delivery-reports" element={<ProtectedRoute allowedRoles={['DELIVERY_STAFF', 'OWNER', 'STORE_STAFF']}>
                                    <Deliveries />
                                </ProtectedRoute>} />
                            <Route path="staff" element={<ProtectedRoute allowedRoles={['OWNER']}>
                                    <Staff />
                                </ProtectedRoute>} />
                        </Route>
                    <Route path="*" element={<main className="section"><h1>Page not found</h1></main>} /></Routes>
                </BrowserRouter>
            </StoreProvider>
        </AuthProvider>;
}
export default App;
function AdminStart() {
  const {
    user
  } = useContext(AuthContext);
  return <Navigate replace to={user?.role === 'DELIVERY_STAFF' ? '/admin/delivery-reports' : '/admin/customers-orders'} />;
}

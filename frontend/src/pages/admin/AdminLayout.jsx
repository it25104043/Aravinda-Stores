import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function AdminLayout() {
    const location = useLocation();

    const isActive = (path) => location.pathname.includes(path) ? 'sidebtn active' : 'sidebtn';

    return (
        <>
            <Navbar />
            <div className="adminwrap">
                <div className="sidebar">
                    <h3>Staff Administration</h3>
                    <Link to="/admin/customers-orders">
                        <button className={isActive('customers-orders')}>Customers & Orders</button>
                    </Link>
                    <Link to="/admin/products-inventory">
                        <button className={isActive('products-inventory')}>Products & Inventory</button>
                    </Link>
                    <Link to="/admin/payments-sales">
                        <button className={isActive('payments-sales')}>Payments & Sales</button>
                    </Link>
                    <Link to="/admin/delivery-reports">
                        <button className={isActive('delivery-reports')}>Delivery & Reports</button>
                    </Link>
                </div>
                <div className="adminmain">
                    <Outlet />
                </div>
            </div>
        </>
    );
}
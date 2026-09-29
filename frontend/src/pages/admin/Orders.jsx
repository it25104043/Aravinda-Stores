import React, { useEffect, useState } from 'react';
import { OrderService } from '../../api/services';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await OrderService.getAllOrders();
            setOrders(res.data);
        } catch (err) {
            alert('Error connecting to backend order management.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await OrderService.updateStatus(orderId, newStatus);
            loadOrders();
        } catch (err) {
            alert('Failed to update order status');
        }
    };

    return (
        <div>
            <h2>Customer Accounts & Orders</h2>
            <div className="toolbar">
                <button className="primary" onClick={loadOrders}>Refresh Orders</button>
            </div>
            {loading ? <p>Loading database records...</p> : (
                <div className="tablewrap">
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Channel</th>
                            <th>Fulfilment</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map(o => (
                            <tr key={o.orderId}>
                                <td>#{o.orderId}</td>
                                <td>{o.channel}</td>
                                <td>{o.fulfilment}</td>
                                <td>LKR {Number(o.totalAmount).toLocaleString('en-LK')}</td>
                                <td><span className="pill">{o.status}</span></td>
                                <td>
                                    <select
                                        value={o.status}
                                        onChange={(e) => handleStatusChange(o.orderId, e.target.value)}
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="CONFIRMED">CONFIRMED</option>
                                        <option value="DISPATCHED">DISPATCHED</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
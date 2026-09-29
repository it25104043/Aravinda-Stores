import React, { useEffect, useState } from 'react';
import { ProductService, InventoryService } from '../../api/services';

export default function Inventory() {
    const [inventory, setInventory] = useState([]);
    const [movement, setMovement] = useState({ productId: '', fullDelta: 0, emptyDelta: 0, reason: 'RECEIPT', recordedBy: 1 });

    const loadData = async () => {
        try {
            const res = await InventoryService.getAllInventory();
            setInventory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const submitMovement = async (e) => {
        e.preventDefault();
        try {
            await InventoryService.recordMovement({
                product: { productId: Number(movement.productId) },
                fullDelta: Number(movement.fullDelta),
                emptyDelta: Number(movement.emptyDelta),
                reason: movement.reason,
                recordedBy: { userId: Number(movement.recordedBy) }
            });
            alert('Stock movement recorded successfully');
            loadData();
        } catch (err) {
            alert('Failed to record stock movement');
        }
    };

    return (
        <div>
            <h2>Products & Inventory</h2>

            <div className="grid2" style={{ marginBottom: '25px' }}>
                <div className="panel form">
                    <h3>Record Stock Movement</h3>
                    <form onSubmit={submitMovement}>
                        <label>Product ID</label>
                        <select onChange={e => setMovement({...movement, productId: e.target.value})} required>
                            <option value="">Select Cylinder</option>
                            {inventory.map(i => (
                                <option key={i.product.productId} value={i.product.productId}>
                                    {i.product.brand} - {i.product.sizeKg}kg
                                </option>
                            ))}
                        </select>

                        <label>Full Delta Quantity</label>
                        <input type="number" value={movement.fullDelta} onChange={e => setMovement({...movement, fullDelta: e.target.value})} />

                        <label>Empty Delta Quantity</label>
                        <input type="number" value={movement.emptyDelta} onChange={e => setMovement({...movement, emptyDelta: e.target.value})} />

                        <label>Reason</label>
                        <select onChange={e => setMovement({...movement, reason: e.target.value})}>
                            <option value="RECEIPT">RECEIPT</option>
                            <option value="CORRECTION">CORRECTION</option>
                            <option value="OPENING">OPENING</option>
                        </select>

                        <button type="submit" className="primary" style={{ marginTop: '10px' }}>Record Stock</button>
                    </form>
                </div>

                <div className="panel">
                    <h3>Current Stock Balances</h3>
                    <div className="tablewrap">
                        <table className="table">
                            <thead>
                            <tr>
                                <th>Brand / Size</th>
                                <th>Full Qty</th>
                                <th>Empty Qty</th>
                                <th>Low Threshold</th>
                            </tr>
                            </thead>
                            <tbody>
                            {inventory.map(inv => (
                                <tr key={inv.inventoryId}>
                                    <td>{inv.product.brand} ({inv.product.sizeKg}kg)</td>
                                    <td><b>{inv.fullQty}</b></td>
                                    <td>{inv.emptyQty}</td>
                                    <td>{inv.lowStockLevel}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
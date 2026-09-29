import apiClient from './client';

// Member 1 Services: Users & Orders
export const UserService = {
    register: (data) => apiClient.post('/users/register', data),
    login: (credentials) => apiClient.post('/users/login', credentials),
    getAll: () => apiClient.get('/users'),
    getById: (id) => apiClient.get(`/users/${id}`)
};

export const OrderService = {
    createOrder: (orderData) => apiClient.post('/orders', orderData),
    getAllOrders: () => apiClient.get('/orders'),
    getOrderById: (id) => apiClient.get(`/orders/${id}`),
    getOrdersByCustomer: (customerId) => apiClient.get(`/orders/customer/${customerId}`),
    updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status?status=${status}`),
    cancelOrder: (id) => apiClient.delete(`/orders/${id}`)
};

// Member 2 Services: Products & Inventory
export const ProductService = {
    getAllProducts: () => apiClient.get('/products'),
    getProductById: (id) => apiClient.get(`/products/${id}`),
    createProduct: (product) => apiClient.post('/products', product),
    updateProduct: (id, product) => apiClient.put(`/products/${id}`, product),
    getLowStock: () => apiClient.get('/products/low-stock')
};

export const InventoryService = {
    getAllInventory: () => apiClient.get('/inventory/all'),
    getStockByProduct: (productId) => apiClient.get(`/inventory/stock/${productId}`),
    recordMovement: (movement) => apiClient.post('/inventory/movement', movement),
    getMovementHistory: (productId) => apiClient.get(`/inventory/movements/${productId}`)
};

// Member 3 Services: Payments & Sales
export const PaymentService = {
    createPayment: (payment) => apiClient.post('/payments', payment),
    getByOrderId: (orderId) => apiClient.get(`/payments/order/${orderId}`),
    getUnverifiedTransfers: () => apiClient.get('/payments/unverified-transfers'),
    getOutstandingCOD: () => apiClient.get('/payments/outstanding-cod'),
    verifyPayment: (id) => apiClient.patch(`/payments/${id}/verify`),
    completePayment: (id) => apiClient.patch(`/payments/${id}/complete`),
    rejectPayment: (id) => apiClient.patch(`/payments/${id}/reject`)
};

export const SaleService = {
    recordSale: (sale) => apiClient.post('/sales', sale),
    getAllSales: () => apiClient.get('/sales'),
    getByReceiptNo: (receiptNo) => apiClient.get(`/sales/receipt/${receiptNo}`)
};

// Member 4 Services: Deliveries & Reports
export const DeliveryService = {
    getAllDeliveries: () => apiClient.get('/deliveries'),
    getById: (id) => apiClient.get(`/deliveries/${id}`),
    getByOrderId: (orderId) => apiClient.get(`/deliveries/order/${orderId}`),
    getOpenAssignments: () => apiClient.get('/deliveries/open-assignments'),
    assignStaff: (id, staffId) => apiClient.patch(`/deliveries/${id}/assign?staffId=${staffId}`),
    dispatch: (id) => apiClient.patch(`/deliveries/${id}/dispatch`),
    complete: (id) => apiClient.patch(`/deliveries/${id}/complete`),
    fail: (id) => apiClient.patch(`/deliveries/${id}/fail`)
};

export const ReportService = {
    getDailySales: (dateStr) => apiClient.get(`/reports/daily-sales?date=${dateStr}`),
    getDeliveryStatus: () => apiClient.get('/reports/delivery-status'),
    getDeliveryPerformance: () => apiClient.get('/reports/delivery-performance')
};
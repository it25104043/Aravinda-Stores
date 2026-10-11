import api from "./client";
export const operationKey = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
const post = (path, data, key) =>
  api.post(path, data, {
    headers: {
      "Idempotency-Key": key,
    },
  });
export const UserService = {
  register: (data) => api.post("/users/register", data),
  login: (data) => api.post("/users/login", data),
  me: () => api.get("/users/me"),
  logout: () => api.post("/users/logout"),
  changePassword: (data, key) => post("/users/me/change-password", data, key),
  updateProfile: (data) => api.put("/users/me", data),
  getStaffMembers: () => api.get("/users/staff"),
  createStaff: (data) => api.post("/users/staff", data),
  updateStaff: (id, data) => api.put(`/users/staff/${id}`, data),
  workers: () => api.get("/users/delivery-workers"),
};
export const CustomerService = {
  getMyProfile: () => api.get("/customers/me"),
  addAddress: (data) => api.post("/customers/me/addresses", data),
  updateAddress: (id, data) => api.put(`/customers/me/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/customers/me/addresses/${id}`),
};
export const ProductService = {
  uploadImage: (id, file, key) => {
    const data = new FormData();
    data.append("file", file);
    return post(`/products/${id}/image`, data, key);
  },
  removeImage: (id, key) =>
    api.delete(`/products/${id}/image`, {
      headers: {
        "Idempotency-Key": key,
      },
    }),
  getAllProducts: () => api.get("/products"),
  createProduct: (data) => api.post("/products", data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
};
export const OrderService = {
  createOrder: (data, key) => post("/orders", data, key),
  getAllOrders: (page = 0) =>
    api.get("/orders", {
      params: {
        page,
      },
    }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id, key) => post(`/orders/${id}/cancel`, {}, key),
  decision: (id, data, key) => post(`/orders/${id}/decision`, data, key),
};
export const InventoryService = {
  getAllInventory: () => api.get("/inventory"),
  recordMovement: (data, key) => post("/inventory/movements", data, key),
  threshold: (id, lowStockLevel) =>
    api.put(`/inventory/${id}/threshold`, {
      lowStockLevel,
    }),
};
export const PaymentService = {
  byOrder: (id) => api.get(`/payments/order/${id}`),
  queue: () => api.get("/payments/review-queue"),
  upload: (id, file, key, onUploadProgress) => {
    const data = new FormData();
    data.append("file", file);
    return api.post(`/payments/${id}/slip`, data, {
      headers: {
        "Idempotency-Key": key,
      },
      onUploadProgress,
    });
  },
  slip: (id) =>
    api.get(`/payments/${id}/slip`, {
      responseType: "blob",
    }),
  review: (id, data, key) => post(`/payments/${id}/review`, data, key),
  reconcile: (id, reason, key) =>
    post(
      `/payments/${id}/reconciliation`,
      {
        reason,
      },
      key,
    ),
  history: (id) => api.get(`/payments/${id}/history`),
};
export const SaleService = {
  quote: (data) => api.post("/sales/walk-in/quote", data),
  recordWalkInSale: (data, key) => post("/sales/walk-in", data, key),
  pickup: (id, data, key) => post(`/sales/pickup/${id}`, data, key),
};
export const DeliveryService = {
  getAllDeliveries: () => api.get("/deliveries"),
  assignStaff: (id, staffId, reason, key) =>
    post(
      `/deliveries/${id}/assign`,
      {
        staffId,
        reason,
      },
      key,
    ),
  dispatch: (id, key) => post(`/deliveries/${id}/dispatch`, {}, key),
  complete: (id, data, key) => post(`/deliveries/${id}/complete`, data, key),
  fail: (id, reason, key) =>
    post(
      `/deliveries/${id}/fail`,
      {
        reason,
      },
      key,
    ),
  payment: (id) => api.get(`/deliveries/${id}/payment`),
};
export const DeliveryZoneService = {
  getActiveZones: () => api.get("/delivery-zones"),
  save: (id, data, key) =>
    id
      ? api.put(`/delivery-zones/${id}`, data, {
          headers: {
            "Idempotency-Key": key,
          },
        })
      : post("/delivery-zones", data, key),
};
export const ReportService = {
  sales: (start, end) =>
    api.get("/reports/sales", {
      params: {
        start,
        end,
      },
    }),
};
export const DriverService = {
  update: (id, data, key) =>
    api.put(`/drivers/${id}/coverage`, data, {
      headers: {
        "Idempotency-Key": key,
      },
    }),
};

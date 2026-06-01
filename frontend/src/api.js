const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Helper to make API requests and handle errors gracefully
async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // If delete returns 200/204 or post/put returns data, handle empty responses
    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      // Parse API backend-friendly error detail if available
      const errorMsg = data?.detail || `API request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`Error requesting ${path}:`, error);
    throw error;
  }
}

export const api = {
  // ==========================================
  // PRODUCTS
  // ==========================================
  getProducts: () => request("/products/"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (product) => 
    request("/products/", {
      method: "POST",
      body: JSON.stringify(product),
    }),
  updateProduct: (id, product) => 
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),
  deleteProduct: (id) => 
    request(`/products/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // CUSTOMERS
  // ==========================================
  getCustomers: () => request("/customers/"),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (customer) => 
    request("/customers/", {
      method: "POST",
      body: JSON.stringify(customer),
    }),
  deleteCustomer: (id) => 
    request(`/customers/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // ORDERS
  // ==========================================
  getOrders: () => request("/orders/"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (order) => 
    request("/orders/", {
      method: "POST",
      body: JSON.stringify(order),
    }),
  deleteOrder: (id) => 
    request(`/orders/${id}`, {
      method: "DELETE",
    }),

  // ==========================================
  // DASHBOARD
  // ==========================================
  getDashboardSummary: () => request("/dashboard/summary"),
};

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Receipt,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  TrendingUp,
  Phone,
  Mail,
  DollarSign,
  X,
  Eye,
  ShoppingCart,
  Loader2,
  Sun,
  Moon,
  Menu
} from "lucide-react";
import { api } from "./api";

export default function App() {
  // Theme & Navigation
  const [theme, setTheme] = useState(() => localStorage.getItem("im-theme") || "dark");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("im-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Core Data State
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  // Loaders
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Banner Alerts
  const [alert, setAlert] = useState(null);

  // ==========================================
  // Modals & Action States
  // ==========================================
  const [productModal, setProductModal] = useState({ isOpen: false, mode: "add", data: null });
  const [customerModal, setCustomerModal] = useState({ isOpen: false });
  const [orderModal, setOrderModal] = useState({ isOpen: false });
  const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, order: null });

  // Form Fields State
  const [productForm, setProductForm] = useState({ name: "", sku: "", price: "", quantity_in_stock: "" });
  const [customerForm, setCustomerForm] = useState({ full_name: "", email: "", phone_number: "" });
  const [orderForm, setOrderForm] = useState({ customer_id: "", items: [{ product_id: "", quantity: 1 }] });

  // Show temporary banner alerts
  const triggerAlert = useCallback((type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }, []);

  // ==========================================
  // Fetch Handlers
  // ==========================================
  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      triggerAlert("error", "Failed to fetch dashboard summary: " + err.message);
    }
  }, [triggerAlert]);

  const fetchProductsData = useCallback(async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      triggerAlert("error", "Failed to fetch products: " + err.message);
    }
  }, [triggerAlert]);

  const fetchCustomersData = useCallback(async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      triggerAlert("error", "Failed to fetch customers: " + err.message);
    }
  }, [triggerAlert]);

  const fetchOrdersData = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      triggerAlert("error", "Failed to fetch orders: " + err.message);
    }
  }, [triggerAlert]);

  // Load everything on startup
  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchProductsData(),
        fetchCustomersData(),
        fetchOrdersData()
      ]);
      setLoading(false);
    };
    initLoad();
  }, [fetchDashboardData, fetchProductsData, fetchCustomersData, fetchOrdersData]);

  // Trigger refetch based on Tab selection or updates
  const refreshAllData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchProductsData(),
      fetchCustomersData(),
      fetchOrdersData()
    ]);
  };

  // ==========================================
  // PRODUCT ACTION HANDLERS
  // ==========================================
  const handleOpenProductModal = (mode, product = null) => {
    if (mode === "edit" && product) {
      setProductForm({
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price).toString(),
        quantity_in_stock: product.quantity_in_stock.toString()
      });
      setProductModal({ isOpen: true, mode: "edit", data: product });
    } else {
      setProductForm({ name: "", sku: "", price: "", quantity_in_stock: "0" });
      setProductModal({ isOpen: true, mode: "add", data: null });
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.sku.trim()) {
      triggerAlert("error", "Product Name and SKU are required.");
      return;
    }
    const priceNum = parseFloat(productForm.price);
    const qtyNum = parseInt(productForm.quantity_in_stock, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      triggerAlert("error", "Price must be a valid number greater than 0.");
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      triggerAlert("error", "Quantity in stock cannot be negative.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim().toUpperCase(),
        price: priceNum,
        quantity_in_stock: qtyNum
      };

      if (productModal.mode === "edit") {
        await api.updateProduct(productModal.data.id, payload);
        triggerAlert("success", "Product updated successfully!");
      } else {
        await api.createProduct(payload);
        triggerAlert("success", "Product added successfully!");
      }
      setProductModal({ isOpen: false, mode: "add", data: null });
      await refreshAllData();
    } catch (err) {
      triggerAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(id);
      triggerAlert("success", "Product deleted successfully!");
      await refreshAllData();
    } catch (err) {
      triggerAlert("error", err.message);
    }
  };

  // ==========================================
  // CUSTOMER ACTION HANDLERS
  // ==========================================
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerForm.full_name.trim() || !customerForm.email.trim() || !customerForm.phone_number.trim()) {
      triggerAlert("error", "All fields are required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email.trim())) {
      triggerAlert("error", "Please provide a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await api.createCustomer({
        full_name: customerForm.full_name.trim(),
        email: customerForm.email.trim(),
        phone_number: customerForm.phone_number.trim()
      });
      triggerAlert("success", "Customer added successfully!");
      setCustomerModal({ isOpen: false });
      setCustomerForm({ full_name: "", email: "", phone_number: "" });
      await refreshAllData();
    } catch (err) {
      triggerAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      await api.deleteCustomer(id);
      triggerAlert("success", "Customer deleted successfully!");
      await refreshAllData();
    } catch (err) {
      triggerAlert("error", err.message);
    }
  };

  // ==========================================
  // ORDER ACTION HANDLERS
  // ==========================================
  const handleAddOrderItemRow = () => {
    setOrderForm((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: 1 }]
    }));
  };

  const handleRemoveOrderItemRow = (index) => {
    if (orderForm.items.length === 1) return;
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleOrderItemChange = (index, field, value) => {
    const updatedItems = [...orderForm.items];
    if (field === "quantity") {
      updatedItems[index][field] = Math.max(1, parseInt(value, 10) || 1);
    } else {
      updatedItems[index][field] = value;
    }
    setOrderForm((prev) => ({ ...prev, items: updatedItems }));
  };

  const calculateLiveOrderTotal = () => {
    let total = 0;
    orderForm.items.forEach((item) => {
      if (!item.product_id) return;
      const product = products.find((p) => p.id === parseInt(item.product_id, 10));
      if (product) {
        total += parseFloat(product.price) * item.quantity;
      }
    });
    return total.toFixed(2);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.customer_id) {
      triggerAlert("error", "Please select a customer.");
      return;
    }

    // Filter out rows with incomplete selections
    const itemsPayload = orderForm.items
      .filter((item) => item.product_id)
      .map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity
      }));

    if (itemsPayload.length === 0) {
      triggerAlert("error", "Please add at least one valid product item to the order.");
      return;
    }

    // Verify stock locally first
    for (const item of itemsPayload) {
      const prod = products.find((p) => p.id === item.product_id);
      if (prod && prod.quantity_in_stock < item.quantity) {
        triggerAlert(
          "error",
          `Insufficient stock for '${prod.name}'. Available: ${prod.quantity_in_stock}, Requested: ${item.quantity}`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: parseInt(orderForm.customer_id, 10),
        items: itemsPayload
      };
      const newOrder = await api.createOrder(payload);
      triggerAlert("success", "Order placed successfully!");
      setOrderModal({ isOpen: false });
      setOrderForm({ customer_id: "", items: [{ product_id: "", quantity: 1 }] });
      await refreshAllData();
      
      // Auto-open invoice for newly created order
      handleViewInvoice(newOrder.id);
    } catch (err) {
      triggerAlert("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInvoice = async (orderId) => {
    try {
      const orderDetails = await api.getOrder(orderId);
      setInvoiceModal({ isOpen: true, order: orderDetails });
    } catch (err) {
      triggerAlert("error", "Failed to retrieve order details: " + err.message);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to CANCEL this order? Doing so will restore all items back to product inventory.")) return;
    try {
      await api.deleteOrder(id);
      triggerAlert("success", "Order cancelled and stock restored successfully!");
      await refreshAllData();
    } catch (err) {
      triggerAlert("error", err.message);
    }
  };

  // Helper: format money decimal
  const formatMoney = (val) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(parseFloat(val || 0));
  };

  if (loading) {
    return (
      <div className="spinner-container" style={{ minHeight: "100vh", background: "var(--bg-app)" }}>
        <div className="spinner"></div>
        <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Initializing Inventory Console...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* ==========================================
          MOBILE TOP HEADER
          ========================================== */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-brand">
          <ShoppingBag size={20} className="mobile-brand-icon" />
          <span>IM-SYSTEM</span>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* ==========================================
          MOBILE NAVIGATION OVERLAY
          ========================================== */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* ==========================================
          SIDEBAR NAVIGATION
          ========================================== */}
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : "mobile-closed"}`}>
        <div className="brand-section">
          <div className="brand-logo">
            <ShoppingBag size={22} strokeWidth={2.5} />
          </div>
          <span className="brand-name">IM-SYSTEM</span>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("dashboard");
              setMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeTab === "products" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("products");
              setMobileMenuOpen(false);
            }}
          >
            <ShoppingBag />
            <span>Products</span>
          </div>

          <div
            className={`nav-item ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("customers");
              setMobileMenuOpen(false);
            }}
          >
            <Users />
            <span>Customers</span>
          </div>

          <div
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("orders");
              setMobileMenuOpen(false);
            }}
          >
            <Receipt />
            <span>Orders</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-theme-btn" onClick={toggleTheme} type="button">
            {theme === "dark" ? (
              <>
                <Sun size={18} />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon size={18} />
                <span>Dark Theme</span>
              </>
            )}
          </button>
          <p className="footer-text">v1.0.0 • Connected to DB</p>
        </div>
      </aside>

      {/* ==========================================
          MAIN DASHBOARD DISPLAY
          ========================================== */}
      <main className="main-content">
        {/* Banner Notification Alert */}
        {alert && (
          <div className={`alert-banner alert-banner-${alert.type}`}>
            <AlertTriangle size={18} />
            <span>{alert.message}</span>
            <button className="modal-close-btn" style={{ marginLeft: "auto", position: "static" }} onClick={() => setAlert(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ==========================================
            TAB: DASHBOARD
            ========================================== */}
        {activeTab === "dashboard" && (
          <div>
            <header className="page-header">
              <div className="header-title-sec">
                <h1>Overview Dashboard</h1>
                <p>Real-time analytics and inventory alerts</p>
              </div>
              <button className="btn-primary" onClick={() => setOrderModal({ isOpen: true })}>
                <Plus size={18} />
                <span>New Sale Order</span>
              </button>
            </header>

            {/* Stat Summary Cards */}
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-header">
                  <span className="stat-title">Total Revenue</span>
                  <div className="stat-icon"><TrendingUp size={20} /></div>
                </div>
                <div className="stat-value">{formatMoney(summary?.total_revenue)}</div>
              </div>

              <div className="stat-card products">
                <div className="stat-header">
                  <span className="stat-title">Unique Products</span>
                  <div className="stat-icon"><ShoppingBag size={20} /></div>
                </div>
                <div className="stat-value">{summary?.total_products || 0}</div>
              </div>

              <div className="stat-card customers">
                <div className="stat-header">
                  <span className="stat-title">Active Customers</span>
                  <div className="stat-icon"><Users size={20} /></div>
                </div>
                <div className="stat-value">{summary?.total_customers || 0}</div>
              </div>

              <div className="stat-card orders">
                <div className="stat-header">
                  <span className="stat-title">Total Orders</span>
                  <div className="stat-icon"><Receipt size={20} /></div>
                </div>
                <div className="stat-value">{summary?.total_orders || 0}</div>
              </div>
            </div>

            {/* Split Content: Recent Orders & Stock Warning */}
            <div className="dashboard-split">
              {/* Recent Orders Panel */}
              <div className="panel" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Receipt size={18} style={{ color: "var(--primary-light)" }} />
                    <span>Recent Activity Queue</span>
                  </div>
                  <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={() => setActiveTab("orders")}>
                    View All
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="empty-state">
                    <Receipt />
                    <div className="empty-state-title">No transactions yet</div>
                    <div className="empty-state-desc">Place your first invoice sale order to populate transactions.</div>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total Amount</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td style={{ fontWeight: 600 }}>#ORD-{order.id}</td>
                            <td>{order.customer.full_name}</td>
                            <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)} units</td>
                            <td style={{ fontWeight: 600, color: "var(--primary-light)" }}>{formatMoney(order.total_amount)}</td>
                            <td>
                              <span className="badge badge-success">Processed</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button className="btn-secondary" style={{ padding: "0.3rem 0.6rem" }} onClick={() => handleViewInvoice(order.id)}>
                                <Eye size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Critical Inventory Alarm */}
              <div className="panel" style={{ marginBottom: 0 }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
                    <span>Low Stock Alarms</span>
                  </div>
                </div>

                {summary?.low_stock_products.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2.5rem 1.5rem" }}>
                    <ShoppingBag style={{ color: "var(--success)" }} />
                    <div className="empty-state-title" style={{ fontSize: "1rem" }}>All stocks normal</div>
                    <div className="empty-state-desc">All products have sufficient quantity in warehouse.</div>
                  </div>
                ) : (
                  <div className="low-stock-list">
                    {summary?.low_stock_products.map((prod) => {
                      const stockVal = prod.quantity_in_stock;
                      // Calculate width percentage representing stock threat level (max threshold is 10)
                      const pct = Math.min(100, Math.max(0, (stockVal / 10) * 100));
                      const barColor = stockVal === 0 ? "var(--error)" : "var(--warning)";
                      return (
                        <div className="low-stock-item" key={prod.id}>
                          <div className="low-stock-info">
                            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{prod.name}</span>
                            <span className="badge" style={{
                              background: stockVal === 0 ? "var(--error-glow)" : "var(--warning-glow)",
                              color: stockVal === 0 ? "var(--error-light)" : "var(--warning-light)"
                            }}>
                              {stockVal === 0 ? "OUT OF STOCK" : `${stockVal} left`}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "-0.2rem" }}>SKU: {prod.sku}</span>
                          <div className="progress-bar-container" style={{ marginTop: "0.25rem" }}>
                            <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: barColor }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: PRODUCTS CATALOG
            ========================================== */}
        {activeTab === "products" && (
          <div>
            <header className="page-header">
              <div className="header-title-sec">
                <h1>Products Catalog</h1>
                <p>Manage store inventory, prices, codes and stock quantities</p>
              </div>
              <button className="btn-primary" onClick={() => handleOpenProductModal("add")}>
                <Plus size={18} />
                <span>Add Product</span>
              </button>
            </header>

            <div className="panel">
              {products.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag />
                  <div className="empty-state-title">No products found</div>
                  <div className="empty-state-desc">Get started by creating a catalog record inside the warehouse system.</div>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Product Details</th>
                        <th>SKU Code</th>
                        <th>Unit Price</th>
                        <th>Inventory Level</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => {
                        const stock = prod.quantity_in_stock;
                        let badgeClass = "badge-success";
                        let stockLabel = "In Stock";
                        if (stock === 0) {
                          badgeClass = "badge-error";
                          stockLabel = "Out of Stock";
                        } else if (stock <= 10) {
                          badgeClass = "badge-warning";
                          stockLabel = "Low Stock";
                        }

                        return (
                          <tr key={prod.id}>
                            <td>#{prod.id}</td>
                            <td style={{ fontWeight: 600 }}>{prod.name}</td>
                            <td style={{ fontFamily: "monospace", letterSpacing: "0.5px" }}>{prod.sku}</td>
                            <td style={{ color: "var(--success-light)", fontWeight: 600 }}>{formatMoney(prod.price)}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span className={`badge ${badgeClass}`}>{stockLabel}</span>
                                <span style={{ fontWeight: 600 }}>({stock} units)</span>
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                                <button className="btn-secondary" style={{ padding: "0.4rem" }} onClick={() => handleOpenProductModal("edit", prod)}>
                                  <Edit3 size={14} />
                                </button>
                                <button className="btn-danger" style={{ padding: "0.4rem" }} onClick={() => handleDeleteProduct(prod.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: CUSTOMERS CRM
            ========================================== */}
        {activeTab === "customers" && (
          <div>
            <header className="page-header">
              <div className="header-title-sec">
                <h1>Customer Directory</h1>
                <p>Register and view customer contact profiles</p>
              </div>
              <button className="btn-primary" onClick={() => setCustomerModal({ isOpen: true })}>
                <Plus size={18} />
                <span>Add Customer</span>
              </button>
            </header>

            {customers.length === 0 ? (
              <div className="panel">
                <div className="empty-state">
                  <Users />
                  <div className="empty-state-title">No customers registered</div>
                  <div className="empty-state-desc">Create customer accounts to begin tracking accounts and invoices.</div>
                </div>
              </div>
            ) : (
              <div className="customer-grid">
                {customers.map((cust) => {
                  const nameParts = cust.full_name.split(" ");
                  const initials = nameParts.map((n) => n[0]).slice(0, 2).join("").toUpperCase();

                  return (
                    <div className="customer-card" key={cust.id}>
                      <div className="avatar">{initials}</div>
                      
                      <div className="customer-card-details">
                        <div className="customer-name">{cust.full_name}</div>
                        
                        <div className="customer-meta" style={{ marginTop: "0.25rem" }}>
                          <Mail />
                          <span>{cust.email}</span>
                        </div>
                        
                        <div className="customer-meta">
                          <Phone />
                          <span>{cust.phone_number}</span>
                        </div>
                        
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>ID: #CUST-{cust.id}</span>
                      </div>

                      <button className="btn-danger customer-delete-btn" style={{ padding: "0.4rem" }} onClick={() => handleDeleteCustomer(cust.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB: ORDERS QUEUE
            ========================================== */}
        {activeTab === "orders" && (
          <div>
            <header className="page-header">
              <div className="header-title-sec">
                <h1>Sales & Orders Ledger</h1>
                <p>Track purchase accounts, invoice details and cancel orders</p>
              </div>
              <button className="btn-primary" onClick={() => setOrderModal({ isOpen: true })}>
                <Plus size={18} />
                <span>New Sale Order</span>
              </button>
            </header>

            <div className="panel">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <Receipt />
                  <div className="empty-state-title">No orders placed</div>
                  <div className="empty-state-desc">Create a new sale order transaction to deduct warehouse stocks.</div>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Order Ref</th>
                        <th>Customer Profile</th>
                        <th>Order Date</th>
                        <th>Line Items</th>
                        <th>Grand Total</th>
                        <th>State</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>#ORD-{order.id}</td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 500 }}>{order.customer.full_name}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.customer.email}</span>
                            </div>
                          </td>
                          <td>{new Date(order.created_at).toLocaleString()}</td>
                          <td>
                            <span className="badge badge-info">
                              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items ({order.items.length} unique)
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: "var(--primary-light)" }}>{formatMoney(order.total_amount)}</td>
                          <td>
                            <span className="badge badge-success">Completed</span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button className="btn-secondary" style={{ padding: "0.4rem" }} onClick={() => handleViewInvoice(order.id)}>
                                <Eye size={14} />
                              </button>
                              <button className="btn-danger" style={{ padding: "0.4rem" }} onClick={() => handleDeleteOrder(order.id)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL: ADD / EDIT PRODUCT
          ========================================== */}
      {productModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setProductModal({ isOpen: false, mode: "add", data: null })}>
              <X size={18} />
            </button>
            <h2 className="modal-title">{productModal.mode === "edit" ? "Modify Product Details" : "Register Catalog Product"}</h2>
            
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Stealth Gaming Mouse"
                  value={productForm.name}
                  onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Product SKU / Code</label>
                <input
                  type="text"
                  placeholder="e.g. MOU-STEALTH-01"
                  value={productForm.sku}
                  onChange={(e) => setProductForm((p) => ({ ...p, sku: e.target.value }))}
                  disabled={productModal.mode === "edit"} // block sku edit for stability
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Quantity In Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={productForm.quantity_in_stock}
                    onChange={(e) => setProductForm((p) => ({ ...p, quantity_in_stock: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="actions-row">
                <button type="button" className="btn-secondary" onClick={() => setProductModal({ isOpen: false, mode: "add", data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="spinner" size={16} /> : (productModal.mode === "edit" ? "Save Changes" : "Create Product")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD CUSTOMER
          ========================================== */}
      {customerModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={() => setCustomerModal({ isOpen: false })}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Register New Customer Profile</h2>
            
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label>Customer Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Vance"
                  value={customerForm.full_name}
                  onChange={(e) => setCustomerForm((c) => ({ ...c, full_name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. alexander@domain.com"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm((c) => ({ ...c, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 902-1240"
                  value={customerForm.phone_number}
                  onChange={(e) => setCustomerForm((c) => ({ ...c, phone_number: e.target.value }))}
                  required
                />
              </div>

              <div className="actions-row">
                <button type="button" className="btn-secondary" onClick={() => setCustomerModal({ isOpen: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="spinner" size={16} /> : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CREATE SALE ORDER (WITH MULTI-ITEMS BUILDER)
          ========================================== */}
      {orderModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close-btn" onClick={() => setOrderModal({ isOpen: false })}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Draft New Sale Invoice</h2>
            
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group">
                <label>Select Customer Profile</label>
                <select
                  value={orderForm.customer_id}
                  onChange={(e) => setOrderForm((prev) => ({ ...prev, customer_id: e.target.value }))}
                  required
                >
                  <option value="">-- Choose registered customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                  ))}
                </select>
              </div>

              {/* Order Items Builder Segment */}
              <div className="order-items-builder">
                <div className="order-items-builder-header">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <ShoppingCart size={16} />
                    <span>Purchase Line Items</span>
                  </label>
                  <button type="button" className="btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }} onClick={handleAddOrderItemRow}>
                    <Plus size={14} />
                    <span>Add Row</span>
                  </button>
                </div>

                {orderForm.items.map((row, index) => {
                  const selectedProduct = products.find((p) => p.id === parseInt(row.product_id, 10));
                  return (
                    <div className="order-builder-row" key={index}>
                      {/* Product Selector */}
                      <select
                        value={row.product_id}
                        onChange={(e) => handleOrderItemChange(index, "product_id", e.target.value)}
                        required
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                            {p.name} {p.quantity_in_stock === 0 ? "(Out of Stock)" : `(Stock: ${p.quantity_in_stock})`} - {formatMoney(p.price)}
                          </option>
                        ))}
                      </select>

                      {/* Quantity Input */}
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => handleOrderItemChange(index, "quantity", e.target.value)}
                        required
                      />

                      {/* Subtotal preview for line row */}
                      <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500, paddingLeft: "0.5rem" }}>
                        {selectedProduct
                          ? formatMoney(parseFloat(selectedProduct.price) * row.quantity)
                          : "₹0.00"}
                      </span>

                      {/* Delete Row Button */}
                      <button
                        type="button"
                        className="builder-remove-btn"
                        onClick={() => handleRemoveOrderItemRow(index)}
                        disabled={orderForm.items.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

                {/* Grand Order Sum */}
                <div className="order-invoice-total">
                  <span className="invoice-total-label">Grand Total:</span>
                  <span className="invoice-total-value">{formatMoney(calculateLiveOrderTotal())}</span>
                </div>
              </div>

              <div className="actions-row">
                <button type="button" className="btn-secondary" onClick={() => setOrderModal({ isOpen: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="spinner" size={16} /> : "Validate & Place Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: INVOICE / ORDER RECEIPT DETAILS
          ========================================== */}
      {invoiceModal.isOpen && invoiceModal.order && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close-btn" onClick={() => setInvoiceModal({ isOpen: false, order: null })}>
              <X size={18} />
            </button>
            <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Receipt style={{ color: "var(--primary-light)" }} />
              <span>Purchase Invoice Receipt</span>
            </h2>

            <div className="invoice-container">
              {/* Meta information columns */}
              <div className="invoice-meta-row">
                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">Order Reference</span>
                  <span className="invoice-meta-val" style={{ fontWeight: 700 }}>#ORD-{invoiceModal.order.id}</span>
                </div>

                <div className="invoice-meta-item">
                  <span className="invoice-meta-label">Transaction Date</span>
                  <span className="invoice-meta-val">{new Date(invoiceModal.order.created_at).toLocaleString()}</span>
                </div>

                <div className="invoice-meta-item" style={{ marginTop: "0.75rem" }}>
                  <span className="invoice-meta-label">Bill To Customer</span>
                  <span className="invoice-meta-val" style={{ fontWeight: 600 }}>{invoiceModal.order.customer.full_name}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{invoiceModal.order.customer.email}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{invoiceModal.order.customer.phone_number}</span>
                </div>

                <div className="invoice-meta-item" style={{ marginTop: "0.75rem" }}>
                  <span className="invoice-meta-label">Fulfilment Status</span>
                  <span className="invoice-meta-val">
                    <span className="badge badge-success" style={{ marginTop: "0.2rem" }}>Processed & Paid</span>
                  </span>
                </div>
              </div>

              {/* Items Purchased List */}
              <div className="panel" style={{ padding: 0, border: "1px solid var(--border-card)", overflow: "hidden" }}>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product Details</th>
                        <th style={{ textAlign: "center" }}>Quantity</th>
                        <th style={{ textAlign: "right" }}>Unit Price</th>
                        <th style={{ textAlign: "right" }}>Line Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceModal.order.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: 600 }}>{item.product?.name || "Unknown Product"}</span>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                                SKU: {item.product?.sku || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>{item.quantity} units</td>
                          <td style={{ textAlign: "right" }}>{formatMoney(item.unit_price)}</td>
                          <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text-primary)" }}>
                            {formatMoney(parseFloat(item.unit_price) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand Total Indicator */}
              <div className="order-invoice-total" style={{ borderTop: "2px solid var(--border-card)", paddingTop: "1.25rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>Total Invoiced Amount:</span>
                <span className="invoice-total-value" style={{ fontSize: "1.75rem" }}>
                  {formatMoney(invoiceModal.order.total_amount)}
                </span>
              </div>

              {/* Action commands */}
              <div className="actions-row">
                <button type="button" className="btn-secondary" onClick={() => setInvoiceModal({ isOpen: false, order: null })}>
                  Close Receipt
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => {
                    const id = invoiceModal.order.id;
                    setInvoiceModal({ isOpen: false, order: null });
                    handleDeleteOrder(id);
                  }}
                >
                  <Trash2 size={16} />
                  <span>Cancel Transaction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

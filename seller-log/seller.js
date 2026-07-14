(() => {
  "use strict";

  const ADMIN_KEY = "fashion_admin";
  const THEME_KEY = "fashion_theme";
  const PRODUCTS_KEY = "fashion_products_v4";
  const ORDERS_KEY = "fashion_orders_v3";
  const SETTINGS_KEY = "fashion_seller_settings_v1";
  const allowedThemes = ["red", "orange", "blue", "teal", "green", "blue-grey"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

  const state = {
    products: loadProducts(),
    orders: readJson(ORDERS_KEY, []),
    currentPage: "dashboard",
    orderFilter: "all",
    productFilter: "all",
    productQuery: ""
  };

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }

  function slugify(value) {
    return String(value || "produk")
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `produk-${Date.now()}`;
  }

  function loadProducts() {
    const saved = readJson(PRODUCTS_KEY, null);
    const defaults = window.StoreData?.products || [];
    return (saved || defaults).map((product) => ({
      sold: 0,
      stock: 0,
      discount: 0,
      active: product.active !== false,
      ...product,
      image: product.image || product.photos?.[0] || defaultImage(product)
    }));
  }

  function defaultImage(product = {}) {
    const photos = window.StoreData?.productPhotos || {};
    const text = `${product.id || ""} ${product.category || ""} ${product.title || ""}`.toLowerCase();
    let key = "dress";
    if (text.includes("blouse")) key = "blouse";
    else if (text.includes("outer")) key = "outer";
    else if (text.includes("tas") || text.includes("bag")) key = "bag";
    else if (text.includes("rok") || text.includes("skirt")) key = "skirt";
    else if (text.includes("sepatu") || text.includes("heel")) key = "heels";
    else if (text.includes("elektronik") || text.includes("earbud")) key = "elektronik";
    else if (text.includes("cantik") || text.includes("beauty")) key = "kecantikan";
    else if (text.includes("rumah") || text.includes("lamp")) key = "rumah";
    return photos[key]?.[0] || "../hero-fashion.svg";
  }

  function imageSrc(source) {
    const src = source || "../hero-fashion.svg";
    if (/^(data:|https?:|\.\.\/|\/)/.test(src)) return src;
    return `../${src.replace(/^\.\//, "")}`;
  }

  function orderStatus(order) {
    const text = String(order.status || "").toLowerCase();
    if (text.includes("batal") || text.includes("kembali") || text.includes("refund")) return "cancelled";
    if (text.includes("kirim") || text.includes("selesai") || text.includes("diproses")) return "processed";
    return "pending";
  }

  function orderTotal(order) {
    if (Number.isFinite(Number(order.total))) return Number(order.total);
    if (Number.isFinite(Number(order.grandTotal))) return Number(order.grandTotal);
    if (Array.isArray(order.items)) {
      return order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1), 0);
    }
    return 0;
  }

  function applyTheme(theme) {
    const safe = allowedThemes.includes(theme) ? theme : "red";
    document.body.dataset.theme = safe;
    localStorage.setItem(THEME_KEY, safe);
    $$('[data-theme-choice]').forEach((button) => button.classList.toggle("active", button.dataset.themeChoice === safe));
  }

  function showApp() {
    const loggedIn = localStorage.getItem(ADMIN_KEY) === "true";
    $("#loginGate").hidden = loggedIn;
    $("#sellerApp").hidden = !loggedIn;
    if (loggedIn) renderAll();
  }

  function navigate(page, options = {}) {
    if (!$( `[data-page-panel="${page}"]` )) page = "dashboard";
    state.currentPage = page;
    if (options.orderFilter) state.orderFilter = options.orderFilter;
    if (options.productFilter) state.productFilter = options.productFilter;

    $$("[data-page-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.pagePanel === page));
    $$(".nav-item, .nav-children button").forEach((button) => button.classList.toggle("active", button.dataset.page === page));
    document.body.classList.remove("sidebar-open");

    if (page === "orders") renderOrders();
    if (page === "products") renderProducts();
    if (page === "add-product" && !options.keepForm) resetProductForm();
    if (page === "reports") renderReports();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function metrics() {
    const pending = state.orders.filter((order) => orderStatus(order) === "pending").length;
    const processed = state.orders.filter((order) => orderStatus(order) === "processed").length;
    const cancelled = state.orders.filter((order) => orderStatus(order) === "cancelled").length;
    const inactive = state.products.filter((product) => product.active === false).length;
    const low = state.products.filter((product) => Number(product.stock || 0) <= 5).length;
    const sales = state.orders.reduce((sum, order) => sum + orderTotal(order), 0);
    const orderCount = state.orders.length;
    const visitors = Math.max(407, orderCount * 38 + 129);
    const clicks = Math.max(129, state.products.reduce((sum, product) => sum + Number(product.sold || 0), 0));
    return { pending, processed, cancelled, inactive, low, sales, orderCount, visitors, clicks };
  }

  function renderDashboard() {
    const m = metrics();
    $("#pendingCount").textContent = m.pending;
    $("#processedCount").textContent = m.processed;
    $("#cancelledCount").textContent = m.cancelled;
    $("#inactiveCount").textContent = m.inactive;
    $("#lowStockCount").textContent = m.low;
    $("#salesMetric").textContent = compactCurrency(m.sales);
    $("#visitorMetric").textContent = m.visitors.toLocaleString("id-ID");
    $("#clickMetric").textContent = m.clicks.toLocaleString("id-ID");
    $("#orderMetric").textContent = m.orderCount;
    $("#conversionMetric").textContent = `${m.visitors ? ((m.orderCount / m.visitors) * 100).toFixed(2) : "0.00"}%`;
    $("#fastSalesMetric").textContent = compactCurrency(m.sales * .71);
    $("#fastOrdersMetric").textContent = Math.round(m.orderCount * .75);
    $("#updatedLabel").textContent = `Diperbarui ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;

    const best = [...state.products].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 4);
    $("#bestProducts").innerHTML = best.length ? best.map((product) => `
      <div class="best-item">
        <img src="${safeText(imageSrc(product.image))}" alt="${safeText(product.title)}" />
        <span><b>${safeText(product.title)}</b><small>Stok ${Number(product.stock || 0)} · ${Number(product.sold || 0)} terjual</small></span>
        <strong>${compactCurrency(Number(product.price || 0))}</strong>
      </div>`).join("") : `<div class="empty-state">Belum ada produk.</div>`;

    const activities = [
      { icon: "!", title: `${m.pending} pesanan perlu diproses`, note: "Periksa dan atur pengiriman", page: "orders", filter: "pending" },
      { icon: "↓", title: `${m.low} produk stok menipis`, note: "Tambahkan stok agar tetap dapat dibeli", page: "products", filter: "low" },
      { icon: "%", title: "Optimalkan promo produk", note: "Gunakan diskon untuk meningkatkan konversi", page: "promotions" }
    ];
    $("#activityList").innerHTML = activities.map((item) => `
      <div class="activity-item"><span class="activity-icon">${item.icon}</span><div><b>${safeText(item.title)}</b><small>${safeText(item.note)}</small></div><button type="button" data-page="${item.page}" ${item.filter ? `data-${item.page === "orders" ? "order" : "product"}-filter="${item.filter}"` : ""}>Buka</button></div>
    `).join("");
  }

  function compactCurrency(value) {
    const number = Number(value || 0);
    if (number >= 1_000_000) return `Rp${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}Jt`;
    if (number >= 1_000) return `Rp${(number / 1_000).toFixed(number >= 100_000 ? 0 : 1)}K`;
    return rupiah.format(number);
  }

  function renderOrders() {
    $$("[data-order-tab]").forEach((button) => button.classList.toggle("active", button.dataset.orderTab === state.orderFilter));
    const filtered = state.orders.filter((order) => state.orderFilter === "all" || orderStatus(order) === state.orderFilter);
    $("#orderEmpty").hidden = filtered.length > 0;
    $("#orderTableBody").innerHTML = filtered.map((order, index) => {
      const status = orderStatus(order);
      const statusLabel = status === "processed" ? "Telah Diproses" : status === "cancelled" ? "Dibatalkan" : "Perlu Diproses";
      const customer = order.name || order.customer || order.email || order.address?.name || "Pelanggan";
      const payment = order.payment || order.paymentMethod || "Belum ditentukan";
      return `<tr>
        <td><b>${safeText(order.id || `ORD-${index + 1}`)}</b></td>
        <td>${safeText(customer)}</td>
        <td><b>${rupiah.format(orderTotal(order))}</b></td>
        <td>${safeText(payment)}</td>
        <td><span class="status-pill ${status === "processed" ? "" : status}">${statusLabel}</span></td>
        <td><div class="action-buttons">
          ${status === "pending" ? `<button type="button" data-process-order="${index}">Proses</button>` : ""}
          ${status !== "cancelled" ? `<button class="danger" type="button" data-cancel-order="${index}">Batalkan</button>` : ""}
        </div></td>
      </tr>`;
    }).join("");
  }

  function filteredProducts() {
    const query = state.productQuery.trim().toLowerCase();
    return state.products.filter((product) => {
      const matchQuery = !query || `${product.title} ${product.category}`.toLowerCase().includes(query);
      let matchStatus = true;
      if (state.productFilter === "active") matchStatus = product.active !== false;
      if (state.productFilter === "inactive") matchStatus = product.active === false;
      if (state.productFilter === "low") matchStatus = Number(product.stock || 0) <= 5;
      return matchQuery && matchStatus;
    });
  }

  function renderProducts() {
    $("#productStatusFilter").value = state.productFilter;
    $("#productSearch").value = state.productQuery;
    const products = filteredProducts();
    $("#productResultCount").textContent = `${products.length} produk`;
    $("#productEmpty").hidden = products.length > 0;
    $("#productTableBody").innerHTML = products.map((product) => `
      <tr>
        <td><div class="product-cell"><img src="${safeText(imageSrc(product.image))}" alt="${safeText(product.title)}" /><span><b>${safeText(product.title)}</b><small>${safeText(product.category || "Tanpa kategori")}</small></span></div></td>
        <td><b>${rupiah.format(Number(product.price || 0))}</b>${Number(product.discount || 0) ? `<br><small>Diskon ${Number(product.discount)}%</small>` : ""}</td>
        <td>${Number(product.stock || 0)} ${Number(product.stock || 0) <= 5 ? `<small class="down">Stok menipis</small>` : ""}</td>
        <td>${Number(product.sold || 0)}</td>
        <td><span class="status-pill ${product.active === false ? "inactive" : ""}">${product.active === false ? "Nonaktif" : "Aktif"}</span></td>
        <td><div class="action-buttons"><button type="button" data-edit-product="${safeText(product.id)}">Edit</button><button type="button" data-toggle-product="${safeText(product.id)}">${product.active === false ? "Aktifkan" : "Nonaktifkan"}</button><button class="danger" type="button" data-delete-product="${safeText(product.id)}">Hapus</button></div></td>
      </tr>`).join("");
  }

  function resetProductForm() {
    const form = $("#productForm");
    form.reset();
    form.elements.id.value = "";
    form.elements.discount.value = 0;
    form.elements.stock.value = 1;
    form.elements.active.value = "true";
    $("#productFormTitle").textContent = "Tambah Produk Baru";
    renderImagePreview("");
  }

  function editProduct(id) {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;
    const form = $("#productForm");
    form.elements.id.value = product.id;
    form.elements.title.value = product.title || "";
    form.elements.category.value = product.category || "";
    form.elements.active.value = product.active === false ? "false" : "true";
    form.elements.description.value = product.description || "";
    form.elements.price.value = Number(product.price || 0);
    form.elements.discount.value = Number(product.discount || 0);
    form.elements.stock.value = Number(product.stock || 0);
    form.elements.image.value = product.image || "";
    $("#productFormTitle").textContent = "Edit Produk";
    renderImagePreview(product.image || "");
    navigate("add-product", { keepForm: true });
  }

  function saveProduct(form) {
    const data = new FormData(form);
    const existingId = String(data.get("id") || "").trim();
    let id = existingId || slugify(data.get("title"));
    if (!existingId && state.products.some((product) => product.id === id)) id = `${id}-${Date.now()}`;
    const old = state.products.find((product) => product.id === existingId) || {};
    const product = {
      ...old,
      id,
      title: String(data.get("title") || "").trim(),
      category: String(data.get("category") || "").trim(),
      active: data.get("active") === "true",
      description: String(data.get("description") || "").trim(),
      price: Math.max(0, Number(data.get("price") || 0)),
      discount: Math.min(90, Math.max(0, Number(data.get("discount") || 0))),
      stock: Math.max(0, Number(data.get("stock") || 0)),
      sold: Number(old.sold || 0),
      rating: Number(old.rating || 4.8),
      image: String(data.get("image") || "").trim() || old.image || defaultImage({ id, category: data.get("category"), title: data.get("title") })
    };
    const index = state.products.findIndex((item) => item.id === existingId);
    if (index >= 0) state.products[index] = product; else state.products.unshift(product);
    writeJson(PRODUCTS_KEY, state.products);
    notify(existingId ? "Produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
    navigate("products");
    renderAll();
  }

  function renderImagePreview(value) {
    const preview = $("#imagePreview");
    if (!value) { preview.innerHTML = "<span>Pratinjau gambar</span>"; return; }
    preview.innerHTML = `<img src="${safeText(imageSrc(value))}" alt="Pratinjau produk" />`;
  }

  function renderReports() {
    const m = metrics();
    $("#reportRevenue").textContent = rupiah.format(m.sales);
    $("#reportOrders").textContent = m.orderCount;
    $("#reportProducts").textContent = state.products.filter((product) => product.active !== false).length;
    const base = Math.max(15, Math.round(m.sales / 100000));
    const values = [42, 58, 47, 72, 64, 83, 91].map((value, index) => Math.max(8, Math.min(100, value + Math.round(base / (index + 3)))));
    const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    $("#barChart").innerHTML = values.map((value, index) => `<div class="bar-column"><i style="height:${value}%" title="${value}%"></i><span>${days[index]}</span></div>`).join("");
  }

  function loadSettings() {
    const settings = readJson(SETTINGS_KEY, null);
    if (!settings) return;
    const form = $("#settingsForm");
    if (settings.storeName) form.elements.storeName.value = settings.storeName;
    if (settings.storeEmail) form.elements.storeEmail.value = settings.storeEmail;
    if (settings.storeAddress) form.elements.storeAddress.value = settings.storeAddress;
  }

  function renderAll() {
    state.products = loadProducts();
    state.orders = readJson(ORDERS_KEY, []);
    renderDashboard();
    renderOrders();
    renderProducts();
    renderReports();
  }

  document.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page]");
    const groupTitle = event.target.closest(".nav-group-title");
    const orderTab = event.target.closest("[data-order-tab]");
    const editButton = event.target.closest("[data-edit-product]");
    const toggleButton = event.target.closest("[data-toggle-product]");
    const deleteButton = event.target.closest("[data-delete-product]");
    const processButton = event.target.closest("[data-process-order]");
    const cancelButton = event.target.closest("[data-cancel-order]");
    const themeButton = event.target.closest("[data-theme-choice]");

    if (groupTitle) groupTitle.closest(".nav-group").classList.toggle("open");
    if (pageButton) navigate(pageButton.dataset.page, { orderFilter: pageButton.dataset.orderFilter, productFilter: pageButton.dataset.productFilter });
    if (orderTab) { state.orderFilter = orderTab.dataset.orderTab; renderOrders(); }
    if (editButton) editProduct(editButton.dataset.editProduct);
    if (toggleButton) {
      const product = state.products.find((item) => item.id === toggleButton.dataset.toggleProduct);
      if (product) { product.active = product.active === false; writeJson(PRODUCTS_KEY, state.products); renderAll(); notify("Status produk diperbarui."); }
    }
    if (deleteButton) {
      const product = state.products.find((item) => item.id === deleteButton.dataset.deleteProduct);
      if (product && window.confirm(`Hapus produk “${product.title}”?`)) {
        state.products = state.products.filter((item) => item.id !== product.id);
        writeJson(PRODUCTS_KEY, state.products);
        renderAll(); notify("Produk dihapus.");
      }
    }
    if (processButton) {
      const order = state.orders[Number(processButton.dataset.processOrder)];
      if (order) { order.status = "Telah diproses"; writeJson(ORDERS_KEY, state.orders); renderAll(); notify("Pesanan diproses."); }
    }
    if (cancelButton) {
      const order = state.orders[Number(cancelButton.dataset.cancelOrder)];
      if (order) { order.status = "Dibatalkan"; writeJson(ORDERS_KEY, state.orders); renderAll(); notify("Pesanan dibatalkan."); }
    }
    if (themeButton) { applyTheme(themeButton.dataset.themeChoice); notify("Thema diperbarui."); }
  });

  $("#sellerLoginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const valid = data.get("username") === "admin" && data.get("password") === "admin123";
    $("#loginError").hidden = valid;
    if (valid) { localStorage.setItem(ADMIN_KEY, "true"); showApp(); notify("Berhasil masuk ke Seller Center."); }
  });

  $("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem(ADMIN_KEY);
    $("#profileDropdown").hidden = true;
    showApp();
  });

  $("#profileButton").addEventListener("click", () => { $("#profileDropdown").hidden = !$("#profileDropdown").hidden; });
  $("#menuButton").addEventListener("click", () => document.body.classList.toggle("sidebar-open"));

  $("#productSearch").addEventListener("input", (event) => { state.productQuery = event.target.value; renderProducts(); });
  $("#productStatusFilter").addEventListener("change", (event) => { state.productFilter = event.target.value; renderProducts(); });
  $("#globalSearch").addEventListener("input", (event) => {
    state.productQuery = event.target.value;
    if (event.target.value.trim()) navigate("products"); else if (state.currentPage === "products") renderProducts();
  });

  $("#productForm").addEventListener("submit", (event) => { event.preventDefault(); saveProduct(event.currentTarget); });
  $("#productForm").elements.image.addEventListener("input", (event) => renderImagePreview(event.target.value));
  $("#settingsForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    writeJson(SETTINGS_KEY, data);
    notify("Pengaturan toko disimpan.");
  });

  function notify(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  applyTheme(localStorage.getItem(THEME_KEY) || "red");
  loadSettings();
  showApp();
})();

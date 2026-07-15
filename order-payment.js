const DATA = window.StoreData || { products: [], shippingOptions: [], paymentMethods: [] };
const ORDERS_KEY = "fashion_orders_v3";
const PRODUCTS_KEY = "fashion_products_v4";
const SHIPPING_KEY = "fashion_shipping_v1";
const PAYMENT_KEY = "fashion_payments_v1";
const ADDRESS_KEY = "fashion_buyer_address_v1";
const THEME_KEY = "fashion_theme";
const REGION_API_BASE = "https://emsifa.github.io/api-wilayah-indonesia/api";
const POSTAL_SQL_URL = "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah_kodepos.sql";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const els = {
  page: document.querySelector("#paymentPage"),
  productRow: document.querySelector("#paymentProductRow"),
  productTotal: document.querySelector("#paymentProductTotal"),
  shippingTotal: document.querySelector("#paymentShippingTotal"),
  grandTotal: document.querySelector("#paymentGrandTotal"),
  paymentNumberBox: document.querySelector("#paymentNumberBox"),
  shippingSelect: document.querySelector("#orderShippingSelect"),
  paymentSelect: document.querySelector("#orderPaymentSelect"),
  paymentGuide: document.querySelector("#paymentGuide"),
  shippingNotice: document.querySelector("#shippingAddressNotice"),
  proof: document.querySelector("#paymentProof"),
  confirm: document.querySelector("#confirmPayment"),
  help: document.querySelector("#paymentHelp"),
  result: document.querySelector("#confirmResult"),
  status: document.querySelector("#orderStatusText"),
  searchForm: document.querySelector("#paymentSearchForm"),
  searchInput: document.querySelector("#paymentSearchInput"),
  toast: document.querySelector("#toast"),
  addressOpen: document.querySelector("#addressOpen"),
  addressPreview: document.querySelector("#addressPreview"),
  addressModal: document.querySelector("#addressModal"),
  addressClose: document.querySelector("#addressClose"),
  addressOk: document.querySelector("#addressOk"),
  addressName: document.querySelector("#addressName"),
  addressPhone: document.querySelector("#addressPhone"),
  addressStreet: document.querySelector("#addressStreet"),
  addressSearch: document.querySelector("#addressSearch"),
  addressOptions: document.querySelector("#addressOptions")
};

const regionCache = {
  provinces: null,
  cities: {},
  districts: {},
  postals: {},
  postalSql: null
};

const state = {
  shippingOptions: read(SHIPPING_KEY, DATA.shippingOptions || []),
  paymentMethods: read(PAYMENT_KEY, DATA.paymentMethods || []),
  address: read(ADDRESS_KEY, null),
  addressDraft: {
    step: "province",
    province: "",
    provinceCode: "",
    city: "",
    cityCode: "",
    district: "",
    districtCode: "",
    postal: "",
    tag: "Rumah"
  }
};

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Penyimpanan lokal tidak tersedia:", error);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const chars = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return chars[char];
  });
}

function applyTheme(theme) {
  const themes = ["red", "orange", "blue", "teal", "green", "blue-grey"];
  document.body.dataset.theme = themes.includes(theme) ? theme : "red";
}

function notify(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function findOrder() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order");
  const rawOrders = read(ORDERS_KEY, []);
  const orders = Array.isArray(rawOrders) ? rawOrders.filter((item) => item && typeof item === "object") : [];
  const order = orderId ? orders.find((item) => item.id === orderId) : orders[orders.length - 1];
  return { orders, order, orderId: orderId || order?.id || "" };
}

function getPaymentMethod(name) {
  return state.paymentMethods.find((item) => item.name === name);
}

function getSelectedShipping() {
  if (!state.address) return { name: "Isi Alamat", cost: 0 };
  const selected = els.shippingSelect?.value || "";
  const [name, cost] = selected.split("|");
  return { name: name || "Pilih ekspedisi", cost: Number(cost || 0) };
}

function productImageFor(order) {
  if (!order || typeof order !== "object") return "assets/photos/dress-1.jpg";
  if (order.productImage) return order.productImage;
  const savedProducts = read(PRODUCTS_KEY, DATA.products || []);
  const products = Array.isArray(savedProducts) ? savedProducts : (DATA.products || []);
  const item = order.items?.[0];
  const product = products.find((entry) => entry && entry.id === item?.id);
  return product?.photos?.[0] || product?.image || "assets/sample-product-real.jpg";
}

function getLocalRegionData() {
  return window.RegionData || window.REGION_DATA || window.regionData || null;
}

function sortRegionRows(rows) {
  return rows.slice().sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
}

function normalizeLocalRows(rows) {
  if (!Array.isArray(rows)) return [];
  return sortRegionRows(rows.map((item) => {
    if (Array.isArray(item)) return { code: String(item[0] || item[1] || ""), name: String(item[1] || item[0] || "").trim() };
    return { code: String(item.code || item.id || item.kode || item.name || ""), name: String(item.name || item.nama || item.code || "").trim() };
  }).filter((item) => item.code && item.name));
}

function normalizeRegionRows(payload) {
  return sortRegionRows((payload?.data || []).map((item) => ({
    code: String(item.code || ""),
    name: String(item.name || "").trim()
  })).filter((item) => item.code && item.name));
}

async function fetchRegionRows(url) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error("Data wilayah gagal dimuat");
  return normalizeRegionRows(await response.json());
}

async function getProvinceRows() {
  if (!regionCache.provinces) {
    const local = getLocalRegionData();
    regionCache.provinces = local ? normalizeLocalRows(local.provinces) : await fetchRegionRows(`${REGION_API_BASE}/provinces.json`);
  }
  return regionCache.provinces;
}

async function getCityRows(provinceCode) {
  if (!provinceCode) return [];
  if (!regionCache.cities[provinceCode]) {
    const local = getLocalRegionData();
    regionCache.cities[provinceCode] = local ? normalizeLocalRows(local.cities?.[provinceCode]) : await fetchRegionRows(`${REGION_API_BASE}/regencies/${provinceCode}.json`);
  }
  return regionCache.cities[provinceCode];
}

async function getDistrictRows(cityCode) {
  if (!cityCode) return [];
  if (!regionCache.districts[cityCode]) {
    const local = getLocalRegionData();
    regionCache.districts[cityCode] = local ? normalizeLocalRows(local.districts?.[cityCode]) : await fetchRegionRows(`${REGION_API_BASE}/districts/${cityCode}.json`);
  }
  return regionCache.districts[cityCode];
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getPostalRows(districtCode) {
  if (!districtCode) return [];
  if (regionCache.postals[districtCode]) return regionCache.postals[districtCode];
  const local = getLocalRegionData();
  if (local) {
    regionCache.postals[districtCode] = normalizeLocalRows(local.postals?.[districtCode]);
    return regionCache.postals[districtCode];
  }
  if (!regionCache.postalSql) {
    const response = await fetch(POSTAL_SQL_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error("Data kode pos gagal dimuat");
    regionCache.postalSql = await response.text();
  }
  const pattern = new RegExp(`\\('${escapeRegex(districtCode)}\\.\\d{4}'\\s*,\\s*'?([0-9]{5})'?\\)`, "g");
  const found = new Set();
  let match;
  while ((match = pattern.exec(regionCache.postalSql)) !== null) found.add(match[1]);
  regionCache.postals[districtCode] = Array.from(found).sort().map((code) => ({ code, name: code }));
  return regionCache.postals[districtCode];
}

function renderPostalManual(container, currentPostal = "") {
  container.innerHTML = `
    <div class="address-manual-box">
      <label for="addressPostalManual">Kode pos tidak ditemukan otomatis. Masukkan kode pos 5 digit.</label>
      <input id="addressPostalManual" class="address-manual-input" type="text" inputmode="numeric" maxlength="5" placeholder="Contoh: 10210" value="${escapeHtml(currentPostal || "")}" data-address-postal-manual />
    </div>
  `;
}

const addressStepLabels = {
  province: "Provinsi",
  city: "Kota / Kabupaten",
  district: "Kecamatan",
  postal: "Kode Pos"
};

async function availableAddressRows(step) {
  if (step === "province") return getProvinceRows();
  if (step === "city") return getCityRows(state.addressDraft.provinceCode);
  if (step === "district") return getDistrictRows(state.addressDraft.cityCode);
  return getPostalRows(state.addressDraft.districtCode);
}

function selectedAddressParts() {
  return [state.addressDraft.province, state.addressDraft.city, state.addressDraft.district, state.addressDraft.postal].filter(Boolean);
}

function updateAddressSearch() {
  if (els.addressSearch) els.addressSearch.value = selectedAddressParts().join(", ");
}

function setAddressStep(step) {
  state.addressDraft.step = step;
  document.querySelectorAll("[data-address-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.addressTab === step);
  });
  renderAddressOptions();
}

function selectAddressValue(value, code = "") {
  const step = state.addressDraft.step;
  if (step === "province") {
    state.addressDraft.province = value;
    state.addressDraft.provinceCode = code;
    state.addressDraft.city = "";
    state.addressDraft.cityCode = "";
    state.addressDraft.district = "";
    state.addressDraft.districtCode = "";
    state.addressDraft.postal = "";
    setAddressStep("city");
  } else if (step === "city") {
    state.addressDraft.city = value;
    state.addressDraft.cityCode = code;
    state.addressDraft.district = "";
    state.addressDraft.districtCode = "";
    state.addressDraft.postal = "";
    setAddressStep("district");
  } else if (step === "district") {
    state.addressDraft.district = value;
    state.addressDraft.districtCode = code;
    state.addressDraft.postal = "";
    setAddressStep("postal");
  } else {
    state.addressDraft.postal = value;
    renderAddressOptions();
  }
  updateAddressSearch();
}

async function renderAddressOptions() {
  if (!els.addressOptions) return;
  const step = state.addressDraft.step;
  const currentValue = state.addressDraft[step];
  document.querySelectorAll("[data-address-tab]").forEach((button) => {
    const tab = button.dataset.addressTab;
    button.classList.toggle("active", tab === step);
    button.disabled =
      (tab === "city" && !state.addressDraft.provinceCode) ||
      (tab === "district" && !state.addressDraft.cityCode) ||
      (tab === "postal" && !state.addressDraft.districtCode);
  });

  els.addressOptions.innerHTML = `<div class="address-empty">Memuat ${addressStepLabels[step]}...</div>`;

  try {
    const rows = await availableAddressRows(step);
    if (!rows.length) {
      if (step === "postal") {
        renderPostalManual(els.addressOptions, state.addressDraft.postal);
      } else {
        els.addressOptions.innerHTML = `<div class="address-empty">Pilih ${addressStepLabels[step]} sebelumnya.</div>`;
      }
      return;
    }

    els.addressOptions.innerHTML = rows
      .map((item) => `
        <button class="address-option ${item.name === currentValue ? "selected" : ""}" type="button" data-address-value="${escapeHtml(item.name)}" data-address-code="${escapeHtml(item.code)}">
          ${escapeHtml(item.name)}
        </button>
      `)
      .join("");
  } catch (error) {
    if (step === "postal") {
      renderPostalManual(els.addressOptions, state.addressDraft.postal);
      return;
    }
    els.addressOptions.innerHTML = `<div class="address-empty">Data wilayah belum tersedia pada pilihan ini.</div>`;
  }
}

function resetAddressDraft() {
  state.addressDraft = {
    step: "province",
    province: "",
    provinceCode: "",
    city: "",
    cityCode: "",
    district: "",
    districtCode: "",
    postal: "",
    tag: "Rumah"
  };
  if (els.addressName) els.addressName.value = "";
  if (els.addressPhone) els.addressPhone.value = "";
  if (els.addressStreet) els.addressStreet.value = "";
  updateAddressSearch();
}

function openAddressModal() {
  if (!els.addressModal) return;
  const saved = state.address;
  if (saved) {
    els.addressName.value = saved.name || "";
    els.addressPhone.value = saved.phone || "";
    els.addressStreet.value = saved.street || "";
    state.addressDraft.province = saved.province || "";
    state.addressDraft.provinceCode = saved.provinceCode || "";
    state.addressDraft.city = saved.city || "";
    state.addressDraft.cityCode = saved.cityCode || "";
    state.addressDraft.district = saved.district || "";
    state.addressDraft.districtCode = saved.districtCode || "";
    state.addressDraft.postal = saved.postal || "";
    state.addressDraft.tag = saved.tag || "Rumah";
  } else {
    resetAddressDraft();
  }
  document.querySelectorAll("[data-address-tag]").forEach((button) => {
    button.classList.toggle("active", button.dataset.addressTag === state.addressDraft.tag);
  });
  updateAddressSearch();
  setAddressStep(state.addressDraft.province ? "city" : "province");
  els.addressModal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => els.addressName?.focus(), 0);
}

function closeAddressModal() {
  if (!els.addressModal) return;
  els.addressModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function buyerAddressText(address = state.address) {
  if (!address) return "";
  return [
    address.name && address.phone ? `${address.name} · ${address.phone}` : address.name || address.phone,
    address.street,
    [address.district, address.city, address.province, address.postal].filter(Boolean).join(", "),
    address.tag ? `Label: ${address.tag}` : ""
  ].filter(Boolean).join("\n");
}

function renderAddressPreview() {
  if (!els.addressPreview) return;
  const address = state.address;
  if (!address) {
    els.addressPreview.classList.add("empty");
    els.addressPreview.innerHTML = "Belum ada alamat. Klik Alamat Baru untuk mengisi alamat pembeli.";
    return;
  }
  els.addressPreview.classList.remove("empty");
  els.addressPreview.innerHTML = `
    <strong>${escapeHtml(address.name)} · ${escapeHtml(address.phone)}</strong>
    <span>${escapeHtml(address.street)}</span>
    <span>${escapeHtml(address.district)}, ${escapeHtml(address.city)}, ${escapeHtml(address.province)} ${escapeHtml(address.postal)}</span>
    <small>${escapeHtml(address.tag)}</small>
    <div class="address-card-actions">
      <button type="button" data-view-buyer-address>Lihat</button>
      <button type="button" data-edit-buyer-address>Edit</button>
      <button class="danger" type="button" data-delete-buyer-address>Hapus</button>
    </div>
  `;
}

function closeBuyerAddressPopup() {
  const popup = document.querySelector("#buyerAddressDetailPopup");
  if (!popup) return;
  popup.hidden = true;
  document.body.classList.remove("modal-open");
}

function viewBuyerAddress() {
  if (!state.address) return;
  let popup = document.querySelector("#buyerAddressDetailPopup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "buyerAddressDetailPopup";
    popup.className = "address-detail-backdrop";
    popup.hidden = true;
    popup.innerHTML = `
      <div class="address-detail-popup" role="dialog" aria-modal="true" aria-labelledby="buyerAddressDetailTitle">
        <button class="address-detail-close" type="button" data-close-buyer-address-popup aria-label="Tutup detail alamat">&times;</button>
        <h2 id="buyerAddressDetailTitle">Detail Alamat Pembeli</h2>
        <div class="address-detail-content" data-buyer-address-detail></div>
        <div class="address-detail-actions">
          <button class="secondary-button" type="button" data-popup-edit-buyer-address>Edit</button>
          <button class="danger-button" type="button" data-popup-delete-buyer-address>Hapus</button>
        </div>
      </div>`;
    document.body.appendChild(popup);
  }
  const content = popup.querySelector("[data-buyer-address-detail]");
  content.innerHTML = buyerAddressText(state.address).split("\n").filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  popup.hidden = false;
  document.body.classList.add("modal-open");
}

function deleteBuyerAddress() {
  if (!state.address) return;
  if (!window.confirm("Hapus alamat pembeli ini?")) return;
  state.address = null;
  localStorage.removeItem(ADDRESS_KEY);
  resetAddressDraft();
  renderAddressPreview();
  renderOrder();
  notify("Alamat pembeli dihapus.");
}

function saveAddressFromModal() {
  const payload = {
    name: els.addressName.value.trim(),
    phone: els.addressPhone.value.trim(),
    street: els.addressStreet.value.trim(),
    province: state.addressDraft.province,
    provinceCode: state.addressDraft.provinceCode,
    city: state.addressDraft.city,
    cityCode: state.addressDraft.cityCode,
    district: state.addressDraft.district,
    districtCode: state.addressDraft.districtCode,
    postal: state.addressDraft.postal,
    tag: state.addressDraft.tag || "Rumah"
  };

  const required = [payload.name, payload.phone, payload.street, payload.province, payload.city, payload.district, payload.postal];
  if (required.some((value) => !value)) {
    notify("Lengkapi nama, nomor telepon, alamat, provinsi, kota, kecamatan, dan kode pos.");
    return;
  }

  state.address = payload;
  write(ADDRESS_KEY, payload);
  renderAddressPreview();
  closeAddressModal();
  renderOrder();
  notify("Alamat pembeli tersimpan.");
}

function renderShippingControl(order) {
  if (!els.shippingSelect) return;
  if (!state.address) {
    els.shippingSelect.innerHTML = `<option value="">Isi Alamat</option>`;
    els.shippingSelect.disabled = true;
    if (els.shippingNotice) {
      els.shippingNotice.hidden = false;
      els.shippingNotice.textContent = "Isi Alamat";
    }
    return;
  }

  els.shippingSelect.disabled = false;
  if (els.shippingNotice) els.shippingNotice.hidden = true;
  els.shippingSelect.innerHTML = state.shippingOptions
    .map((item) => `<option value="${escapeHtml(item.name)}|${Number(item.price || 0)}">${escapeHtml(item.name)} - ${rupiah.format(Number(item.price || 0))}</option>`)
    .join("");
  const matchedShipping = state.shippingOptions.find((item) => item.name === order.shippingName) || state.shippingOptions[0];
  if (matchedShipping) els.shippingSelect.value = `${matchedShipping.name}|${Number(matchedShipping.price || 0)}`;
}

function renderPaymentControl(order) {
  if (!els.paymentSelect) return;
  els.paymentSelect.innerHTML = state.paymentMethods
    .map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`)
    .join("");
  const matchedPayment = state.paymentMethods.find((item) => item.name === order.payment) || state.paymentMethods[0];
  if (matchedPayment) els.paymentSelect.value = matchedPayment.name;
}

function renderControls(order) {
  renderShippingControl(order);
  renderPaymentControl(order);
}

function renderPaymentInfo() {
  const method = getPaymentMethod(els.paymentSelect?.value || "");
  const paymentNumber = method ? `${method.type}: ${method.account}` : "-";
  const isCod = String(method?.name || "").toLowerCase() === "cod";
  if (els.paymentGuide) {
    els.paymentGuide.innerHTML = method?.note ? `<span>${escapeHtml(method.note)}</span>` : "";
  }
  if (els.paymentNumberBox) {
    els.paymentNumberBox.innerHTML = method
      ? `
        <span>Nomor Rekening</span>
        <strong>${escapeHtml(paymentNumber)}</strong>
        <span>Atas nama</span>
        <strong>${escapeHtml(method.holder || "-")}</strong>
        ${method.note ? `<small>${escapeHtml(method.note)}</small>` : ""}
        ${isCod ? `<small>Pembayaran COD dilakukan saat paket diterima.</small>` : ""}
      `
      : `
        <span>Nomor Rekening</span>
        <strong>-</strong>
        <span>Atas nama</span>
        <strong>-</strong>
      `;
  }
}

function renderOrder() {
  const { order, orderId } = findOrder();
  if (!order) {
    if (!els.page) return;
    els.page.innerHTML = `
      <div class="payment-empty-state">
        <h1>Pesanan tidak ditemukan</h1>
        <p>Nomor pesanan ${escapeHtml(orderId || "-")} tidak tersedia di perangkat ini.</p>
        <a class="store-return-link" href="index.html">Kembali ke Toko</a>
      </div>
    `;
    return;
  }

  const item = order.items?.[0] || {};
  const productTotal = Number(order.productTotal || (Number(item.price || 0) * Number(item.qty || 1)));
  renderShippingControl(order);
  const shipping = getSelectedShipping();
  const shippingCost = state.address ? Number(shipping.cost || order.shippingCost || 0) : 0;
  const total = productTotal + shippingCost;

  if (els.status) els.status.textContent = order.status || "Menunggu rincian pembelian";
  if (els.productRow) els.productRow.innerHTML = `
    <img src="${escapeHtml(productImageFor(order))}" alt="${escapeHtml(item.title || "Produk")}" />
    <div>
      <strong>${escapeHtml(item.title || "Produk")}</strong>
      <span>Varian: ${escapeHtml(item.variant || "Default")}</span>
      <span>${Number(item.qty || 1)} x ${rupiah.format(Number(item.price || 0))}</span>
    </div>
  `;
  if (els.productTotal) els.productTotal.textContent = rupiah.format(productTotal);
  if (els.shippingTotal) els.shippingTotal.textContent = state.address ? `${escapeHtml(shipping.name || "Pilih ekspedisi")} · ${rupiah.format(shippingCost)}` : "Isi Alamat";
  if (els.grandTotal) els.grandTotal.textContent = rupiah.format(total);
  renderPaymentInfo();
}

function saveOrderBeforeConfirm(status) {
  const data = findOrder();
  const order = data.order;
  if (!order) return null;
  const item = order.items?.[0] || {};
  const productTotal = Number(order.productTotal || (Number(item.price || 0) * Number(item.qty || 1)));
  const shipping = getSelectedShipping();
  const method = getPaymentMethod(els.paymentSelect?.value || "");
  const address = state.address;
  const addressText = address
    ? [address.street, address.district, address.city, address.province, address.postal].filter(Boolean).join(", ")
    : "";
  const index = data.orders.findIndex((entry) => entry.id === order.id);
  if (index < 0) return null;
  const updated = {
    ...data.orders[index],
    name: address?.name || "",
    phone: address?.phone || "",
    address: addressText,
    addressDetail: address || null,
    shippingName: address ? shipping.name : "",
    shippingCost: address ? Number(shipping.cost || 0) : 0,
    payment: method?.name || "",
    paymentDetail: method ? `${method.type}: ${method.account}` : "",
    paymentType: method?.type || "",
    paymentAccount: method?.account || "",
    paymentHolder: method?.holder || "",
    paymentNote: method?.note || "",
    productTotal,
    total: productTotal + Number(shipping.cost || 0),
    status
  };
  data.orders[index] = updated;
  write(ORDERS_KEY, data.orders);
  return updated;
}

function setupConfirmButton() {
  const { order } = findOrder();
  if (!order) return;
  els.confirm.onclick = () => {
    if (!state.address) {
      notify("Isi alamat pengiriman terlebih dahulu.");
      openAddressModal();
      return;
    }
    const method = getPaymentMethod(els.paymentSelect?.value || "");
    if (!method) {
      notify("Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    const isCod = String(method.name || "").toLowerCase() === "cod";
    const proofName = els.proof.files?.[0]?.name || "";
    if (!isCod && !proofName) {
      notify("Upload bukti pembayaran terlebih dahulu.");
      return;
    }
    const updated = saveOrderBeforeConfirm(isCod ? "Pesanan COD dikonfirmasi" : "Menunggu verifikasi pembayaran");
    if (updated) {
      const data = findOrder();
      const index = data.orders.findIndex((entry) => entry.id === updated.id);
      if (index >= 0) {
        data.orders[index] = {
          ...data.orders[index],
          proofFileName: proofName,
          paidAt: new Date().toISOString()
        };
        write(ORDERS_KEY, data.orders);
      }
      els.status.textContent = updated.status;
    }
    els.result.hidden = false;
    els.result.textContent = isCod
      ? "Pesanan COD berhasil dikonfirmasi. Seller akan memproses pesanan."
      : "Bukti pembayaran berhasil dikirim. Seller akan memverifikasi pembayaran.";
    notify("Konfirmasi pembayaran tersimpan.");
  };

  els.help.onclick = () => {
    const shipping = getSelectedShipping();
    const method = getPaymentMethod(els.paymentSelect?.value || "");
    const item = order.items?.[0] || {};
    const productTotal = Number(order.productTotal || (Number(item.price || 0) * Number(item.qty || 1)));
    const total = productTotal + Number(shipping.cost || 0);
    window.alert(`Bantuan Pembayaran\n\nNomor Pesanan: ${order.id}\nTotal: ${rupiah.format(total)}\nMetode: ${method?.name || "-"}\n\nHubungi seller jika pembayaran belum terverifikasi.`);
  };
}

function init() {
  applyTheme(localStorage.getItem(THEME_KEY));
  const { order } = findOrder();
  if (order) renderControls(order);
  renderAddressPreview();
  renderOrder();
  setupConfirmButton();
}

els.searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const search = encodeURIComponent(els.searchInput.value.trim());
  window.location.href = search ? `index.html?q=${search}#produk` : "index.html#produk";
});

els.shippingSelect?.addEventListener("change", () => {
  saveOrderBeforeConfirm("Menunggu pembayaran");
  renderOrder();
});
els.paymentSelect?.addEventListener("change", () => {
  saveOrderBeforeConfirm("Menunggu pembayaran");
  renderOrder();
});
els.addressOpen?.addEventListener("click", openAddressModal);
els.addressClose?.addEventListener("click", closeAddressModal);
els.addressModal?.addEventListener("click", (event) => {
  if (event.target === els.addressModal) closeAddressModal();
});
els.addressOk?.addEventListener("click", saveAddressFromModal);
els.addressOptions?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-address-value]");
  if (!option) return;
  selectAddressValue(option.dataset.addressValue, option.dataset.addressCode || "");
});
els.addressOptions?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-address-postal-manual]");
  if (!input) return;
  input.value = input.value.replace(/\D/g, "").slice(0, 5);
  state.addressDraft.postal = input.value;
  updateAddressSearch();
});
document.querySelectorAll("[data-address-tab]").forEach((button) => {
  button.addEventListener("click", () => setAddressStep(button.dataset.addressTab));
});
document.querySelectorAll("[data-address-tag]").forEach((button) => {
  button.addEventListener("click", () => {
    state.addressDraft.tag = button.dataset.addressTag || "Rumah";
    document.querySelectorAll("[data-address-tag]").forEach((item) => item.classList.toggle("active", item === button));
  });
});

document.addEventListener("click", (event) => {
  const viewBuyerAddressButton = event.target.closest("[data-view-buyer-address]");
  const editBuyerAddressButton = event.target.closest("[data-edit-buyer-address]");
  const deleteBuyerAddressButton = event.target.closest("[data-delete-buyer-address]");
  const closeBuyerPopupButton = event.target.closest("[data-close-buyer-address-popup]");
  const popupEditBuyerAddress = event.target.closest("[data-popup-edit-buyer-address]");
  const popupDeleteBuyerAddress = event.target.closest("[data-popup-delete-buyer-address]");
  const buyerAddressPopup = document.querySelector("#buyerAddressDetailPopup");

  if (viewBuyerAddressButton) viewBuyerAddress();
  if (editBuyerAddressButton) openAddressModal();
  if (deleteBuyerAddressButton) deleteBuyerAddress();
  if (closeBuyerPopupButton || event.target === buyerAddressPopup) closeBuyerAddressPopup();
  if (popupEditBuyerAddress) { closeBuyerAddressPopup(); openAddressModal(); }
  if (popupDeleteBuyerAddress) { closeBuyerAddressPopup(); deleteBuyerAddress(); }
});

try {
  init();
} catch (error) {
  console.error("Halaman rincian pembelian gagal dimuat:", error);
  if (els.page) {
    els.page.innerHTML = `<div class="payment-empty-state"><h1>Rincian Pembelian Produk gagal dimuat</h1><p>Silakan kembali ke produk lalu klik Beli Sekarang lagi.</p><a class="primary-button" href="product.html">Kembali ke Produk</a></div>`;
  }
}

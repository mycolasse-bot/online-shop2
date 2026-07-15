const DATA = window.StoreData || { products: [], productPhotos: { dress: ["assets/photos/dress-1.jpg"] }, shippingOptions: [], paymentMethods: [], categories: [] };
const PRODUCTS_KEY = "fashion_products_v4";
const CART_KEY = "fashion_cart_v3";
const ORDERS_KEY = "fashion_orders_v3";
const THEME_KEY = "fashion_theme";
const SHIPPING_KEY = "fashion_shipping_v1";
const PAYMENT_KEY = "fashion_payments_v1";
const ADDRESS_KEY = "fashion_buyer_address_v1";
const STORE_KEY = "fashion_store_profile_v1";
const MAX_PRODUCT_SLIDES = 5;
const DEFAULT_STORE_PROFILE = { name: "Online Shop", phone: "", street: "", province: "", provinceCode: "", city: "", cityCode: "", district: "", districtCode: "", postal: "" };

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const els = {
  buyForm: document.querySelector("#buyForm"),
  cartClose: document.querySelector("#cartClose"),
  cartCount: document.querySelector("#cartCount"),
  cartDrawer: document.querySelector("#cartDrawer"),
  cartItems: document.querySelector("#cartItems"),
  cartOpen: document.querySelector("#cartOpen"),
  cartSubtotal: document.querySelector("#cartSubtotal"),
  checkoutJump: document.querySelector("#checkoutJump"),
  detailSearchForm: document.querySelector("#detailSearchForm"),
  detailSearchInput: document.querySelector("#detailSearchInput"),
  paymentGuide: document.querySelector("#paymentGuide"),
  paymentNumber: document.querySelector("#paymentNumber"),
  paymentResult: document.querySelector("#paymentResult"),
  paymentSelect: document.querySelector("#paymentSelect"),
  productDetail: document.querySelector("#productDetail"),
  shippingSelect: document.querySelector("#shippingSelect"),
  toast: document.querySelector("#toast"),
  addressModal: document.querySelector("#addressModal"),
  addressOpen: document.querySelector("#addressOpen"),
  addressClose: document.querySelector("#addressClose"),
  addressLater: document.querySelector("#addressLater"),
  addressOk: document.querySelector("#addressOk"),
  addressName: document.querySelector("#addressName"),
  addressPhone: document.querySelector("#addressPhone"),
  addressSearch: document.querySelector("#addressSearch"),
  addressStreet: document.querySelector("#addressStreet"),
  addressOptions: document.querySelector("#addressOptions"),
  addressPreview: document.querySelector("#addressPreview"),
  buyerNameField: document.querySelector("#buyerNameField"),
  buyerPhoneField: document.querySelector("#buyerPhoneField"),
  buyerStreetField: document.querySelector("#buyerStreetField"),
  buyerDistrictField: document.querySelector("#buyerDistrictField"),
  buyerCityField: document.querySelector("#buyerCityField"),
  buyerProvinceField: document.querySelector("#buyerProvinceField"),
  buyerPostalField: document.querySelector("#buyerPostalField"),
  buyerAddressTagField: document.querySelector("#buyerAddressTagField")
};

const params = new URLSearchParams(window.location.search);
const state = {
  products: loadProducts(),
  cart: read(CART_KEY, []),
  orders: read(ORDERS_KEY, []),
  shippingOptions: read(SHIPPING_KEY, DATA.shippingOptions),
  paymentMethods: read(PAYMENT_KEY, DATA.paymentMethods),
  storeProfile: read(STORE_KEY, DEFAULT_STORE_PROFILE),
  activeId: params.get("id") || "dress",
  activePhoto: 0,
  qty: 1,
  variant: "",
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

function applyTheme(theme) {
  const themes = ["red", "orange", "blue", "teal", "green", "blue-grey"];
  const safeTheme = themes.includes(theme) ? theme : "red";
  document.body.dataset.theme = safeTheme;
  localStorage.setItem(THEME_KEY, safeTheme);
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeChoice === safeTheme);
  });
}

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
    const chars = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return chars[char];
  });
}

function storeCityLabel() {
  const profile = { ...DEFAULT_STORE_PROFILE, ...state.storeProfile };
  return (profile.city || profile.province || "Kota Toko").trim();
}

function productPhotoKey(product) {
  const safeProduct = product && typeof product === "object" ? product : {};
  const text = `${safeProduct.id || ""} ${safeProduct.category || ""} ${safeProduct.title || ""}`.toLowerCase();
  if (text.includes("blouse")) return "blouse";
  if (text.includes("outer") || text.includes("linen")) return "outer";
  if (text.includes("tas") || text.includes("bag")) return "bag";
  if (text.includes("rok") || text.includes("skirt")) return "skirt";
  if (text.includes("sepatu") || text.includes("heels")) return "heels";
  return "dress";
}

function normalizeProductVariants(product) {
  const rawVariants = Array.isArray(product?.variants) ? product.variants : [];
  return rawVariants
    .map((variant) => ({
      name: String(variant?.name || "").trim(),
      price: Number(variant?.price)
    }))
    .filter((variant) => variant.name && Number.isFinite(variant.price) && variant.price >= 0);
}

function hydrateProduct(product) {
  if (!product || typeof product !== "object") return null;
  const key = productPhotoKey(product);
  const defaultPhotos = DATA.productPhotos?.[key] || DATA.productPhotos?.dress || ["assets/photos/dress-1.jpg"];
  const sourcePhotos = Array.isArray(product.photos) && product.photos.length ? product.photos : defaultPhotos;
  const photos = sourcePhotos.slice(0, MAX_PRODUCT_SLIDES).filter(Boolean);
  return {
    ...product,
    photos: photos.length ? photos : ["assets/photos/dress-1.jpg"],
    image: product.image || photos[0] || "assets/photos/dress-1.jpg",
    sold: product.sold ?? 0,
    stock: product.stock ?? 25,
    rating: product.rating ?? 4.8,
    material: product.material || "Bahan nyaman untuk pemakaian harian",
    color: product.color || "Warna sesuai foto",
    weight: product.weight || "500 gram",
    detail: product.detail || product.description,
    variants: normalizeProductVariants(product)
  };
}

function loadProducts() {
  const defaults = Array.isArray(DATA.products) ? DATA.products : [];
  const savedProducts = read(PRODUCTS_KEY, defaults);
  const sourceProducts = Array.isArray(savedProducts) && savedProducts.length ? savedProducts : defaults;
  const products = sourceProducts
    .filter((product) => product && typeof product === "object")
    .map((product) => {
      try { return hydrateProduct(product); } catch (error) { console.warn("Produk dilewati karena data rusak:", error); return null; }
    })
    .filter(Boolean);
  return products.length ? products : defaults.map((product) => hydrateProduct(product)).filter(Boolean);
}

function autoProductVariants(product) {
  const baseVariant = product.color || "Default";
  const sizeVariants = ["S", "M", "L", "XL"];
  const shoeVariants = ["36", "37", "38", "39", "40"];

  if (product.id === "heels") return shoeVariants.map((size) => `${baseVariant} - Size ${size}`);
  if (product.category === "Fashion") return sizeVariants.map((size) => `${baseVariant} - Size ${size}`);
  return [baseVariant];
}

function productVariants(product) {
  const manualVariants = normalizeProductVariants(product);
  if (manualVariants.length) return manualVariants.map((variant) => variant.name);
  return autoProductVariants(product);
}

function variantBasePrice(product, variantName = "") {
  const manualVariants = normalizeProductVariants(product);
  if (manualVariants.length) {
    const selected = manualVariants.find((variant) => variant.name === variantName);
    if (selected) return selected.price;
    return manualVariants[0].price;
  }

  const variants = autoProductVariants(product);
  const index = Math.max(0, variants.indexOf(variantName));
  const category = String(product.category || "").toLowerCase();
  const id = String(product.id || "").toLowerCase();

  if (id === "heels") return product.price + index * 15000;
  if (category === "fashion") return product.price + index * 10000;
  return product.price + index * 5000;
}

function finalPrice(product, variantName = state.variant) {
  const basePrice = variantBasePrice(product, variantName);
  return Math.round(basePrice - basePrice * (Number(product.discount || 0) / 100));
}

function productVariantOptions(product) {
  if (!product || typeof product !== "object") return [];
  const safePhotos = Array.isArray(product.photos) && product.photos.length ? product.photos : [product.image || "assets/photos/dress-1.jpg"];
  const manualVariants = normalizeProductVariants(product);
  if (manualVariants.length) {
    return manualVariants.map((variant, index) => ({
      name: variant.name,
      image: safePhotos[index % safePhotos.length] || product.image || "assets/photos/dress-1.jpg",
      price: variant.price,
      finalPrice: finalPrice(product, variant.name)
    }));
  }

  const variants = autoProductVariants(product);
  return variants.map((variant, index) => ({
    name: variant,
    image: safePhotos[index % safePhotos.length] || product.image || "assets/photos/dress-1.jpg",
    price: variantBasePrice(product, variant),
    finalPrice: finalPrice(product, variant)
  }));
}

function selectedVariantOption(product, variantName = state.variant) {
  const options = productVariantOptions(product);
  return options.find((variant) => variant.name === variantName) || options[0];
}

function compactNumber(value) {
  const number = Number(value) || 0;
  if (number >= 1000) {
    const short = number / 1000;
    return `${short % 1 === 0 ? short.toFixed(0) : short.toFixed(1)}RB+`;
  }
  return String(number);
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return Array.from({ length: 5 }, (_, index) => `<span class="star ${index < safeRating ? "filled" : ""}">★</span>`).join("");
}

function currentProduct() {
  return state.products.find((product) => product.id === state.activeId) || state.products[0];
}

function notify(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function renderSelectOptions() {
  if (els.shippingSelect) {
    els.shippingSelect.innerHTML = state.shippingOptions
      .map((item) => `<option value="${escapeHtml(item.name)}|${item.price}">${escapeHtml(item.name)} - ${rupiah.format(item.price)}</option>`)
      .join("");
  }
  if (els.paymentSelect) {
    els.paymentSelect.innerHTML = state.paymentMethods
      .map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`)
      .join("");
  }
  renderPaymentGuide();
}

function getPaymentMethod(name) {
  return state.paymentMethods.find((item) => item.name === name);
}

function renderPaymentGuide() {
  if (!els.paymentSelect) return;
  const method = getPaymentMethod(els.paymentSelect.value);
  if (els.paymentNumber) {
    els.paymentNumber.value = method ? `${method.type}: ${method.account}` : "";
  }
  if (!els.paymentGuide) return;
  if (!method) {
    els.paymentGuide.innerHTML = "";
    return;
  }
  const note = method.note ? `<span>${escapeHtml(method.note)}</span>` : "";
  els.paymentGuide.innerHTML = `
    <span>Atas Nama: ${escapeHtml(method.holder)}</span>
    ${note}
  `;
}

function renderProduct() {
  const product = currentProduct();
  if (!product) {
    els.productDetail.innerHTML = `<p>Produk tidak ditemukan. Silakan kembali ke halaman utama.</p>`;
    return;
  }

  const hasDiscount = Number(product.discount) > 0;
  const productPhotos = Array.isArray(product.photos) && product.photos.length ? product.photos : [product.image || "assets/photos/dress-1.jpg"];
  if (state.activePhoto >= productPhotos.length) state.activePhoto = 0;
  const activePhoto = productPhotos[state.activePhoto] || product.image || "assets/photos/dress-1.jpg";
  const variants = productVariantOptions(product);
  const selectedVariant = state.variant || variants[0]?.name || product.color || "Default";
  state.variant = selectedVariant;
  const selectedOption = selectedVariantOption(product, selectedVariant);
  const activeBasePrice = selectedOption?.price || product.price;
  const activeFinalPrice = selectedOption?.finalPrice || finalPrice(product, selectedVariant);
  const discountText = hasDiscount ? `-${product.discount}%` : "Harga spesial";
  const ratingCount = Math.max(120, Number(product.sold || 0) * 27);

  els.productDetail.innerHTML = `
    <div class="detail-gallery shopee-gallery">
      <div class="detail-stage">
        <img class="detail-main-img" src="${activePhoto}" alt="${escapeHtml(product.title)} foto ${state.activePhoto + 1}" />
        <span class="gallery-count">${state.activePhoto + 1}/${productPhotos.length}</span>
      </div>
      <div class="thumb-grid" aria-label="Foto produk">
        ${productPhotos
          .map(
            (photo, index) => `
              <button class="thumb-button ${index === state.activePhoto ? "active" : ""}" type="button" data-photo="${index}" aria-label="Foto ${index + 1}">
                <img src="${photo}" alt="${escapeHtml(product.title)} foto ${index + 1}" />
              </button>
            `
          )
          .join("")}
      </div>
      <div class="product-social-row">
        <div class="share-area">
          <span>Share:</span>
          <button type="button" aria-label="Bagikan ke chat">●</button>
          <button type="button" aria-label="Bagikan ke Facebook">f</button>
          <button type="button" aria-label="Bagikan ke Pinterest">p</button>
          <button type="button" aria-label="Salin link">×</button>
        </div>
        <div class="favorite-area"><span>♡</span> Favorit (${compactNumber(product.sold * 9 || 1100)})</div>
      </div>
    </div>

    <div class="detail-info marketplace-product-info">
      <div class="product-title-row">
        <h1><span class="mall-label">Mall</span>${escapeHtml(product.title)}</h1>
      </div>

      <div class="rating-line product-stat-row">
        <span class="stat-rating"><b>${product.rating}</b> <span class="star-group">${renderStars(product.rating)}</span></span>
        <span><b>${compactNumber(ratingCount)}</b> Penilaian</span>
        <span><b>${compactNumber(product.sold)}+</b> Terjual</span>
      </div>

      <div class="detail-price shopee-price-box">
        <strong>${rupiah.format(activeFinalPrice)}</strong>
        ${hasDiscount ? `<span class="old-price">${rupiah.format(activeBasePrice)}</span><span class="sale-text">${discountText}</span>` : `<span class="sale-text">Harga terbaik</span>`}
      </div>

      <div class="market-product-rows">
        <div class="product-info-row">
          <span class="row-label">Paket Diskon</span>
          <button class="discount-pill" type="button">Pilih ${hasDiscount ? `diskon ${product.discount}%` : "promo toko"}</button>
        </div>

        <div class="product-info-row shipping-row">
          <span class="row-label">Dikirim dari</span>
          <div class="row-content">
            <strong>${escapeHtml(storeCityLabel())}</strong>
          </div>
        </div>

        <div class="product-info-row variant-info-row">
          <span class="row-label">Varian produk</span>
          <div class="variant-pill-grid" role="group" aria-label="Varian produk">
            ${variants
              .map(
                (variant) => `
                  <button class="variant-pill ${variant.name === selectedVariant ? "active" : ""}" type="button" data-variant="${escapeHtml(variant.name)}">
                    <img src="${variant.image}" alt="" aria-hidden="true" />
                    <span>${escapeHtml(variant.name)}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>

        <div class="product-info-row quantity-info-row">
          <span class="row-label">Kuantitas</span>
          <div class="qty-with-stock">
            <div class="qty-control">
              <button type="button" data-qty="minus">-</button>
              <input id="qtyInput" value="${state.qty}" inputmode="numeric" aria-label="Jumlah produk" />
              <button type="button" data-qty="plus">+</button>
            </div>
            <span class="stock-label">TERSEDIA</span>
          </div>
        </div>
      </div>

      <div class="auto-total">
        <span>Total produk sebelum ongkir:</span>
        <strong id="productSubtotal">${rupiah.format(activeFinalPrice * state.qty)}</strong>
      </div>

      <div class="detail-actions shopee-action-row">
        <button class="secondary-button cart-action-button shopee-cart-button" type="button" data-add-cart>
          <svg class="button-cart-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 4h2l1.7 8.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 7H6"></path>
            <circle cx="9" cy="19" r="1.2"></circle>
            <circle cx="17" cy="19" r="1.2"></circle>
          </svg>
          Masukkan Keranjang
        </button>
        <button class="primary-button shopee-buy-button" type="button" data-buy-now>Beli Sekarang</button>
      </div>
    </div>

    <div class="product-extra-panel">
      <h2>Deskripsi Produk</h2>
      <p>${escapeHtml(product.description)}</p>
      <p>${escapeHtml(product.detail)}</p>
      <div class="detail-specs">
        <div><span>Kategori</span><br />${escapeHtml(product.category)}</div>
        <div><span>Bahan</span><br />${escapeHtml(product.material)}</div>
        <div><span>Warna</span><br />${escapeHtml(product.color)}</div>
        <div><span>Berat</span><br />${escapeHtml(product.weight)}</div>
      </div>
    </div>
  `;
}

function renderCart() {
  const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = state.cart.reduce((sum, item) => {
    const product = state.products.find((entry) => entry.id === item.id);
    return product ? sum + finalPrice(product, item.variant || productVariants(product)[0]) * item.qty : sum;
  }, 0);

  els.cartCount.textContent = totalQty;
  els.cartSubtotal.textContent = rupiah.format(subtotal);
  els.cartItems.innerHTML = state.cart.length
    ? state.cart
        .map((item, index) => {
          const product = state.products.find((entry) => entry.id === item.id);
          if (!product) return "";
          return `
            <div class="cart-row">
              <div class="cart-row-head">
                <strong>${escapeHtml(product.title)}</strong>
                <span>${rupiah.format(finalPrice(product, item.variant || productVariants(product)[0]) * item.qty)}</span>
              </div>
              <div class="item-actions">
                <span>${item.qty} x ${rupiah.format(finalPrice(product, item.variant || productVariants(product)[0]))}</span>
                <span>
                  <button type="button" data-minus-cart="${index}">-</button>
                  <button type="button" data-plus-cart="${index}">+</button>
                  <button type="button" data-remove-cart="${index}">Hapus</button>
                </span>
              </div>
              ${item.variant ? `<small class="cart-variant">Varian: ${escapeHtml(item.variant)}</small>` : ""}
            </div>
          `;
        })
        .join("")
    : `<p>Keranjang masih kosong.</p>`;
}

function addToCart(id, qty = 1) {
  const selectedVariant = state.variant || productVariants(currentProduct())[0];
  const item = state.cart.find((entry) => entry.id === id && (entry.variant || "") === selectedVariant);
  if (item) {
    item.qty += qty;
  } else {
    state.cart.push({ id, qty, variant: selectedVariant });
  }
  write(CART_KEY, state.cart);
  renderCart();
  notify("Produk masuk ke keranjang.");
}

function updateCart(index, action) {
  const item = state.cart[index];
  if (!item) return;
  if (action === "plus") item.qty += 1;
  if (action === "minus") item.qty -= 1;
  if (action === "remove" || item.qty <= 0) {
    state.cart.splice(index, 1);
  }
  write(CART_KEY, state.cart);
  renderCart();
}

function paymentText(order) {
  const method = getPaymentMethod(order.payment);
  if (order.payment === "COD") {
    return `Pesanan dibuat. Pembayaran COD dilakukan saat paket diterima. Total: ${rupiah.format(order.total)}.`;
  }
  const detail = method ? ` ${method.type}: ${method.account}.` : "";
  return `Pesanan dibuat. Silakan bayar ${rupiah.format(order.total)} via ${order.payment}.${detail} Kode pembayaran: ${order.id}.`;
}

function openDrawer(drawer) {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer(drawer) {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

if (els.productDetail) {
  els.productDetail.addEventListener("click", (event) => {
    const photoButton = event.target.closest("[data-photo]");
    const slideButton = event.target.closest("[data-slide]");
    const qtyButton = event.target.closest("[data-qty]");
    const variantButton = event.target.closest("[data-variant]");
    const addButton = event.target.closest("[data-add-cart]");
    const buyNowButton = event.target.closest("[data-buy-now]");

    if (photoButton) {
      state.activePhoto = Number(photoButton.dataset.photo);
      renderProduct();
      return;
    }

    if (slideButton) {
      const total = currentProduct().photos.length;
      state.activePhoto = slideButton.dataset.slide === "next"
        ? (state.activePhoto + 1) % total
        : (state.activePhoto - 1 + total) % total;
      renderProduct();
      return;
    }

    if (qtyButton) {
      state.qty = qtyButton.dataset.qty === "plus" ? state.qty + 1 : Math.max(1, state.qty - 1);
      renderProduct();
      return;
    }

    if (variantButton) {
      state.variant = variantButton.dataset.variant;
      renderProduct();
      return;
    }

    if (addButton) {
      addToCart(currentProduct().id, state.qty);
      return;
    }

    if (buyNowButton) {
      createCurrentProductOrder();
    }
  });
}

els.productDetail?.addEventListener("input", (event) => {
  if (event.target.id === "qtyInput") {
    state.qty = Math.max(1, Number(event.target.value.replace(/\D/g, "")) || 1);
    updateProductSubtotal();
  }
});

els.productDetail?.addEventListener("change", (event) => {
  if (event.target.id !== "variantSelect") return;
  state.variant = event.target.value;
});

function updateProductSubtotal() {
  const subtotal = document.querySelector("#productSubtotal");
  if (!subtotal) return;
  subtotal.textContent = rupiah.format(finalPrice(currentProduct()) * state.qty);
}

const REGION_API_BASE = "https://wilayah.id/api";
const POSTAL_SQL_URL = "https://raw.githubusercontent.com/cahyadsn/wilayah_kodepos/main/db/wilayah_kodepos.sql";
const regionCache = {
  provinces: null,
  cities: {},
  districts: {},
  postals: {},
  postalSql: null
};

function getLocalRegionData() {
  return window.REGION_DATA || null;
}

function normalizeLocalRows(rows) {
  return sortRegionRows((rows || []).map((item) => ({
    code: String(item.code || ""),
    name: String(item.name || "").trim()
  })).filter((item) => item.code && item.name));
}

function sortRegionRows(rows) {
  return rows.slice().sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
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
  const pattern = new RegExp(`\('${escapeRegex(districtCode)}\.\d{4}'\s*,\s*'?([0-9]{5})'?\)`, "g");
  const found = new Set();
  let match;
  while ((match = pattern.exec(regionCache.postalSql)) !== null) found.add(match[1]);
  regionCache.postals[districtCode] = Array.from(found).sort().map((code) => ({ code, name: code }));
  return regionCache.postals[districtCode];
}

function renderPostalManual(container, prefix, currentPostal = "") {
  container.innerHTML = `
    <div class="address-manual-box">
      <label for="${prefix}PostalManual">Kode pos tidak ditemukan otomatis. Masukkan kode pos 5 digit.</label>
      <input id="${prefix}PostalManual" class="address-manual-input" type="text" inputmode="numeric" maxlength="5" placeholder="Contoh: 10210" value="${escapeHtml(currentPostal || "")}" data-${prefix}-postal-manual />
    </div>
  `;
}

const addressSteps = ["province", "city", "district", "postal"];
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
  if (!els.addressSearch) return;
  els.addressSearch.value = selectedAddressParts().join(", ");
}

function setAddressStep(step) {
  state.addressDraft.step = step;
  
els.addressOptions?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-address-postal-manual]");
  if (!input) return;
  input.value = input.value.replace(/\D/g, "").slice(0, 5);
  state.addressDraft.postal = input.value;
  updateAddressSearch();
});
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
        renderPostalManual(els.addressOptions, "address", state.addressDraft.postal);
      } else {
        els.addressOptions.innerHTML = `<div class="address-empty">Pilih ${addressStepLabels[step]} sebelumnya.</div>`;
      }
      return;
    }

    els.addressOptions.innerHTML = rows
      .map(
        (item) => `
          <button class="address-option ${item.name === currentValue ? "selected" : ""}" type="button" data-address-value="${escapeHtml(item.name)}" data-address-code="${escapeHtml(item.code)}">
            ${escapeHtml(item.name)}
          </button>
        `
      )
      .join("");
  } catch (error) {
    if (step === "postal") {
      renderPostalManual(els.addressOptions, "address", state.addressDraft.postal);
      return;
    }
    els.addressOptions.innerHTML = `<div class="address-empty">Data wilayah belum tersedia pada pilihan ini.</div>`;
  }
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
    resetBuyerAddressDraft();
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

function clearBuyerAddressFields() {
  if (els.buyerNameField) els.buyerNameField.value = "";
  if (els.buyerPhoneField) els.buyerPhoneField.value = "";
  if (els.buyerStreetField) els.buyerStreetField.value = "";
  if (els.buyerDistrictField) els.buyerDistrictField.value = "";
  if (els.buyerCityField) els.buyerCityField.value = "";
  if (els.buyerProvinceField) els.buyerProvinceField.value = "";
  if (els.buyerPostalField) els.buyerPostalField.value = "";
  if (els.buyerAddressTagField) els.buyerAddressTagField.value = "";
}

function resetBuyerAddressDraft() {
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

function updateAddressFields() {
  const address = state.address;
  if (!address) {
    clearBuyerAddressFields();
    if (els.addressPreview) {
      els.addressPreview.classList.add("empty");
      els.addressPreview.innerHTML = "Belum ada alamat. Klik Alamat Baru untuk mengisi alamat pembeli.";
    }
    return;
  }

  if (els.buyerNameField) els.buyerNameField.value = address.name || "";
  if (els.buyerPhoneField) els.buyerPhoneField.value = address.phone || "";
  if (els.buyerStreetField) els.buyerStreetField.value = address.street || "";
  if (els.buyerDistrictField) els.buyerDistrictField.value = address.district || "";
  if (els.buyerCityField) els.buyerCityField.value = address.city || "";
  if (els.buyerProvinceField) els.buyerProvinceField.value = address.province || "";
  if (els.buyerPostalField) els.buyerPostalField.value = address.postal || "";
  if (els.buyerAddressTagField) els.buyerAddressTagField.value = address.tag || "";

  if (els.addressPreview) {
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
  resetBuyerAddressDraft();
  updateAddressFields();
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
  updateAddressFields();
  closeAddressModal();
  notify("Alamat pembeli tersimpan.");
}

document.addEventListener("click", (event) => {
  const plusButton = event.target.closest("[data-plus-cart]");
  const minusButton = event.target.closest("[data-minus-cart]");
  const removeButton = event.target.closest("[data-remove-cart]");
  const themeButton = event.target.closest("[data-theme-choice]");
  const viewBuyerAddressButton = event.target.closest("[data-view-buyer-address]");
  const editBuyerAddressButton = event.target.closest("[data-edit-buyer-address]");
  const deleteBuyerAddressButton = event.target.closest("[data-delete-buyer-address]");
  const closeBuyerPopupButton = event.target.closest("[data-close-buyer-address-popup]");
  const popupEditBuyerAddress = event.target.closest("[data-popup-edit-buyer-address]");
  const popupDeleteBuyerAddress = event.target.closest("[data-popup-delete-buyer-address]");
  const buyerAddressPopup = document.querySelector("#buyerAddressDetailPopup");

  if (plusButton) updateCart(Number(plusButton.dataset.plusCart), "plus");
  if (minusButton) updateCart(Number(minusButton.dataset.minusCart), "minus");
  if (removeButton) updateCart(Number(removeButton.dataset.removeCart), "remove");
  if (themeButton) applyTheme(themeButton.dataset.themeChoice);
  if (viewBuyerAddressButton) viewBuyerAddress();
  if (editBuyerAddressButton) openAddressModal();
  if (deleteBuyerAddressButton) deleteBuyerAddress();
  if (closeBuyerPopupButton || event.target === buyerAddressPopup) closeBuyerAddressPopup();
  if (popupEditBuyerAddress) { closeBuyerAddressPopup(); openAddressModal(); }
  if (popupDeleteBuyerAddress) { closeBuyerAddressPopup(); deleteBuyerAddress(); }
});

els.cartOpen?.addEventListener("click", () => openDrawer(els.cartDrawer));
els.cartClose?.addEventListener("click", () => closeDrawer(els.cartDrawer));
els.checkoutJump?.addEventListener("click", () => { closeDrawer(els.cartDrawer); createCartOrder(); });
els.paymentSelect?.addEventListener("change", renderPaymentGuide);

els.detailSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const search = encodeURIComponent(els.detailSearchInput?.value.trim() || "");
  window.location.href = search ? `index.html?q=${search}#produk` : "index.html#produk";
});

els.addressOpen?.addEventListener("click", openAddressModal);
els.addressClose?.addEventListener("click", closeAddressModal);
els.addressLater?.addEventListener("click", closeAddressModal);
els.addressOk?.addEventListener("click", saveAddressFromModal);
els.addressModal?.addEventListener("click", (event) => {
  if (event.target === els.addressModal) closeAddressModal();
});
els.addressOptions?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-address-value]");
  if (!option) return;
  selectAddressValue(option.dataset.addressValue, option.dataset.addressCode || "");
});
document.querySelectorAll("[data-address-tab]").forEach((button) => {
  button.addEventListener("click", () => setAddressStep(button.dataset.addressTab));
});
document.querySelectorAll("[data-address-tag]").forEach((button) => {
  button.addEventListener("click", () => {
    state.addressDraft.tag = button.dataset.addressTag;
    document.querySelectorAll("[data-address-tag]").forEach((entry) => entry.classList.toggle("active", entry === button));
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && els.addressModal && !els.addressModal.hidden) closeAddressModal();
});

function openOrderPayment(order) {
  state.orders.push(order);
  write(ORDERS_KEY, state.orders);
  notify("Membuka rincian pembelian produk.");
  window.location.href = `order-payment.html?order=${encodeURIComponent(order.id)}`;
}

function createCurrentProductOrder() {
  const product = currentProduct();
  if (!product) { notify("Produk belum tersedia."); return; }
  const selectedVariant = state.variant || productVariants(product)[0];
  const selectedProductPrice = finalPrice(product, selectedVariant);
  const productTotal = selectedProductPrice * state.qty;
  openOrderPayment({
    id: `ORD-${Date.now()}`,
    status: "Menunggu rincian pembelian",
    items: [
      {
        id: product.id,
        title: product.title,
        variant: selectedVariant,
        qty: state.qty,
        price: selectedProductPrice
      }
    ],
    productTotal,
    shippingName: "",
    shippingCost: 0,
    payment: "",
    paymentDetail: "",
    total: productTotal,
    productImage: product.photos?.[0] || product.image || "",
    createdAt: new Date().toISOString()
  });
}

function createCartOrder() {
  if (!state.cart.length) {
    notify("Keranjang masih kosong.");
    return;
  }
  const items = state.cart.map((item) => {
    const product = state.products.find((entry) => entry && entry.id === item.id);
    if (!product) return null;
    const variant = item.variant || productVariants(product)[0];
    return {
      id: product.id,
      title: product.title,
      variant,
      qty: item.qty,
      price: finalPrice(product, variant)
    };
  }).filter((item) => item && item.id);
  const productTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (!items.length) { notify("Produk di keranjang tidak tersedia."); return; }
  const firstProduct = state.products.find((entry) => entry && entry.id === items[0]?.id);
  openOrderPayment({
    id: `ORD-${Date.now()}`,
    status: "Menunggu rincian pembelian",
    items,
    productTotal,
    shippingName: "",
    shippingCost: 0,
    payment: "",
    paymentDetail: "",
    total: productTotal,
    productImage: firstProduct?.photos?.[0] || firstProduct?.image || "",
    createdAt: new Date().toISOString()
  });
}

try {
  applyTheme(localStorage.getItem(THEME_KEY));
  updateAddressFields();
  renderSelectOptions();
  renderProduct();
  renderCart();
} catch (error) {
  console.error("Halaman produk gagal dimuat:", error);
  if (els.productDetail) {
    els.productDetail.innerHTML = `<div class="empty-state"><h2>Halaman produk gagal dimuat</h2><p>Silakan muat ulang halaman atau kembali ke toko.</p><a class="primary-button" href="index.html#produk">Kembali ke Produk</a></div>`;
  }
}

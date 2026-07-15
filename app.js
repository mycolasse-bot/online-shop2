const DATA = window.StoreData;
const PRODUCTS_KEY = "fashion_products_v4";
const CART_KEY = "fashion_cart_v3";
const ORDERS_KEY = "fashion_orders_v3";
const ADMIN_KEY = "fashion_admin";
const THEME_KEY = "fashion_theme";
const SHIPPING_KEY = "fashion_shipping_v1";
const PAYMENT_KEY = "fashion_payments_v1";
const PROMO_KEY = "fashion_promo_v1";
const HOME_SETTINGS_KEY = "fashion_home_settings_v1";
const STORE_KEY = "fashion_store_profile_v1";
const BUYER_ACCOUNTS_KEY = "fashion_buyer_accounts_v1";
const BUYER_EMAIL_KEY = "fashion_buyer_email";

const DEFAULT_PROMO = {
  eyebrow: "🔥 PROMO TERBATAS",
  title: "Headphone Wireless Premium",
  description: "Nikmati pengalaman mendengarkan musik tanpa batas dengan kualitas suara terbaik.",
  badge: "Rp199.000  •  Diskon 33%",
  mainImage: "assets/sample-product-real.jpg"
};

const DEFAULT_HOME_SETTINGS = {
  shortcuts: ["🛡️ Garansi 100% Original", "🚚 Gratis Ongkir", "↩️ 14 Hari Pengembalian", "🎧 Layanan 24/7"],
  categoryTitle: "Kategori Populer",
  flashTitle: "🔥 Flash Sale",
  flashStartDate: "",
  flashEndDate: "",
  promoProductId: "",
  categoryProductIds: [],
  flashProductIds: [],
  flashSalePrices: []
};

const DEFAULT_STORE_PROFILE = {
  name: "Online Shop",
  phone: "",
  street: "",
  province: "",
  provinceCode: "",
  city: "",
  cityCode: "",
  district: "",
  districtCode: "",
  postal: ""
};

const HERO_SLIDES = [
  { eyebrow: "🔥 PROMO TERBATAS", title: "Headphone Wireless Premium", description: "Nikmati suara jernih tanpa batas dengan baterai tahan lama dan desain nyaman.", badge: "Rp199.000 • Diskon 33%", image: "assets/hero-headphones-real.png" },
  { eyebrow: "⚡ ELEKTRONIK PILIHAN", title: "Upgrade Gadget Harianmu", description: "Earbuds, smartwatch, dan speaker pintar untuk kerja, olahraga, dan perjalanan.", badge: "Mulai Rp89.000 • Gratis Ongkir", image: "assets/photos/electronics-real.png" },
  { eyebrow: "✨ SELF-CARE FAVORIT", title: "Rutinitas Glowing Setiap Hari", description: "Skincare ringan dan produk kecantikan pilihan untuk menemani aktivitasmu.", badge: "Mulai Rp119.000 • Hemat 20%", image: "assets/photos/beauty-real.png" }
];
let heroIndex = 0;

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const state = {
  products: loadProducts(),
  cart: read(CART_KEY, []),
  orders: read(ORDERS_KEY, []),
  shippingOptions: read(SHIPPING_KEY, DATA.shippingOptions),
  paymentMethods: read(PAYMENT_KEY, DATA.paymentMethods),
  promo: read(PROMO_KEY, DEFAULT_PROMO),
  homeSettings: read(HOME_SETTINGS_KEY, DEFAULT_HOME_SETTINGS),
  storeProfile: read(STORE_KEY, DEFAULT_STORE_PROFILE),
  storeAddressDraft: {
    step: "province",
    street: "",
    province: "",
    provinceCode: "",
    city: "",
    cityCode: "",
    district: "",
    districtCode: "",
    postal: ""
  },
  selectedCategory: "Semua",
  search: new URLSearchParams(window.location.search).get("q") || "",
  saleFilterOnly: false,
  admin: localStorage.getItem(ADMIN_KEY) === "true"
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

const els = {
  adminClose: document.querySelector("#adminClose"),
  adminContent: document.querySelector("#adminContent"),
  adminDrawer: document.querySelector("#adminDrawer"),
  adminProductList: document.querySelector("#adminProductList"),
  adminDiscountList: document.querySelector("#adminDiscountList"),
  cartClose: document.querySelector("#cartClose"),
  cartCount: document.querySelector("#cartCount"),
  cartDrawer: document.querySelector("#cartDrawer"),
  cartItems: document.querySelector("#cartItems"),
  cartOpen: document.querySelector("#cartOpen"),
  cartSubtotal: document.querySelector("#cartSubtotal"),
  buyerLoginOpen: document.querySelector("#buyerLoginOpen"),
  buyerLoginClose: document.querySelector("#buyerLoginClose"),
  buyerLoginDrawer: document.querySelector("#buyerLoginDrawer"),
  buyerLoginForm: document.querySelector("#buyerLoginForm"),
  buyerLoginResult: document.querySelector("#buyerLoginResult"),
  categoryFilters: document.querySelector("#categoryFilters"),
  categoryGrid: document.querySelector("#categoryGrid"),
  checkoutForm: document.querySelector("#checkoutForm"),
  checkoutJump: document.querySelector("#checkoutJump"),
  clearOrders: document.querySelector("#clearOrders"),
  flashClock: document.querySelector("#flashClock") || document.querySelector(".flash-card .flash-timer"),
  flashList: document.querySelector(".flash-list"),
  flashStrip: document.querySelector("#flashStrip"),
  loginForm: document.querySelector("#loginForm"),
  logoutAdmin: document.querySelector("#logoutAdmin"),
  orderList: document.querySelector("#orderList"),
  orderFilterDate: document.querySelector("#orderFilterDate"),
  orderFilterMonth: document.querySelector("#orderFilterMonth"),
  orderFilterYear: document.querySelector("#orderFilterYear"),
  paymentMethodForm: document.querySelector("#paymentMethodForm"),
  paymentMethodList: document.querySelector("#paymentMethodList"),
  promoBadge: document.querySelector("#promoBadge"),
  promoDescription: document.querySelector("#promoDescription"),
  promoEyebrow: document.querySelector("#promoEyebrow"),
  promoForm: document.querySelector("#promoForm"),
  promoMainImage: document.querySelector("#promoMainImage"),
  promoTitle: document.querySelector("#promoTitle"),
  storeSettingsForm: document.querySelector("#storeSettingsForm"),
  storeNameInput: document.querySelector("#storeNameInput"),
  storePhoneInput: document.querySelector("#storePhoneInput"),
  storeStreetInput: document.querySelector("#storeStreetInput"),
  storeModalStreet: document.querySelector("#storeModalStreet"),
  storeAddressSearch: document.querySelector("#storeAddressSearch"),
  storeAddressOptions: document.querySelector("#storeAddressOptions"),
  storeAddressPreview: document.querySelector("#storeAddressPreview"),
  storeAddressOpen: document.querySelector("#storeAddressOpen"),
  storeAddressModal: document.querySelector("#storeAddressModal"),
  storeAddressClose: document.querySelector("#storeAddressClose"),
  storeAddressOk: document.querySelector("#storeAddressOk"),
  paymentResult: document.querySelector("#paymentResult"),
  paymentSelect: document.querySelector("#paymentSelect"),
  productForm: document.querySelector("#productForm"),
  productGrid: document.querySelector("#productGrid"),
  productSubmit: document.querySelector("#productSubmit"),
  variantAdd: document.querySelector("#variantAdd"),
  variantRowList: document.querySelector("#variantRowList"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  shippingForm: document.querySelector("#shippingForm"),
  shippingList: document.querySelector("#shippingList"),
  shippingSelect: document.querySelector("#shippingSelect"),
  toast: document.querySelector("#toast")
};

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function makeId(value) {
  return String(value || "produk")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42) || `produk-${Date.now()}`;
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files) {
  const imageFiles = Array.from(files || []).filter((file) => file && file.type.startsWith("image/"));
  return Promise.all(imageFiles.map(fileToDataUrl));
}

function productPhotoKey(product) {
  const text = `${product.id} ${product.category} ${product.title}`.toLowerCase();
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

function productVariantPrice(product, variantName = "") {
  const variants = normalizeProductVariants(product);
  if (variants.length) {
    const selected = variants.find((variant) => variant.name === variantName);
    if (selected) return selected.price;
    return Math.min(...variants.map((variant) => variant.price));
  }
  return Number(product?.price || 0);
}

function variantSummary(product) {
  const variants = normalizeProductVariants(product);
  if (!variants.length) return "";
  const prices = variants.map((variant) => variant.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceText = minPrice === maxPrice ? rupiah.format(minPrice) : `${rupiah.format(minPrice)} - ${rupiah.format(maxPrice)}`;
  return `${variants.length} varian | ${priceText}`;
}

function hydrateProduct(product) {
  const key = productPhotoKey(product);
  const photos = product.photos?.length ? product.photos : DATA.productPhotos[key];
  return {
    ...product,
    photos,
    image: product.image || photos[0],
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
  const savedProducts = read(PRODUCTS_KEY, DATA.products);
  const sourceProducts = Array.isArray(savedProducts) && savedProducts.length ? savedProducts : DATA.products;
  return sourceProducts.map(hydrateProduct).filter(Boolean);
}

function saveProducts() {
  write(PRODUCTS_KEY, state.products);
}

function saveCart() {
  write(CART_KEY, state.cart);
}

function saveOrders() {
  write(ORDERS_KEY, state.orders);
}

function saveShipping() {
  write(SHIPPING_KEY, state.shippingOptions);
}

function savePayments() {
  write(PAYMENT_KEY, state.paymentMethods);
}

function savePromo() {
  write(PROMO_KEY, state.promo);
}

function saveStoreProfile() {
  write(STORE_KEY, state.storeProfile);
}

function finalPrice(product, variantName = "") {
  const basePrice = productVariantPrice(product, variantName);
  return Math.round(basePrice - basePrice * (Number(product.discount || 0) / 100));
}

function flashSalePriceFor(index) {
  const prices = Array.isArray(state.homeSettings.flashSalePrices) ? state.homeSettings.flashSalePrices : [];
  const price = Number(prices[index] || 0);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

function notify(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function renderSelectOptions() {
  if (!els.shippingSelect || !els.paymentSelect) return;
  els.shippingSelect.innerHTML = state.shippingOptions
    .map((item) => `<option value="${escapeHtml(item.name)}|${item.price}">${escapeHtml(item.name)} - ${rupiah.format(item.price)}</option>`)
    .join("");
  els.paymentSelect.innerHTML = state.paymentMethods
    .map((item) => `<option value="${escapeHtml(item.name)}">${escapeHtml(item.name)}</option>`)
    .join("");
}

function getPaymentMethod(name) {
  return state.paymentMethods.find((item) => item.name === name);
}

let promoImageRenderToken = 0;

function promoFromProduct(product) {
  const price = finalPrice(product);
  const discount = Number(product.discount || 0);
  const savings = Math.max(0, Number(product.price || 0) - price);
  return {
    eyebrow: discount > 0 ? `🔥 DISKON ${discount}%` : "✨ PRODUK TERBARU",
    title: product.title,
    description: product.description,
    badge: discount > 0
      ? `${rupiah.format(price)} • Hemat ${rupiah.format(savings)}`
      : rupiah.format(price),
    mainImage: product.image || product.photos?.[0] || DEFAULT_PROMO.mainImage
  };
}

function applyPromoImagePalette(imageUrl) {
  const hero = document.querySelector(".main-promo");
  if (!hero || !imageUrl) return;

  const token = ++promoImageRenderToken;
  const image = new Image();

  image.addEventListener("load", () => {
    if (token !== promoImageRenderToken) return;

    let red = 42;
    let green = 45;
    let blue = 64;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 40;
      canvas.height = 40;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;

      for (let index = 0; index < pixels.length; index += 16) {
        if (pixels[index + 3] < 40) continue;
        totalRed += pixels[index];
        totalGreen += pixels[index + 1];
        totalBlue += pixels[index + 2];
        count += 1;
      }

      if (count) {
        red = Math.round(totalRed / count);
        green = Math.round(totalGreen / count);
        blue = Math.round(totalBlue / count);
      }
    } catch (error) {
      // Local previews or remote images may block canvas sampling. The fallback remains readable.
    }

    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    const isLight = luminance > 0.58;
    const text = isLight ? "#141923" : "#FFFFFF";
    const muted = isLight ? "rgba(20, 25, 35, .76)" : "rgba(255, 255, 255, .84)";
    const oldPrice = isLight ? "rgba(20, 25, 35, .58)" : "rgba(255, 255, 255, .68)";
    const ctaBackground = isLight ? "#141923" : "#FFFFFF";
    const ctaText = isLight ? "#FFFFFF" : `rgb(${Math.max(28, red)}, ${Math.max(28, green)}, ${Math.max(28, blue)})`;
    const safeUrl = String(imageUrl);

    const gradient = isLight
      ? `linear-gradient(90deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.88) 38%, rgba(${red},${green},${blue},.36) 66%, rgba(${red},${green},${blue},.08) 100%)`
      : `linear-gradient(90deg, rgba(${red},${green},${blue},.96) 0%, rgba(${red},${green},${blue},.82) 39%, rgba(${red},${green},${blue},.28) 68%, rgba(${red},${green},${blue},.06) 100%)`;

    hero.style.setProperty("--promo-text", text);
    hero.style.setProperty("--promo-muted", muted);
    hero.style.setProperty("--promo-price", text);
    hero.style.setProperty("--promo-old", oldPrice);
    hero.style.setProperty("--promo-cta-bg", ctaBackground);
    hero.style.setProperty("--promo-cta-text", ctaText);
    hero.style.backgroundImage = `${gradient}, url("${safeUrl}")`;
    hero.style.backgroundPosition = "center";
    hero.style.backgroundSize = "cover";
    hero.classList.add("promo-from-upload");
  });

  image.addEventListener("error", () => {
    if (token !== promoImageRenderToken) return;
    hero.style.backgroundImage = `var(--promo-main), url("${DEFAULT_PROMO.mainImage}")`;
  });

  image.src = imageUrl;
}

function renderPromoBanner() {
  state.homeSettings = { ...DEFAULT_HOME_SETTINGS, ...state.homeSettings };
  const promo = { ...DEFAULT_PROMO, ...state.promo };
  const promoLinkProduct = state.products.find((product) => product.id === state.homeSettings.promoProductId);
  const hero = document.querySelector(".main-promo");
  if (hero) hero.href = promoLinkProduct ? `product.html?id=${encodeURIComponent(promoLinkProduct.id)}` : "#produk";
  if (els.promoEyebrow) els.promoEyebrow.textContent = promo.eyebrow;
  if (els.promoTitle) els.promoTitle.textContent = promo.title;
  if (els.promoDescription) els.promoDescription.textContent = promo.description;
  if (els.promoBadge) els.promoBadge.textContent = promo.badge;
  if (els.promoMainImage) els.promoMainImage.src = promo.mainImage || DEFAULT_PROMO.mainImage;
  applyPromoImagePalette(promo.mainImage || DEFAULT_PROMO.mainImage);
}

function renderHeroSlide(index) {
  const slide = HERO_SLIDES[index % HERO_SLIDES.length];
  if (!els.promoEyebrow) return;
  els.promoEyebrow.textContent = slide.eyebrow;
  els.promoTitle.textContent = slide.title;
  els.promoDescription.textContent = slide.description;
  els.promoBadge.textContent = slide.badge;
  const hero = document.querySelector(".main-promo");
  if (hero) hero.style.backgroundImage = `var(--promo-main), url("${slide.image}")`;
  document.querySelectorAll(".hero-dots i").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
}

function renderCategories() {
  state.homeSettings = { ...DEFAULT_HOME_SETTINGS, ...state.homeSettings };
  const categoryIds = Array.isArray(state.homeSettings.categoryProductIds) ? state.homeSettings.categoryProductIds : [];
  const chosenProducts = categoryIds.map((id) => state.products.find((product) => product.id === id)).filter(Boolean);
  const categoryItems = chosenProducts.length ? chosenProducts : DATA.categories;
  els.categoryGrid.innerHTML = categoryItems
    .map(
      (item) => {
        const isProduct = Boolean(item.id);
        const label = isProduct ? (item.category || item.title) : item.name;
        const image = isProduct ? item.image : item.image;
        const href = isProduct ? `product.html?id=${encodeURIComponent(item.id)}` : "#produk";
        const extraAttr = isProduct ? "" : ` data-category="${escapeHtml(item.name)}"`;
        return `
          <a class="category-item" href="${href}"${extraAttr}>
            <img src="${image}" alt="${escapeHtml(label)}" />
            <span>${escapeHtml(label)}</span>
          </a>
        `;
      }
    )
    .join("");

  const categories = ["Semua", ...new Set(state.products.map((product) => product.category))];
  els.categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button class="${category === state.selectedCategory ? "active" : ""}" type="button" data-filter="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");
}

function flashSaleProductMap() {
  state.homeSettings = { ...DEFAULT_HOME_SETTINGS, ...state.homeSettings };
  const map = new Map();
  if (!Array.isArray(state.homeSettings.flashProductIds)) return map;
  state.homeSettings.flashProductIds.forEach((id, index) => {
    if (!id) return;
    map.set(id, flashSalePriceFor(index));
  });
  return map;
}

function isFlashOrDiscountProduct(product) {
  const flashMap = flashSaleProductMap();
  return flashMap.has(product.id) || Number(product.discount || 0) > 0;
}

function filteredProducts() {
  const search = state.search.trim().toLowerCase();
  return state.products.filter((product) => {
    const saleMatch = !state.saleFilterOnly || isFlashOrDiscountProduct(product);
    const categoryMatch = state.selectedCategory === "Semua" || product.category === state.selectedCategory;
    const searchMatch =
      !search ||
      `${product.title} ${product.category} ${product.description}`.toLowerCase().includes(search);
    return saleMatch && categoryMatch && searchMatch;
  });
}

function productCard(product, options = {}) {
  const salePrice = Number(options.salePrice || 0);
  const normalFinalPrice = finalPrice(product);
  const displayPrice = salePrice > 0 ? salePrice : normalFinalPrice;
  const hasDiscount = salePrice > 0 || Number(product.discount) > 0;
  const oldPrice = salePrice > 0 ? normalFinalPrice : product.price;
  const saleText = salePrice > 0 ? "FLASH" : `-${product.discount}%`;
  return `
    <article class="product-card">
      <a class="product-link" href="product.html?id=${encodeURIComponent(product.id)}">
        <img src="${product.image}" alt="${escapeHtml(product.title)}" />
        <div class="product-body">
          <h3 class="product-title">${escapeHtml(product.title)}</h3>
          <div class="price-row">
            <strong class="price">${rupiah.format(displayPrice)}</strong>
            ${hasDiscount ? `<span class="sale-text">${saleText}</span>` : ""}
          </div>
          ${hasDiscount && oldPrice > displayPrice ? `<span class="old-price">${rupiah.format(oldPrice)}</span>` : ""}
          <div class="sold-row">
            <span>${product.rating} ★</span>
            <span>Terjual ${product.sold}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderProducts() {
  const products = filteredProducts();
  const flashMap = flashSaleProductMap();
  els.productGrid.innerHTML = products.length
    ? products.map((product) => productCard(product, { salePrice: flashMap.get(product.id) || 0 })).join("")
    : `<p class="empty-text">Produk tidak ditemukan.</p>`;
}

function renderSideFlashList() {
  if (!els.flashList) return;

  state.homeSettings = { ...DEFAULT_HOME_SETTINGS, ...state.homeSettings };
  const configured = Array.isArray(state.homeSettings.flashProductIds)
    ? state.homeSettings.flashProductIds
        .map((id, index) => ({ product: state.products.find((item) => item.id === id), salePrice: flashSalePriceFor(index) }))
        .filter((entry) => entry.product)
    : [];
  const products = configured.length
    ? configured
    : state.products.slice(0, 3).map((product) => ({ product, salePrice: 0 }));
  els.flashList.innerHTML = products
    .map(({ product, salePrice }) => {
      const discount = Number(product.discount || 0);
      const displayPrice = salePrice > 0 ? salePrice : finalPrice(product);
      const oldPrice = salePrice > 0 ? finalPrice(product) : product.price;
      const hasDiscount = salePrice > 0 || discount > 0;
      const badge = salePrice > 0 ? "FLASH" : (hasDiscount ? `-${discount}%` : "BARU");
      return `
        <a class="flash-item" href="product.html?id=${encodeURIComponent(product.id)}">
          <img src="${product.image}" alt="${escapeHtml(product.title)}" />
          <span>
            <b>${escapeHtml(product.title)}</b>
            <strong>${rupiah.format(displayPrice)}</strong>
            ${hasDiscount && oldPrice > displayPrice ? `<del>${rupiah.format(oldPrice)}</del>` : ""}
          </span>
          <i>${badge}</i>
        </a>
      `;
    })
    .join("");
}

function renderFlashSale() {
  if (!els.flashStrip) return;
  state.homeSettings = { ...DEFAULT_HOME_SETTINGS, ...state.homeSettings };
  const configured = Array.isArray(state.homeSettings.flashProductIds)
    ? state.homeSettings.flashProductIds
        .map((id, index) => ({ product: state.products.find((item) => item.id === id), salePrice: flashSalePriceFor(index) }))
        .filter((entry) => entry.product)
    : [];
  const saleProducts = configured.length
    ? configured
    : state.products.filter((product) => Number(product.discount) > 0).map((product) => ({ product, salePrice: 0 }));
  els.flashStrip.innerHTML = saleProducts.map(({ product, salePrice }) => productCard(product, { salePrice })).join("");
}

function findProduct(id) {
  return state.products.find((product) => product.id === id);
}

function addToCart(id, qty = 1) {
  const product = findProduct(id);
  if (!product) return;
  const item = state.cart.find((entry) => entry.id === id);
  if (item) item.qty += qty;
  else state.cart.push({ id, qty });
  saveCart();
  renderCart();
  notify("Produk masuk ke cart.");
}

function updateCart(id, action) {
  const item = state.cart.find((entry) => entry.id === id);
  if (!item) return;
  if (action === "plus") item.qty += 1;
  if (action === "minus") item.qty -= 1;
  if (action === "remove" || item.qty <= 0) {
    state.cart = state.cart.filter((entry) => entry.id !== id);
  }
  saveCart();
  renderCart();
}

function renderCart() {
  const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = state.cart.reduce((sum, item) => {
    const product = findProduct(item.id);
    return product ? sum + finalPrice(product, item.variant || "") * item.qty : sum;
  }, 0);

  els.cartCount.textContent = totalQty;
  els.cartSubtotal.textContent = rupiah.format(subtotal);
  if (els.checkoutJump) {
    const firstCartProduct = state.cart[0]?.id || "dress";
    els.checkoutJump.href = `product.html?id=${encodeURIComponent(firstCartProduct)}`;
  }
  els.cartItems.innerHTML = state.cart.length
    ? state.cart
        .map((item) => {
          const product = findProduct(item.id);
          if (!product) return "";
          return `
            <div class="cart-row">
              <div class="cart-row-head">
                <strong>${escapeHtml(product.title)}</strong>
                <span>${rupiah.format(finalPrice(product, item.variant || "") * item.qty)}</span>
              </div>
              <div class="item-actions">
                <span>${item.qty} x ${rupiah.format(finalPrice(product, item.variant || ""))}</span>
                <span>
                  <button type="button" data-minus="${escapeHtml(product.id)}">-</button>
                  <button type="button" data-plus="${escapeHtml(product.id)}">+</button>
                  <button type="button" data-remove="${escapeHtml(product.id)}">Hapus</button>
                </span>
              </div>
              ${item.variant ? `<small class="cart-variant">Varian: ${escapeHtml(item.variant)}</small>` : ""}
            </div>
          `;
        })
        .join("")
    : `<p>Keranjang masih kosong.</p>`;
}

function createOrderFromCart(form) {
  const [shippingName, shippingCost] = form.get("shipping").split("|");
  const items = state.cart
    .map((cartItem) => {
      const product = findProduct(cartItem.id);
      return product
        ? {
            id: product.id,
            title: product.title,
            qty: cartItem.qty,
            variant: cartItem.variant || "",
            price: finalPrice(product, cartItem.variant || "")
          }
        : null;
    })
    .filter(Boolean);
  const productTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const payment = form.get("payment");

  return {
    id: `ORD-${Date.now()}`,
    name: form.get("name"),
    phone: form.get("phone"),
    address: form.get("address"),
    shippingName,
    shippingCost: Number(shippingCost),
    payment,
    status: "Menunggu pembayaran",
    items,
    total: productTotal + Number(shippingCost),
    createdAt: new Date().toISOString()
  };
}

function paymentText(order) {
  const method = getPaymentMethod(order.payment);
  if (order.payment === "COD") {
    return `Pesanan dibuat. Pembayaran COD dilakukan saat paket diterima. Total: ${rupiah.format(order.total)}.`;
  }
  const detail = method ? ` ${method.type}: ${method.account}.` : "";
  return `Pesanan dibuat. Silakan bayar ${rupiah.format(order.total)} via ${order.payment}.${detail} Kode pembayaran: ${order.id}.`;
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

const storeAddressStepLabels = {
  province: "Provinsi",
  city: "Kota / Kabupaten",
  district: "Kecamatan",
  postal: "Kode Pos"
};

function loadStoreDraftFromProfile() {
  const profile = { ...DEFAULT_STORE_PROFILE, ...state.storeProfile };
  state.storeAddressDraft.street = profile.street || "";
  state.storeAddressDraft.province = profile.province || "";
  state.storeAddressDraft.provinceCode = profile.provinceCode || "";
  state.storeAddressDraft.city = profile.city || "";
  state.storeAddressDraft.cityCode = profile.cityCode || "";
  state.storeAddressDraft.district = profile.district || "";
  state.storeAddressDraft.districtCode = profile.districtCode || "";
  state.storeAddressDraft.postal = profile.postal || "";
}

async function availableStoreAddressRows(step) {
  if (step === "province") return getProvinceRows();
  if (step === "city") return getCityRows(state.storeAddressDraft.provinceCode);
  if (step === "district") return getDistrictRows(state.storeAddressDraft.cityCode);
  return getPostalRows(state.storeAddressDraft.districtCode);
}

function selectedStoreAddressParts() {
  return [
    state.storeAddressDraft.province,
    state.storeAddressDraft.city,
    state.storeAddressDraft.district,
    state.storeAddressDraft.postal
  ].filter(Boolean);
}

function updateStoreAddressSearch() {
  if (!els.storeAddressSearch) return;
  els.storeAddressSearch.value = selectedStoreAddressParts().join(", ");
}

function setStoreAddressStep(step) {
  state.storeAddressDraft.step = step;
  document.querySelectorAll("[data-store-address-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.storeAddressTab === step);
  });
  renderStoreAddressOptions();
}

function selectStoreAddressValue(value, code = "") {
  const step = state.storeAddressDraft.step;
  if (step === "province") {
    state.storeAddressDraft.province = value;
    state.storeAddressDraft.provinceCode = code;
    state.storeAddressDraft.city = "";
    state.storeAddressDraft.cityCode = "";
    state.storeAddressDraft.district = "";
    state.storeAddressDraft.districtCode = "";
    state.storeAddressDraft.postal = "";
    setStoreAddressStep("city");
  } else if (step === "city") {
    state.storeAddressDraft.city = value;
    state.storeAddressDraft.cityCode = code;
    state.storeAddressDraft.district = "";
    state.storeAddressDraft.districtCode = "";
    state.storeAddressDraft.postal = "";
    setStoreAddressStep("district");
  } else if (step === "district") {
    state.storeAddressDraft.district = value;
    state.storeAddressDraft.districtCode = code;
    state.storeAddressDraft.postal = "";
    setStoreAddressStep("postal");
  } else {
    state.storeAddressDraft.postal = value;
    renderStoreAddressOptions();
  }
  updateStoreAddressSearch();
  renderStoreAddressPreview();
}

async function renderStoreAddressOptions() {
  if (!els.storeAddressOptions) return;
  const step = state.storeAddressDraft.step;
  const currentValue = state.storeAddressDraft[step];
  document.querySelectorAll("[data-store-address-tab]").forEach((button) => {
    const tab = button.dataset.storeAddressTab;
    button.classList.toggle("active", tab === step);
    button.disabled =
      (tab === "city" && !state.storeAddressDraft.provinceCode) ||
      (tab === "district" && !state.storeAddressDraft.cityCode) ||
      (tab === "postal" && !state.storeAddressDraft.districtCode);
  });

  els.storeAddressOptions.innerHTML = `<div class="address-empty">Memuat ${storeAddressStepLabels[step]}...</div>`;

  try {
    const rows = await availableStoreAddressRows(step);
    if (!rows.length) {
      if (step === "postal") {
        renderPostalManual(els.storeAddressOptions, "store", state.storeAddressDraft.postal);
      } else {
        els.storeAddressOptions.innerHTML = `<div class="address-empty">Pilih ${storeAddressStepLabels[step]} sebelumnya.</div>`;
      }
      return;
    }

    els.storeAddressOptions.innerHTML = rows
      .map(
        (item) => `
          <button class="address-option ${item.name === currentValue ? "selected" : ""}" type="button" data-store-address-value="${escapeHtml(item.name)}" data-store-address-code="${escapeHtml(item.code)}">
            ${escapeHtml(item.name)}
          </button>
        `
      )
      .join("");
  } catch (error) {
    if (step === "postal") {
      renderPostalManual(els.storeAddressOptions, "store", state.storeAddressDraft.postal);
      return;
    }
    els.storeAddressOptions.innerHTML = `<div class="address-empty">Data wilayah belum tersedia pada pilihan ini.</div>`;
  }
}

function storeAddressLocationFromDraft() {
  return [
    state.storeAddressDraft.district,
    state.storeAddressDraft.city,
    state.storeAddressDraft.province,
    state.storeAddressDraft.postal
  ].filter(Boolean).join(", ");
}

function renderStoreAddressPreview(source = null) {
  if (!els.storeAddressPreview) return;
  const name = els.storeNameInput?.value?.trim() || state.storeProfile.name || "Online Shop";
  const street = source?.street ?? state.storeAddressDraft.street ?? "";
  const location = source
    ? [source.district, source.city, source.province, source.postal].filter(Boolean).join(", ")
    : storeAddressLocationFromDraft();

  if (!street && !location) {
    els.storeAddressPreview.classList.add("empty");
    els.storeAddressPreview.textContent = "Alamat toko belum diisi. Klik Alamat Baru untuk mengisi alamat toko.";
    return;
  }

  els.storeAddressPreview.classList.remove("empty");
  els.storeAddressPreview.innerHTML = `
    <strong>${escapeHtml(name)}</strong>
    <span>${escapeHtml(street || "Alamat toko belum ditulis")}</span>
    <span>${escapeHtml(location || "Wilayah toko belum dipilih")}</span>
  `;
}

function openStoreAddressModal() {
  if (!els.storeAddressModal) return;
  state.storeAddressDraft.street = els.storeStreetInput?.value || state.storeAddressDraft.street || state.storeProfile.street || "";
  if (els.storeModalStreet) els.storeModalStreet.value = state.storeAddressDraft.street || "";
  updateStoreAddressSearch();
  setStoreAddressStep(state.storeAddressDraft.province ? "city" : "province");
  els.storeAddressModal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => els.storeAddressSearch?.focus(), 0);
}

function closeStoreAddressModal() {
  if (!els.storeAddressModal) return;
  els.storeAddressModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function confirmStoreAddressModal() {
  state.storeAddressDraft.street = els.storeModalStreet?.value?.trim() || "";
  if (els.storeStreetInput) els.storeStreetInput.value = state.storeAddressDraft.street;
  renderStoreAddressPreview();
  closeStoreAddressModal();
  notify("Alamat toko siap disimpan.");
}

function renderStoreSettings() {
  if (!els.storeSettingsForm) return;
  const profile = { ...DEFAULT_STORE_PROFILE, ...state.storeProfile };
  els.storeNameInput.value = profile.name || "Online Shop";
  els.storePhoneInput.value = profile.phone || "";
  els.storeStreetInput.value = profile.street || "";
  if (els.storeModalStreet) els.storeModalStreet.value = profile.street || "";

  loadStoreDraftFromProfile();
  updateStoreAddressSearch();
  setStoreAddressStep(state.storeAddressDraft.province ? "city" : "province");
  renderStoreAddressPreview(profile);
}
function renderAdmin() {
  document.body.classList.toggle("admin-mode", state.admin);
  els.loginForm.hidden = state.admin;
  els.adminContent.hidden = !state.admin;

  if (els.promoForm) {
    const promo = { ...DEFAULT_PROMO, ...state.promo };
    els.promoForm.elements.eyebrow.value = promo.eyebrow;
    els.promoForm.elements.title.value = promo.title;
    els.promoForm.elements.description.value = promo.description;
    els.promoForm.elements.badge.value = promo.badge;
  }

  renderStoreSettings();

  els.adminProductList.innerHTML = state.products
    .map(
      (product) => `
        <div class="admin-product">
          <img src="${product.image}" alt="${escapeHtml(product.title)}" />
          <div>
            <strong>${escapeHtml(product.title)}</strong>
            <span>${escapeHtml(product.category)} - ${rupiah.format(finalPrice(product))} ${Number(product.discount) ? `- ${product.discount}%` : ""}</span>
            <p>${escapeHtml(product.description)}</p>
            <small>Stok ${product.stock} | ${product.photos?.length || 1} foto${variantSummary(product) ? ` | ${escapeHtml(variantSummary(product))}` : ""}</small>
          </div>
          <div class="admin-product-actions">
            <button type="button" data-edit="${escapeHtml(product.id)}">Edit</button>
            <button class="danger" type="button" data-delete="${escapeHtml(product.id)}">Hapus</button>
          </div>
        </div>
      `
    )
    .join("");

  if (els.adminDiscountList) {
    els.adminDiscountList.innerHTML = state.products
      .map(
        (product) => `
          <div class="admin-product">
            <img src="${product.image}" alt="${escapeHtml(product.title)}" />
            <div>
              <strong>${escapeHtml(product.title)}</strong>
              <span>${rupiah.format(productVariantPrice(product))} menjadi ${rupiah.format(finalPrice(product))}</span>
            </div>
            <div class="admin-inline-edit">
              <input type="number" min="0" max="90" step="1" value="${Number(product.discount || 0)}" data-discount-value="${escapeHtml(product.id)}" />
              <button type="button" data-discount-save="${escapeHtml(product.id)}">Simpan</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  if (els.shippingList) {
    els.shippingList.innerHTML = state.shippingOptions
      .map(
        (item, index) => `
          <div class="admin-product compact">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span>${rupiah.format(item.price)}</span>
            </div>
            <div class="admin-product-actions">
              <button type="button" data-shipping-edit="${index}">Edit</button>
              <button class="danger" type="button" data-shipping-delete="${index}">Hapus</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  if (els.paymentMethodList) {
    els.paymentMethodList.innerHTML = state.paymentMethods
      .map(
        (item, index) => `
          <div class="admin-product compact">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <span>${escapeHtml(item.type)}: ${escapeHtml(item.account)}</span>
              <small>Atas Nama: ${escapeHtml(item.holder)}</small>
            </div>
            <div class="admin-product-actions">
              <button type="button" data-payment-edit="${index}">Edit</button>
              <button class="danger" type="button" data-payment-delete="${index}">Hapus</button>
            </div>
          </div>
        `
      )
      .join("");
  }

  const filterDate = els.orderFilterDate?.value || "";
  const filterMonth = els.orderFilterMonth?.value || "";
  const filterYear = els.orderFilterYear?.value || "";
  const filteredOrders = state.orders.filter((order) => {
    const created = new Date(order.createdAt || 0);
    if (Number.isNaN(created.getTime())) return false;
    const iso = created.toISOString().slice(0, 10);
    return (!filterDate || iso === filterDate) &&
      (!filterMonth || String(created.getMonth() + 1).padStart(2, "0") === filterMonth) &&
      (!filterYear || String(created.getFullYear()) === filterYear);
  });
  els.orderList.innerHTML = filteredOrders.length
    ? filteredOrders
        .slice()
        .reverse()
        .map(
          (order) => `
            <div class="order-card">
              <strong>${escapeHtml(order.name)} - ${escapeHtml(order.phone)}</strong>
              <span>${escapeHtml(order.shippingName)} | ${escapeHtml(order.payment)} | Status: ${escapeHtml(order.status || "Diproses")}</span>
              <span>Total: ${rupiah.format(order.total)}</span>
              <p>${escapeHtml(order.address)}</p>
              <small>${order.items.map((item) => `${escapeHtml(item.title)}${item.variant ? ` (${escapeHtml(item.variant)})` : ""} x ${item.qty}`).join(", ")}</small>
            </div>
          `
        )
        .join("")
    : `<p>Belum ada pesanan yang sesuai filter.</p>`;
}

function renderOrderFilters() {
  if (!els.orderFilterMonth || !els.orderFilterYear) return;
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonth = els.orderFilterMonth.value;
  const currentYear = els.orderFilterYear.value;
  els.orderFilterMonth.innerHTML = `<option value="">Semua bulan</option>${monthNames.map((name, i) => `<option value="${String(i + 1).padStart(2, "0")}">${name}</option>`).join("")}`;
  const years = [...new Set(state.orders.map((order) => new Date(order.createdAt).getFullYear()).filter(Boolean))].sort((a, b) => b - a);
  els.orderFilterYear.innerHTML = `<option value="">Semua tahun</option>${years.map((year) => `<option value="${year}">${year}</option>`).join("")}`;
  els.orderFilterMonth.value = currentMonth;
  els.orderFilterYear.value = currentYear;
}


function formatFlashPeriod(startDate, endDate) {
  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `Periode: ${start} - ${end}`;
  if (start) return `Mulai: ${start}`;
  if (end) return `Sampai: ${end}`;
  return "";
}

function renderFlashPeriodLabel() {
  const periodText = formatFlashPeriod(state.homeSettings.flashStartDate, state.homeSettings.flashEndDate);
  document.querySelectorAll("[data-flash-period]").forEach((node) => node.remove());
  if (!periodText) return;
  const sideTimer = document.querySelector(".flash-card .flash-timer");
  if (sideTimer) {
    const label = document.createElement("div");
    label.className = "flash-period-label";
    label.dataset.flashPeriod = "side";
    label.textContent = periodText;
    sideTimer.insertAdjacentElement("afterend", label);
  }
  const sectionHead = document.querySelector("#flashsale .section-head");
  if (sectionHead) {
    const label = document.createElement("span");
    label.className = "flash-period-label section-period";
    label.dataset.flashPeriod = "section";
    label.textContent = periodText;
    sectionHead.appendChild(label);
  }
}

function renderHomeDisplaySettings() {
  state.homeSettings = { ...DEFAULT_HOME_SETTINGS, ...read(HOME_SETTINGS_KEY, state.homeSettings || DEFAULT_HOME_SETTINGS) };
  const shortcuts = Array.isArray(state.homeSettings.shortcuts) && state.homeSettings.shortcuts.length
    ? state.homeSettings.shortcuts.slice(0, 4)
    : DEFAULT_HOME_SETTINGS.shortcuts.slice();
  while (shortcuts.length < 4) shortcuts.push(DEFAULT_HOME_SETTINGS.shortcuts[shortcuts.length]);
  document.querySelectorAll(".shortcut-row a").forEach((link, index) => {
    link.textContent = shortcuts[index] || DEFAULT_HOME_SETTINGS.shortcuts[index] || "";
  });
  if (document.querySelector("#categoryTitle")) document.querySelector("#categoryTitle").textContent = state.homeSettings.categoryTitle || DEFAULT_HOME_SETTINGS.categoryTitle;
  if (document.querySelector("#flashTitle")) document.querySelector("#flashTitle").textContent = state.homeSettings.flashTitle || DEFAULT_HOME_SETTINGS.flashTitle;
  const flashHead = document.querySelector(".flash-head strong");
  if (flashHead) flashHead.textContent = state.homeSettings.flashTitle || DEFAULT_HOME_SETTINGS.flashTitle;
  const flashAllLink = document.querySelector(".flash-head a");
  if (flashAllLink) {
    flashAllLink.href = "#produk";
    flashAllLink.dataset.flashAll = "true";
  }
  renderFlashPeriodLabel();
}

function renderAll() {
  state.promo = read(PROMO_KEY, state.promo || DEFAULT_PROMO);
  renderPromoBanner();
  renderHomeDisplaySettings();
  renderSelectOptions();
  renderCategories();
  renderProducts();
  renderSideFlashList();
  renderFlashSale();
  renderCart();
  renderAdmin();
  renderOrderFilters();
}

function activateAdminSection(name) {
  document.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminTab === name);
  });
  document.querySelectorAll("[data-admin-section]").forEach((section) => {
    section.classList.toggle("active", section.dataset.adminSection === name);
  });
}

function openDrawer(drawer) {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer(drawer) {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
}

els.cartOpen.addEventListener("click", () => openDrawer(els.cartDrawer));
els.cartClose.addEventListener("click", () => closeDrawer(els.cartDrawer));
els.adminClose.addEventListener("click", () => closeDrawer(els.adminDrawer));
document.querySelector("#adminLoginOpen")?.addEventListener("click", () => {
  closeDrawer(els.buyerLoginDrawer);
  openDrawer(els.adminDrawer);
});
els.checkoutJump.addEventListener("click", () => closeDrawer(els.cartDrawer));
els.buyerLoginOpen?.addEventListener("click", () => openDrawer(els.buyerLoginDrawer));
els.buyerLoginClose?.addEventListener("click", () => closeDrawer(els.buyerLoginDrawer));
function encodeBuyerPassword(password) {
  try {
    return btoa(unescape(encodeURIComponent(password)));
  } catch (error) {
    return password;
  }
}

els.buyerLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!validEmail) {
    els.buyerLoginResult.hidden = false;
    els.buyerLoginResult.textContent = "Masukkan alamat email yang valid, contoh: nama@gmail.com.";
    return;
  }

  if (password.length < 6) {
    els.buyerLoginResult.hidden = false;
    els.buyerLoginResult.textContent = "Password minimal 6 karakter.";
    return;
  }

  const accounts = read(BUYER_ACCOUNTS_KEY, {});
  const encodedPassword = encodeBuyerPassword(password);
  const registeredAccount = accounts[email];

  if (registeredAccount && registeredAccount.password !== encodedPassword) {
    els.buyerLoginResult.hidden = false;
    els.buyerLoginResult.textContent = "Password salah. Coba lagi atau gunakan email lain untuk daftar akun baru.";
    return;
  }

  if (!registeredAccount) {
    accounts[email] = {
      email,
      password: encodedPassword,
      createdAt: new Date().toISOString()
    };
    write(BUYER_ACCOUNTS_KEY, accounts);
  }

  localStorage.setItem(BUYER_EMAIL_KEY, email);
  els.buyerLoginResult.hidden = false;
  els.buyerLoginResult.textContent = registeredAccount
    ? `Login berhasil sebagai ${email}. Data checkout akan tersimpan di perangkat ini.`
    : `Akun pembeli berhasil dibuat untuk ${email}. Kamu sudah login.`;
  const accountLabel = els.buyerLoginOpen?.querySelector(".nav-label");
  if (accountLabel) accountLabel.textContent = "Akun Saya";
  notify(registeredAccount ? "Login pembeli berhasil." : "Akun pembeli berhasil dibuat.");
});

document.addEventListener("click", (event) => {
  const adminTab = event.target.closest("[data-admin-tab]");
  const addButton = event.target.closest("[data-add]");
  const plusButton = event.target.closest("[data-plus]");
  const minusButton = event.target.closest("[data-minus]");
  const removeButton = event.target.closest("[data-remove]");
  const category = event.target.closest("[data-category]");
  const discountSave = event.target.closest("[data-discount-save]");
  const shippingEdit = event.target.closest("[data-shipping-edit]");
  const shippingDelete = event.target.closest("[data-shipping-delete]");
  const paymentEdit = event.target.closest("[data-payment-edit]");
  const paymentDelete = event.target.closest("[data-payment-delete]");
  const storeAddressOption = event.target.closest("[data-store-address-value]");
  const storeAddressTab = event.target.closest("[data-store-address-tab]");
  const storeAddressOpen = event.target.closest("#storeAddressOpen");
  const storeAddressClose = event.target.closest("#storeAddressClose");
  const storeAddressOk = event.target.closest("#storeAddressOk");
  const flashAll = event.target.closest("[data-flash-all]");

  if (flashAll) {
    event.preventDefault();
    state.saleFilterOnly = true;
    state.selectedCategory = "Semua";
    state.search = "";
    if (els.searchInput) els.searchInput.value = "";
    renderCategories();
    renderProducts();
    document.querySelector("#produk")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (storeAddressOpen) openStoreAddressModal();
  if (storeAddressClose) closeStoreAddressModal();
  if (storeAddressOk) confirmStoreAddressModal();
  if (event.target === els.storeAddressModal) closeStoreAddressModal();
  if (storeAddressTab) setStoreAddressStep(storeAddressTab.dataset.storeAddressTab);
  if (storeAddressOption) selectStoreAddressValue(storeAddressOption.dataset.storeAddressValue, storeAddressOption.dataset.storeAddressCode || "");
  if (adminTab) activateAdminSection(adminTab.dataset.adminTab);
  if (addButton) addToCart(addButton.dataset.add);
  if (plusButton) updateCart(plusButton.dataset.plus, "plus");
  if (minusButton) updateCart(minusButton.dataset.minus, "minus");
  if (removeButton) updateCart(removeButton.dataset.remove, "remove");
  if (category) {
    state.saleFilterOnly = false;
    state.selectedCategory = category.dataset.category;
    renderCategories();
    renderProducts();
  }
  if (discountSave) {
    const product = findProduct(discountSave.dataset.discountSave);
    const input = discountSave.closest(".admin-product").querySelector("[data-discount-value]");
    if (!product || !input) return;
    product.discount = Math.max(0, Math.min(90, Number(input.value || 0)));
    saveProducts();
    renderAll();
    notify("Discount produk disimpan.");
  }
  if (shippingEdit) {
    const index = Number(shippingEdit.dataset.shippingEdit);
    const item = state.shippingOptions[index];
    if (!item || !els.shippingForm) return;
    els.shippingForm.elements.index.value = index;
    els.shippingForm.elements.name.value = item.name;
    els.shippingForm.elements.price.value = item.price;
    activateAdminSection("shipping");
  }
  if (shippingDelete) {
    state.shippingOptions.splice(Number(shippingDelete.dataset.shippingDelete), 1);
    saveShipping();
    renderAll();
    notify("Ongkir dihapus.");
  }
  if (paymentEdit) {
    const index = Number(paymentEdit.dataset.paymentEdit);
    const item = state.paymentMethods[index];
    if (!item || !els.paymentMethodForm) return;
    els.paymentMethodForm.elements.index.value = index;
    els.paymentMethodForm.elements.name.value = item.name;
    els.paymentMethodForm.elements.type.value = item.type;
    els.paymentMethodForm.elements.account.value = item.account;
    els.paymentMethodForm.elements.holder.value = item.holder;
    els.paymentMethodForm.elements.note.value = item.note || "";
    activateAdminSection("payments");
  }
  if (paymentDelete) {
    state.paymentMethods.splice(Number(paymentDelete.dataset.paymentDelete), 1);
    savePayments();
    renderAll();
    notify("Metode pembayaran dihapus.");
  }
});

els.categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.saleFilterOnly = false;
  state.selectedCategory = button.dataset.filter;
  renderCategories();
  renderProducts();
});

els.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.saleFilterOnly = false;
  state.search = els.searchInput.value;
  renderProducts();
  document.querySelector("#produk").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector(".quick-links")?.addEventListener("click", (event) => {
  const quickLinks = event.currentTarget;
  const menuButton = event.target.closest(".category-menu");
  const button = event.target.closest("[data-search]");

  if (menuButton) {
    const isOpen = quickLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    return;
  }

  if (!button) return;
  els.searchInput.value = button.dataset.search;
  state.saleFilterOnly = false;
  state.search = button.dataset.search;
  renderProducts();
  quickLinks.classList.remove("open");
  quickLinks.querySelector(".category-menu")?.setAttribute("aria-expanded", "false");
  document.querySelector("#produk").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("click", (event) => {
  const quickLinks = document.querySelector(".quick-links");
  if (!quickLinks || quickLinks.contains(event.target)) return;
  quickLinks.classList.remove("open");
  quickLinks.querySelector(".category-menu")?.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (event) => {
  const themeButton = event.target.closest("[data-theme-choice]");
  if (!themeButton) return;
  applyTheme(themeButton.dataset.themeChoice);
});

if (els.checkoutForm) {
  els.checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.cart.length) {
      notify("Cart masih kosong.");
      return;
    }
    const order = createOrderFromCart(new FormData(event.currentTarget));
    state.orders.push(order);
    state.cart = [];
    saveOrders();
    saveCart();
    event.currentTarget.reset();
    renderAll();
    els.paymentResult.hidden = false;
    els.paymentResult.textContent = paymentText(order);
    notify("Pesanan masuk ke Seller Center.");
  });
}

function addVariantRow(variant = {}) {
  if (!els.variantRowList) return;
  const row = document.createElement("div");
  row.className = "variant-editor-row";
  row.dataset.variantRow = "true";
  row.innerHTML = `
    <label>
      Nama Varian
      <input data-variant-name placeholder="Contoh: Hitam - Size M" value="${escapeHtml(variant.name || "")}" />
    </label>
    <label>
      Harga Varian
      <input data-variant-price type="number" min="0" step="1000" placeholder="Contoh: 99000" value="${variant.price ?? ""}" />
    </label>
    <button class="secondary-button variant-remove" type="button" data-remove-variant>Hapus</button>
  `;
  els.variantRowList.appendChild(row);
}

function renderVariantRows(variants = []) {
  if (!els.variantRowList) return;
  els.variantRowList.innerHTML = "";
  const cleanVariants = Array.isArray(variants) ? variants : [];
  if (cleanVariants.length) {
    cleanVariants.forEach((variant) => addVariantRow(variant));
  } else {
    addVariantRow();
  }
}

function getVariantRows() {
  if (!els.variantRowList) return [];
  return [...els.variantRowList.querySelectorAll("[data-variant-row]")]
    .map((row) => {
      const name = row.querySelector("[data-variant-name]")?.value.trim() || "";
      const priceInput = row.querySelector("[data-variant-price]")?.value;
      const price = Number(priceInput);
      return { name, price };
    })
    .filter((variant) => variant.name && Number.isFinite(variant.price) && variant.price >= 0);
}

if (els.variantAdd) {
  els.variantAdd.addEventListener("click", () => addVariantRow());
}

if (els.variantRowList) {
  els.variantRowList.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-variant]");
    if (!removeButton) return;
    removeButton.closest("[data-variant-row]")?.remove();
    if (!els.variantRowList.querySelector("[data-variant-row]")) addVariantRow();
  });
}

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  if (form.get("username") === "seller" && form.get("password") === "seller123") {
    state.admin = true;
    localStorage.setItem(ADMIN_KEY, "true");
    renderAdmin();
    notify("Seller Center berhasil login.");
  } else {
    notify("Username atau password salah.");
  }
});

els.logoutAdmin.addEventListener("click", () => {
  state.admin = false;
  localStorage.removeItem(ADMIN_KEY);
  renderAdmin();
});

els.productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const existingId = form.get("id");
  let id = existingId || makeId(form.get("title"));
  if (!existingId && state.products.some((product) => product.id === id)) {
    id = `${id}-${Date.now()}`;
  }
  const oldProduct = state.products.find((product) => product.id === id);
  const uploadedPhotos = await filesToDataUrls(els.productForm.elements.photos.files);
  const product = hydrateProduct({
    id,
    title: form.get("title"),
    category: form.get("category"),
    price: Number(form.get("price")),
    discount: Number(form.get("discount") || 0),
    description: form.get("description"),
    detail: oldProduct?.detail || form.get("description"),
    photos: uploadedPhotos.length ? uploadedPhotos : oldProduct?.photos,
    image: uploadedPhotos[0] || oldProduct?.image,
    sold: oldProduct?.sold || 0,
    stock: Number(form.get("stock") || oldProduct?.stock || 20),
    rating: oldProduct?.rating || 4.8,
    material: form.get("material") || oldProduct?.material,
    color: form.get("color") || oldProduct?.color,
    weight: form.get("weight") || oldProduct?.weight,
    variants: getVariantRows()
  });

  const index = state.products.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    state.products[index] = product;
  } else {
    state.products.unshift(product);
  }

  saveProducts();

  // Product title, description, price, discount, and first uploaded photo become the Home promo.
  state.promo = promoFromProduct(product);
  savePromo();

  event.currentTarget.reset();
  els.productSubmit.textContent = "Tambah Produk";
  renderAll();
  notify(index >= 0 ? "Produk dan promo Home berhasil diperbarui." : "Produk ditambahkan dan dipasang sebagai promo Home.");
});

els.productForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    els.productForm.elements.id.value = "";
    renderVariantRows([]);
    els.productSubmit.textContent = "Tambah Produk";
  });
});

els.promoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const uploadedImage = await filesToDataUrls(els.promoForm.elements.mainImage.files);
  state.promo = {
    eyebrow: form.get("eyebrow"),
    title: form.get("title"),
    description: form.get("description"),
    badge: form.get("badge"),
    mainImage: uploadedImage[0] || state.promo.mainImage || DEFAULT_PROMO.mainImage
  };
  savePromo();
  renderAll();
  event.currentTarget.elements.mainImage.value = "";
  notify("Banner promosi disimpan.");
});



els.storeAddressOptions?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-store-postal-manual]");
  if (!input) return;
  input.value = input.value.replace(/\D/g, "").slice(0, 5);
  state.storeAddressDraft.postal = input.value;
  updateStoreAddressSearch();
  renderStoreAddressPreview();
});

els.storeModalStreet?.addEventListener("input", () => {
  state.storeAddressDraft.street = els.storeModalStreet.value;
});

els.storeSettingsForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const payload = {
    name: String(form.get("storeName") || "Online Shop").trim(),
    phone: String(form.get("storePhone") || "").trim(),
    street: String(form.get("storeStreet") || state.storeAddressDraft.street || "").trim(),
    province: state.storeAddressDraft.province,
    provinceCode: state.storeAddressDraft.provinceCode,
    city: state.storeAddressDraft.city,
    cityCode: state.storeAddressDraft.cityCode,
    district: state.storeAddressDraft.district,
    districtCode: state.storeAddressDraft.districtCode,
    postal: state.storeAddressDraft.postal
  };

  const required = [payload.name, payload.street, payload.province, payload.city, payload.district, payload.postal];
  if (required.some((value) => !value)) {
    notify("Lengkapi nama toko, alamat toko, provinsi, kota, kecamatan, dan kode pos.");
    return;
  }

  state.storeProfile = payload;
  saveStoreProfile();
  renderStoreSettings();
  notify("Pengaturan toko tersimpan.");
});

els.shippingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const item = {
    name: form.get("name"),
    price: Number(form.get("price") || 0)
  };
  const index = form.get("index");
  if (index === "") state.shippingOptions.push(item);
  else state.shippingOptions[Number(index)] = item;
  saveShipping();
  event.currentTarget.reset();
  renderAll();
  notify("Harga ongkir disimpan.");
});

els.shippingForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    els.shippingForm.elements.index.value = "";
  });
});

els.paymentMethodForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const item = {
    name: form.get("name"),
    type: form.get("type"),
    account: form.get("account"),
    holder: form.get("holder"),
    note: form.get("note")
  };
  const index = form.get("index");
  if (index === "") state.paymentMethods.push(item);
  else state.paymentMethods[Number(index)] = item;
  savePayments();
  event.currentTarget.reset();
  renderAll();
  notify("Metode pembayaran disimpan.");
});

els.paymentMethodForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    els.paymentMethodForm.elements.index.value = "";
  });
});

els.adminProductList.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const product = findProduct(editId);
    if (!product) return;
    els.productForm.elements.id.value = product.id;
    els.productForm.elements.title.value = product.title;
    els.productForm.elements.category.value = product.category;
    els.productForm.elements.price.value = product.price;
    els.productForm.elements.discount.value = product.discount;
    els.productForm.elements.stock.value = product.stock;
    els.productForm.elements.material.value = product.material;
    els.productForm.elements.color.value = product.color;
    els.productForm.elements.weight.value = product.weight;
    els.productForm.elements.description.value = product.description;
    renderVariantRows(product.variants || []);
    els.productSubmit.textContent = "Simpan Perubahan";
    activateAdminSection("products");
  }

  if (deleteId) {
    state.products = state.products.filter((entry) => entry.id !== deleteId);
    state.cart = state.cart.filter((entry) => entry.id !== deleteId);
    saveProducts();
    saveCart();
    renderAll();
    notify("Produk berhasil dihapus.");
  }
});

els.clearOrders.addEventListener("click", () => {
  state.orders = [];
  saveOrders();
  renderAdmin();
  notify("Notif pesanan dibersihkan.");
});

[els.orderFilterDate, els.orderFilterMonth, els.orderFilterYear].forEach((filter) => {
  filter?.addEventListener("change", () => renderAdmin());
});

function setFlashClockContent(status, values = []) {
  if (!els.flashClock) return;
  els.flashClock.classList.toggle("flash-timer-status", Boolean(status));
  if (status) {
    els.flashClock.textContent = status;
    return;
  }
  els.flashClock.innerHTML = values
    .map((item, index) => item.type === "number"
      ? `<b>${item.value}</b>`
      : `<span>${item.value}</span>`)
    .join("");
}

function runClock() {
  if (!els.flashClock) return;
  const now = new Date();
  const homeSettings = { ...DEFAULT_HOME_SETTINGS, ...read(HOME_SETTINGS_KEY, state.homeSettings || DEFAULT_HOME_SETTINGS) };
  const start = homeSettings.flashStartDate ? new Date(`${homeSettings.flashStartDate}T00:00:00`) : null;
  const periodEnd = homeSettings.flashEndDate ? new Date(`${homeSettings.flashEndDate}T23:59:59.999`) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) {
    setFlashClockContent("Belum Mulai");
    return;
  }

  if (periodEnd && !Number.isNaN(periodEnd.getTime()) && now > periodEnd) {
    setFlashClockContent("Berakhir");
    return;
  }

  const end = periodEnd && !Number.isNaN(periodEnd.getTime()) ? periodEnd : new Date();
  if (!periodEnd || Number.isNaN(periodEnd.getTime())) end.setHours(23, 59, 59, 999);

  const diff = Math.max(0, end - now);
  const totalHours = Math.floor(diff / 3600000);

  if (diff > 86400000) {
    const days = String(Math.floor(diff / 86400000)).padStart(2, "0");
    const hours = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0");
    setFlashClockContent("", [
      { type: "number", value: days },
      { type: "label", value: "Hari" },
      { type: "label", value: ":" },
      { type: "number", value: hours },
      { type: "label", value: "Jam" }
    ]);
    return;
  }

  const hours = String(totalHours).padStart(2, "0");
  const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
  setFlashClockContent("", [
    { type: "number", value: hours },
    { type: "label", value: ":" },
    { type: "number", value: minutes },
    { type: "label", value: ":" },
    { type: "number", value: seconds }
  ]);
}

els.searchInput.value = state.search;
const buyerEmail = localStorage.getItem(BUYER_EMAIL_KEY);
if (buyerEmail && els.buyerLoginOpen) {
  const accountLabel = els.buyerLoginOpen.querySelector(".nav-label");
  if (accountLabel) accountLabel.textContent = "Akun Saya";
}
applyTheme(localStorage.getItem(THEME_KEY));
renderVariantRows([]);
renderSelectOptions();
renderAll();
runClock();
setInterval(runClock, 1000);
// Promo Home follows the latest product/banner upload and is not overwritten by static slides.

window.addEventListener("storage", (event) => {
  if (event.key === ORDERS_KEY) {
    state.orders = read(ORDERS_KEY, []);
    renderAdmin();
    renderOrderFilters();
  }
  if (event.key === PRODUCTS_KEY) {
    state.products = loadProducts();
    renderAll();
  }
  if (event.key === PROMO_KEY || event.key === HOME_SETTINGS_KEY) {
    state.promo = read(PROMO_KEY, state.promo || DEFAULT_PROMO);
    state.homeSettings = read(HOME_SETTINGS_KEY, state.homeSettings || DEFAULT_HOME_SETTINGS);
    renderAll();
  }
});

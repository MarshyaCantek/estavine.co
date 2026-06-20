/* =========================================================
   Estavine — script.js
   Fitur: render produk, filter kategori, cart drawer,
          checkbox & qty, checkout otomatis ke WhatsApp.
   ========================================================= */

// ============ KONFIGURASI ============
const WHATSAPP_NUMBER = "6285856814316"; // ganti dengan nomor toko (format internasional, tanpa +)

// ============ DATA PRODUK ============
// Untuk mengganti gambar produk:
//   1. Taruh file gambar di folder, contoh: assets/cardigan.jpg
//   2. Ubah field `image` di bawah jadi: image: "assets/cardigan.jpg"
//   3. Jika `image` kosong (""), emoji di field `emoji` akan ditampilkan.
const PRODUCTS = [
  { id: 1, name: "Keychain Kelinci",  category: "Rajutan",   price: 30000, oldPrice: 35000,   badge: "Baru", emoji: "🧶", image: "assets/amiguruirabbit.jpg" },
  { id: 2, name: "Keychain Gurita",     category: "Rajutan",       price: 15000, oldPrice: 17000, badge: "null", emoji: "💐", image: "assets/gurita.jpg" },
  { id: 3, name: "Keychain Gurita Pita",    category: "Rajutan", price: 15000,  oldPrice: 17000,   badge: "null",   emoji: "💐", image: "assets/gantungan-gurita.jpg" },
  { id: 4, name: "Keychain Pita", category: "Rajutan",    price: 10000, oldPrice: 13000,   badge: "Baru", emoji: "🧸", image: "assets/keychain-pita.jpg" },
  { id: 5, name: "Keychain Totoro",     category: "Rajutan", price: 25000,  oldPrice: 30000,   badge: "Bestseller",   emoji: "🎀", image: "assets/gelang-1.jpg" },
  { id: 6, name: "Keychain Kucing",     category: "Rajutan",   price: 15000,  oldPrice: 20000, badge: "null", emoji: "🧤", image: "assets/kucing.jpg" },
  { id: 7, name: "Jepitan Emoji",        category: "Rajutan",   price: 10000, oldPrice: 15000,   badge: "null",   emoji: "👒", image: "assets/jepitan-emoji.jpg" },
];

// ============ STATE ============
let activeFilter = "Semua";
let cart = JSON.parse(localStorage.getItem("estavine_cart") || "[]");
// cart item: { id, name, price, emoji, image, qty, selected }

// ============ DOM ============
const $ = (sel) => document.querySelector(sel);
const grid       = $("#productsGrid");
const filterTabs = $("#filterTabs");
const catGrid    = document.querySelectorAll(".cat-card");
const cartDrawer = $("#cartDrawer");
const cartOverlay= $("#cartOverlay");
const cartBody   = $("#cartBody");
const cartTotal  = $("#cartTotal");
const cartCount  = $("#cartCount");
const fabCount   = $("#fabCount");
const checkAll   = $("#checkAll");

// ============ UTIL ============
const formatRp = (n) => "Rp " + Number(n).toLocaleString("id-ID");
const saveCart = () => localStorage.setItem("estavine_cart", JSON.stringify(cart));

// ============ RENDER PRODUK ============
function renderProducts() {
  const list = activeFilter === "Semua"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeFilter);

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-light);padding:2rem">Belum ada produk untuk kategori ini.</p>`;
    return;
  }

  grid.innerHTML = list.map((p) => {
    const visual = p.image
      ? `<img src="${p.image}" alt="${p.name}" />`
      : p.emoji;
    const badge = p.badge
      ? `<span class="product-badge ${p.badge.toLowerCase() === "sale" ? "sale" : ""}">${p.badge}</span>`
      : "";
    const inCart = cart.find((c) => c.id === p.id);
    return `
      <article class="product-card">
        <div class="product-img">
          ${visual}
          ${badge}
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-price-row">
            <div>
              <span class="product-price">${formatRp(p.price)}</span>
              ${p.oldPrice ? `<span class="product-price-old">${formatRp(p.oldPrice)}</span>` : ""}
            </div>
            <button class="product-add ${inCart ? "added" : ""}" data-add="${p.id}" aria-label="Tambah ke keranjang">
              ${inCart ? "✓" : "+"}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// ============ FILTER ============
function setFilter(value) {
  activeFilter = value;

  // sync tabs
  filterTabs.querySelectorAll(".filter-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.filter === value);
  });
  // sync category cards
  catGrid.forEach((c) => {
    c.classList.toggle("is-active", c.dataset.cat === value);
  });

  renderProducts();
}

filterTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  setFilter(tab.dataset.filter);
});

catGrid.forEach((card) => {
  card.addEventListener("click", () => {
    setFilter(card.dataset.cat);
    document.getElementById("produk").scrollIntoView({ behavior: "smooth" });
  });
});

// ============ ADD TO CART ============
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  const id = Number(btn.dataset.add);
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return;

  const existing = cart.find((c) => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      image: product.image,
      qty: 1,
      selected: true,
    });
  }
  saveCart();
  renderProducts();
  renderCart();
  openCart();
});

// ============ RENDER CART ============
function renderCart() {
  if (cart.length === 0) {
    cartBody.innerHTML = `<p class="cart-empty">Keranjang masih kosong.</p>`;
  } else {
    cartBody.innerHTML = cart.map((c) => {
      const visual = c.image
        ? `<img src="${c.image}" alt="${c.name}" />`
        : c.emoji;
      return `
        <div class="cart-item" data-id="${c.id}">
          <input type="checkbox" data-check="${c.id}" ${c.selected ? "checked" : ""} />
          <div class="cart-item-thumb">${visual}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${c.name}</div>
            <div class="cart-item-price">${formatRp(c.price * c.qty)}</div>
            <div class="cart-item-qty">
              <button data-qty="dec" data-id="${c.id}">−</button>
              <span>${c.qty}</span>
              <button data-qty="inc" data-id="${c.id}">+</button>
            </div>
          </div>
          <button class="cart-item-del" data-del="${c.id}" aria-label="Hapus">🗑</button>
        </div>
      `;
    }).join("");
  }

  // total terpilih
  const total = cart
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.price * c.qty, 0);
  cartTotal.textContent = formatRp(total);

  // counters
  const count = cart.reduce((s, c) => s + c.qty, 0);
  cartCount.textContent = count;
  fabCount.textContent = count;

  // check-all state
  checkAll.checked = cart.length > 0 && cart.every((c) => c.selected);
}

// cart item interactions
cartBody.addEventListener("click", (e) => {
  const del = e.target.closest("[data-del]");
  const qty = e.target.closest("[data-qty]");
  if (del) {
    cart = cart.filter((c) => c.id !== Number(del.dataset.del));
    saveCart(); renderCart(); renderProducts();
    return;
  }
  if (qty) {
    const id = Number(qty.dataset.id);
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    if (qty.dataset.qty === "inc") item.qty += 1;
    else item.qty = Math.max(1, item.qty - 1);
    saveCart(); renderCart();
  }
});

cartBody.addEventListener("change", (e) => {
  const chk = e.target.closest("[data-check]");
  if (!chk) return;
  const item = cart.find((c) => c.id === Number(chk.dataset.check));
  if (item) item.selected = chk.checked;
  saveCart(); renderCart();
});

checkAll.addEventListener("change", () => {
  cart.forEach((c) => (c.selected = checkAll.checked));
  saveCart(); renderCart();
});

$("#clearCartBtn").addEventListener("click", () => {
  if (cart.length === 0) return;
  if (confirm("Kosongkan seluruh keranjang?")) {
    cart = [];
    saveCart(); renderCart(); renderProducts();
  }
});

// ============ CART DRAWER OPEN/CLOSE ============
function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}
$("#openCartBtn").addEventListener("click", openCart);
$("#fabCart").addEventListener("click", openCart);
$("#closeCartBtn").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

// ============ CHECKOUT ke WHATSAPP ============
$("#checkoutBtn").addEventListener("click", () => {
  const name = $("#custName").value.trim();
  const addr = $("#custAddr").value.trim();
  const selected = cart.filter((c) => c.selected);

  if (selected.length === 0) {
    alert("Pilih dulu produk yang ingin dibeli (centang di kotak sebelah produk).");
    return;
  }
  if (!name) { alert("Mohon isi nama kamu."); return; }
  if (!addr) { alert("Mohon isi alamat pengiriman."); return; }

  const lines = selected.map(
    (c, i) => `${i + 1}. ${c.name} (${c.qty}x) - ${formatRp(c.price * c.qty)}`
  );
  const total = selected.reduce((s, c) => s + c.price * c.qty, 0);

  const msg =
`Halo kak,
Saya ingin pesan produk berikut:

Nama: ${name}
Alamat: ${addr}

Pesanan:
${lines.join("\n")}

Total: ${formatRp(total)}

Mohon info ketersediaan & ongkir ya kak. Terima kasih!`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
});

// ============ INIT ============
renderProducts();
renderCart();

// Active Navbar
const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach(link => {
  link.addEventListener("click", function() {
    navLinks.forEach(item => item.classList.remove("active"));
    this.classList.add("active");
  });
});
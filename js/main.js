/* =========================================================
   MAIN.JS — điều hướng, icon minh họa, render danh sách sản phẩm
   ========================================================= */

/* ---------- Icon minh họa sản phẩm (SVG line-art, không cần ảnh thật) ---------- */
function productIcon(type, size){
  size = size || 64;
  const stroke = "currentColor";
  const icons = {
    hose: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round">
      <path d="M8 20c6-8 12 8 18 0s12 8 18 0 12 8 12 0" />
      <path d="M8 44c6-8 12 8 18 0s12 8 18 0 12 8 12 0" opacity=".45"/>
      <circle cx="8" cy="20" r="3" fill="${stroke}" stroke="none"/>
      <circle cx="56" cy="20" r="3" fill="${stroke}" stroke="none"/>
    </svg>`,
    hex: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round">
      <path d="M22 10h20l14 22-14 22H22L8 32z"/>
      <circle cx="32" cy="32" r="8"/>
    </svg>`,
    flange: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3">
      <circle cx="32" cy="32" r="22"/>
      <circle cx="32" cy="32" r="8"/>
      <circle cx="32" cy="12" r="2.5" fill="${stroke}" stroke="none"/>
      <circle cx="32" cy="52" r="2.5" fill="${stroke}" stroke="none"/>
      <circle cx="12" cy="32" r="2.5" fill="${stroke}" stroke="none"/>
      <circle cx="52" cy="32" r="2.5" fill="${stroke}" stroke="none"/>
    </svg>`,
    quick: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round">
      <rect x="6" y="24" width="20" height="16" rx="3"/>
      <path d="M26 28h10a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H26"/>
      <rect x="40" y="20" width="18" height="24" rx="3"/>
    </svg>`,
    tee: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round">
      <path d="M8 32h48"/>
      <path d="M32 32v22"/>
      <circle cx="8" cy="32" r="3" fill="${stroke}" stroke="none"/>
      <circle cx="56" cy="32" r="3" fill="${stroke}" stroke="none"/>
      <circle cx="32" cy="54" r="3" fill="${stroke}" stroke="none"/>
    </svg>`,
    elbow: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round">
      <path d="M14 12v24a14 14 0 0 0 14 14h22"/>
      <circle cx="14" cy="12" r="3" fill="${stroke}" stroke="none"/>
      <circle cx="50" cy="50" r="3" fill="${stroke}" stroke="none"/>
    </svg>`,
    union: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3">
      <rect x="6" y="26" width="16" height="12" rx="2"/>
      <rect x="42" y="26" width="16" height="12" rx="2"/>
      <path d="M22 32h20" stroke-dasharray="3 4"/>
      <circle cx="32" cy="32" r="6"/>
    </svg>`,
    cap: `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round">
      <path d="M14 44V26a18 18 0 0 1 36 0v18"/>
      <path d="M10 44h44"/>
    </svg>`
  };
  return icons[type] || icons.hex;
}

/* ---------- Gửi dữ liệu (đơn hàng / liên hệ) lên Apps Script ---------- */
function postToAppsScript(payload){
  if(typeof APPS_SCRIPT_URL === "undefined" || !APPS_SCRIPT_URL) return Promise.resolve(false);
  return fetch(APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(() => true).catch(() => false);
}

/* ---------- Nav toggle (mobile) ---------- */
function initNav(){
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if(toggle && nav){
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      document.body.classList.toggle("nav-open", nav.classList.contains("open"));
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      document.body.classList.remove("nav-open");
    }));
  }
  // highlight active link
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[href]").forEach(a => {
    if(a.getAttribute("href") === path) a.classList.add("active");
  });
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();
}
document.addEventListener("DOMContentLoaded", initNav);

/* ---------- Thanh liên hệ nhanh (mobile) — gọi điện + Zalo ---------- */
function renderContactBar(){
  if(document.getElementById("mobile-contact-bar")) return;
  const phone = typeof CONTACT_PHONE !== "undefined" ? CONTACT_PHONE : "";
  const phoneDisplay = typeof CONTACT_PHONE_DISPLAY !== "undefined" ? CONTACT_PHONE_DISPLAY : phone;
  const zaloUrl = typeof ZALO_URL !== "undefined" ? ZALO_URL : "#";
  if(!phone) return;

  const bar = document.createElement("div");
  bar.className = "mobile-contact-bar";
  bar.id = "mobile-contact-bar";
  bar.innerHTML = `
    <a href="tel:${phone}" class="contact-bar-btn contact-bar-call" aria-label="Gọi điện cho cửa hàng, số ${phoneDisplay}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/></svg>
      <span>Gọi điện</span>
    </a>
    <a href="${zaloUrl}" target="_blank" rel="noopener" class="contact-bar-btn contact-bar-zalo" aria-label="Nhắn tin Zalo cho cửa hàng">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
      <span>Nhắn Zalo</span>
    </a>
  `;
  document.body.appendChild(bar);
}
document.addEventListener("DOMContentLoaded", renderContactBar);

/* ---------- Card sản phẩm dùng chung ---------- */
function productCardHTML(p){
  return `
    <div class="product-card" data-id="${p.id}" data-cat="${p.category}" data-name="${p.name.toLowerCase()}">
      <a href="san-pham-chi-tiet.html?id=${p.id}" class="product-thumb" style="color:var(--navy)">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
        ${productIcon(p.icon, 72)}
      </a>
      <div class="product-body">
        <span class="product-cat">${p.size}</span>
        <a href="san-pham-chi-tiet.html?id=${p.id}"><h3 class="product-title">${p.name}</h3></a>
        <p class="product-desc">${p.desc}</p>
        <div class="product-price">${formatVND(p.price)} <small>/ ${p.unit}</small></div>
        <div class="product-actions">
          <button class="btn btn-primary btn-add" data-id="${p.id}">Thêm vào giỏ</button>
          <a href="san-pham-chi-tiet.html?id=${p.id}" class="btn btn-outline">Chi tiết</a>
        </div>
      </div>
    </div>`;
}

function bindAddToCartButtons(root){
  (root || document).querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.id, 1);
      showToast("Đã thêm vào giỏ hàng ✓");
    });
  });
}

/* ---------- Trang chủ: danh mục nổi bật ---------- */
function renderCategoryCards(containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = CATEGORIES.map(c => `
    <div class="cat-card">
      <div class="cat-icon">${productIcon(c.icon, 34)}</div>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      <a href="san-pham.html?cat=${c.slug}" class="btn btn-outline btn-sm">Xem sản phẩm</a>
    </div>
  `).join("");
}

function renderFeaturedProducts(containerId, limit){
  const el = document.getElementById(containerId);
  if(!el) return;
  const list = PRODUCTS.filter(p => p.badge).slice(0, limit || 6);
  el.innerHTML = list.map(productCardHTML).join("");
  bindAddToCartButtons(el);
}

/* ---------- Trang danh sách sản phẩm với filter/tìm kiếm ---------- */
function initProductListing(){
  const grid = document.getElementById("product-grid");
  if(!grid) return;

  const params = new URLSearchParams(location.search);
  let activeCat = params.get("cat") || "all";
  let query = "";

  const chipsWrap = document.getElementById("filter-chips");
  if(chipsWrap){
    const chips = [{ slug: "all", name: "Tất cả" }, ...CATEGORIES];
    chipsWrap.innerHTML = chips.map(c =>
      `<button class="chip ${c.slug === activeCat ? "active" : ""}" data-cat="${c.slug}">${c.name}</button>`
    ).join("");
    chipsWrap.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        activeCat = chip.dataset.cat;
        chipsWrap.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        render();
      });
    });
  }

  const searchInput = document.getElementById("search-input");
  if(searchInput){
    searchInput.addEventListener("input", () => {
      query = searchInput.value.trim().toLowerCase();
      render();
    });
  }

  function render(){
    const filtered = PRODUCTS.filter(p => {
      const matchCat = activeCat === "all" || p.category === activeCat;
      const matchQuery = !query || p.name.toLowerCase().includes(query) || p.size.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
    const countEl = document.getElementById("result-count");
    if(countEl) countEl.textContent = filtered.length;

    if(filtered.length === 0){
      grid.innerHTML = "";
      document.getElementById("empty-state").style.display = "block";
    }else{
      document.getElementById("empty-state").style.display = "none";
      grid.innerHTML = filtered.map(productCardHTML).join("");
      bindAddToCartButtons(grid);
    }
  }
  render();
  window.addEventListener("products-updated", render);
}
document.addEventListener("DOMContentLoaded", initProductListing);

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

/* Giống postToAppsScript nhưng ĐỌC được phản hồi JSON — dùng cho chat AI
   (cần đợi câu trả lời, không thể "bắn rồi quên" như đơn hàng/liên hệ) */
function postToAppsScriptJSON(payload){
  if(typeof APPS_SCRIPT_URL === "undefined" || !APPS_SCRIPT_URL) return Promise.resolve(null);
  return fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(res => res.json()).catch(() => null);
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

  if(!document.getElementById("desktop-contact-fab")){
    const fab = document.createElement("div");
    fab.className = "desktop-fab";
    fab.id = "desktop-contact-fab";
    fab.innerHTML = `
      <a href="tel:${phone}" class="fab-btn fab-call" aria-label="Gọi điện cho cửa hàng, số ${phoneDisplay}">
        <span class="fab-label">Gọi điện</span>
        <span class="fab-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.32 1.85.55 2.81.68A2 2 0 0 1 22 16.92z"/></svg></span>
      </a>
      <a href="${zaloUrl}" target="_blank" rel="noopener" class="fab-btn fab-zalo" aria-label="Nhắn tin Zalo cho cửa hàng">
        <span class="fab-label">Nhắn Zalo</span>
        <span class="fab-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
      </a>
    `;
    document.body.appendChild(fab);
  }
}
document.addEventListener("DOMContentLoaded", renderContactBar);

/* ---------- Khung chat trợ lý AI ---------- */
function getAiChatSessionId_(){
  let id = sessionStorage.getItem("mh_chat_session");
  if(!id){
    id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ("s-" + Date.now() + "-" + Math.random().toString(16).slice(2));
    sessionStorage.setItem("mh_chat_session", id);
  }
  return id;
}

// Icon robot — cố tình khác hẳn icon bong bóng chat (Zalo) để khách nhận ra
// ngay đây là chat với AI, không phải nhắn tin với người thật
const AI_ROBOT_ICON_ = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 8V4"/>
  <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none"/>
  <rect x="4" y="8" width="16" height="12" rx="3"/>
  <circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none"/>
  <circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none"/>
  <path d="M9 17.2h6"/>
  <path d="M2 13h2"/>
  <path d="M20 13h2"/>
</svg>`;

function renderAIChatWidget(){
  if(document.getElementById("ai-chat-widget")) return;

  const zaloUrl = typeof ZALO_URL !== "undefined" ? ZALO_URL : "#";
  const brand = typeof BRAND_SHORT_NAME !== "undefined" ? BRAND_SHORT_NAME : "Cửa Hàng Minh Hiền";

  const wrap = document.createElement("div");
  wrap.id = "ai-chat-widget";
  wrap.innerHTML = `
    <div class="ai-chat-backdrop" id="ai-chat-backdrop"></div>
    <button class="ai-chat-bubble" id="ai-chat-bubble" aria-label="Mở khung chat trợ lý AI, trả lời tự động, không phải người thật">
      ${AI_ROBOT_ICON_}
      <span class="ai-chat-badge">AI</span>
    </button>
    <div class="ai-chat-panel" id="ai-chat-panel" role="dialog" aria-label="Khung chat trợ lý AI">
      <div class="ai-chat-header">
        <div>
          <strong>Trợ lý AI - ${brand}</strong>
          <span class="ai-chat-subtitle">Trả lời tự động, có thể chưa chính xác 100%</span>
        </div>
        <button class="ai-chat-close" id="ai-chat-close" aria-label="Đóng khung chat">✕</button>
      </div>
      <div class="ai-chat-messages" id="ai-chat-messages">
        <div class="ai-chat-msg ai-chat-msg-bot">Xin chào! Mình là trợ lý AI của cửa hàng. Bạn cần hỏi gì về ống thủy lực hoặc rắc co không?</div>
      </div>
      <div class="ai-chat-escalate-wrap">
        <button type="button" class="ai-chat-escalate-btn" id="ai-chat-escalate-btn">Tư vấn với chuyên viên kỹ thuật</button>
      </div>
      <form class="ai-chat-input-row" id="ai-chat-form">
        <input type="text" id="ai-chat-input" placeholder="Nhập câu hỏi..." autocomplete="off" aria-label="Nhập câu hỏi cho trợ lý AI">
        <button type="submit" aria-label="Gửi câu hỏi">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(wrap);

  // Nút desktop: gộp chung cột với Gọi điện / Nhắn Zalo (cùng khoảng cách, cùng kiểu)
  // thay vì để riêng lẻ ở góc màn hình như trước.
  const fabGroup = document.getElementById("desktop-contact-fab");
  let desktopBtn = null;
  if(fabGroup){
    desktopBtn = document.createElement("button");
    desktopBtn.type = "button";
    desktopBtn.className = "fab-btn fab-ai";
    desktopBtn.setAttribute("aria-label", "Mở khung chat trợ lý AI, trả lời tự động, không phải người thật");
    desktopBtn.innerHTML = `
      <span class="fab-label">Chat AI</span>
      <span class="fab-icon">${AI_ROBOT_ICON_}</span>
      <span class="fab-ai-badge">AI</span>
    `;
    fabGroup.appendChild(desktopBtn);
  }

  const bubble = document.getElementById("ai-chat-bubble");
  const closeBtn = document.getElementById("ai-chat-close");
  const backdrop = document.getElementById("ai-chat-backdrop");
  const messagesEl = document.getElementById("ai-chat-messages");
  const form = document.getElementById("ai-chat-form");
  const input = document.getElementById("ai-chat-input");
  const escalateBtn = document.getElementById("ai-chat-escalate-btn");

  function openChat(){ document.body.classList.add("ai-chat-open"); setTimeout(() => input.focus(), 50); }
  function closeChat(){ document.body.classList.remove("ai-chat-open"); }
  function toggleChat(){
    document.body.classList.contains("ai-chat-open") ? closeChat() : openChat();
  }
  bubble.addEventListener("click", toggleChat);
  if(desktopBtn) desktopBtn.addEventListener("click", toggleChat);
  closeBtn.addEventListener("click", closeChat);
  backdrop.addEventListener("click", closeChat);

  let lastUserMessage = "";

  function addMessage(text, who){
    const div = document.createElement("div");
    div.className = "ai-chat-msg ai-chat-msg-" + who;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    lastUserMessage = text;
    addMessage(text, "user");
    input.value = "";
    input.disabled = true;
    const typing = addMessage("Đang trả lời...", "bot");
    typing.classList.add("ai-chat-msg-typing");

    postToAppsScriptJSON({ type: "chat", sessionId: getAiChatSessionId_(), message: text })
      .then(res => {
        typing.remove();
        input.disabled = false;
        input.focus();
        if(res && res.success && res.reply){
          addMessage(res.reply, "bot");
        }else{
          addMessage("Xin lỗi, hiện mình chưa trả lời được câu hỏi này. Bạn bấm 'Tư vấn với chuyên viên kỹ thuật' bên dưới giúp mình nhé.", "bot");
        }
      })
      .catch(() => {
        typing.remove();
        input.disabled = false;
        addMessage("Xin lỗi, hiện mình chưa trả lời được câu hỏi này. Bạn bấm 'Tư vấn với chuyên viên kỹ thuật' bên dưới giúp mình nhé.", "bot");
      });
  });

  escalateBtn.addEventListener("click", function(){
    postToAppsScript({ type: "chat_escalate", sessionId: getAiChatSessionId_(), lastMessage: lastUserMessage });
    addMessage("Mình đã mở Zalo giúp bạn, bạn nhắn tiếp cho nhân viên nhé!", "bot");
    window.open(zaloUrl, "_blank");
  });
}
document.addEventListener("DOMContentLoaded", renderAIChatWidget);

/* ---------- Card sản phẩm dùng chung ---------- */
function productCardHTML(p){
  const stock = getProductStock(p);
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock <= 5;
  const addBtn = outOfStock
    ? `<span class="stock-out-badge">Tạm hết hàng</span>`
    : `<button class="btn btn-primary btn-add" data-id="${p.id}">Thêm vào giỏ</button>`;
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
        ${lowStock ? `<div class="stock-low">Chỉ còn ${stock} sản phẩm</div>` : ""}
        <div class="product-actions">
          ${addBtn}
          <a href="san-pham-chi-tiet.html?id=${p.id}" class="btn btn-outline">Chi tiết</a>
        </div>
      </div>
    </div>`;
}

function bindAddToCartButtons(root){
  (root || document).querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const result = addToCart(btn.dataset.id, 1);
      if(!result.added){
        showToast(`Sản phẩm đã hết hàng`);
      }else if(result.capped){
        showToast(`Chỉ còn ${result.stock} sản phẩm — đã thêm tối đa vào giỏ`);
      }else{
        showToast("Đã thêm vào giỏ hàng ✓");
      }
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
  // Tới từ ô tìm kiếm trang chủ (san-pham.html?search=...) thì lấy sẵn từ khóa đó
  let query = params.get("search") || "";

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
    if(query) searchInput.value = query;
    searchInput.addEventListener("input", () => {
      query = searchInput.value.trim();
      render();
    });
  }

  function render(){
    // Có từ khóa: dùng kết quả tìm mờ (đã xếp theo độ liên quan) làm danh sách gốc.
    // Không có từ khóa: giữ nguyên toàn bộ PRODUCTS như trước.
    let base = PRODUCTS;
    if(query){
      base = typeof fuzzySearchProducts === "function"
        ? fuzzySearchProducts(query)
        : PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.size.toLowerCase().includes(query.toLowerCase()));
    }
    const filtered = base.filter(p => activeCat === "all" || p.category === activeCat);
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

  // Tới từ thanh tìm kiếm trang chủ: cuộn tới đúng thanh tìm kiếm (đã tự điền + tự lọc ở trên)
  if(query){
    const toolbar = document.querySelector(".product-toolbar");
    if(toolbar) setTimeout(() => toolbar.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
}
document.addEventListener("DOMContentLoaded", initProductListing);

/* ---------- Thanh tìm kiếm cố định (sticky) trên trang sản phẩm ---------- */
function initStickyProductToolbar(){
  const header = document.querySelector(".site-header");
  const toolbar = document.querySelector(".product-toolbar");
  const sentinel = document.getElementById("toolbar-sentinel");
  if(!header || !toolbar) return;

  function applyOffset(){
    const h = header.offsetHeight;
    toolbar.style.top = h + "px";
    toolbar.style.scrollMarginTop = h + "px";
  }
  applyOffset();
  window.addEventListener("load", applyOffset);
  window.addEventListener("resize", applyOffset);

  if(sentinel && "IntersectionObserver" in window){
    let observer;
    function setupObserver(){
      if(observer) observer.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => toolbar.classList.toggle("is-stuck", !entry.isIntersecting),
        { threshold: 0, rootMargin: `-${header.offsetHeight + 1}px 0px 0px 0px` }
      );
      observer.observe(sentinel);
    }
    setupObserver();
    // Header có thể đổi chiều cao khi resize (topbar xuống dòng) — dựng lại observer cho đúng
    window.addEventListener("resize", setupObserver);
  }
}
document.addEventListener("DOMContentLoaded", initStickyProductToolbar);

/* ---------- Thanh tìm kiếm ở trang chủ — chuyển sang trang sản phẩm kèm từ khóa ---------- */
function initHomeSearchRedirect(){
  const form = document.getElementById("home-search-form");
  if(!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("home-search-input");
    const q = input.value.trim();
    if(!q) return;
    location.href = "san-pham.html?search=" + encodeURIComponent(q);
  });
}
document.addEventListener("DOMContentLoaded", initHomeSearchRedirect);

/* ---------- Thẻ bài viết "Kiến thức thủy lực" (trang chủ + trang danh sách) ---------- */
const ARTICLE_PLACEHOLDER_ICON_ = `<svg width="40" height="40" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <path d="M8 20c6-8 12 8 18 0s12 8 18 0 12 8 12 0" opacity=".9"/>
  <path d="M8 44c6-8 12 8 18 0s12 8 18 0 12 8 12 0" opacity=".5"/>
  <circle cx="8" cy="20" r="3" fill="currentColor" stroke="none"/>
  <circle cx="56" cy="20" r="3" fill="currentColor" stroke="none"/>
</svg>`;

function articleCardHTML(a){
  const thumb = a.image
    ? `<img src="${a.image}" alt="${a.title}">`
    : ARTICLE_PLACEHOLDER_ICON_;
  return `
    <a href="${a.url}" class="article-card">
      <div class="article-card-thumb">${thumb}</div>
      <div class="article-card-body">
        <span class="article-card-date">${a.dateDisplay}</span>
        <h3 class="article-card-title">${a.title}</h3>
        <p class="article-card-excerpt">${a.description}</p>
        <span class="article-card-more">Đọc tiếp &rarr;</span>
      </div>
    </a>`;
}

function renderArticleCards(containerId, limit){
  const el = document.getElementById(containerId);
  if(!el || typeof ARTICLES === "undefined") return;
  const list = ARTICLES.slice(0, limit || ARTICLES.length);
  el.innerHTML = list.length
    ? list.map(articleCardHTML).join("")
    : `<div class="article-empty">Chưa có bài viết nào.</div>`;
}

/* ---------- Trang danh sách bài viết (bai-viet.html) — phân trang phía trình duyệt ---------- */
function initArticleListing(){
  const grid = document.getElementById("article-list-grid");
  if(!grid || typeof ARTICLES === "undefined") return;

  const PAGE_SIZE = 9;
  const pager = document.getElementById("article-pagination");
  let currentPage = 1;

  function totalPages(){
    return Math.max(1, Math.ceil(ARTICLES.length / PAGE_SIZE));
  }

  function renderPage(page){
    const pages = totalPages();
    currentPage = Math.min(Math.max(1, page), pages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const list = ARTICLES.slice(start, start + PAGE_SIZE);
    grid.innerHTML = list.length
      ? list.map(articleCardHTML).join("")
      : `<div class="article-empty">Chưa có bài viết nào.</div>`;
    renderPager(pages);
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderPager(pages){
    if(!pager) return;
    if(pages <= 1){ pager.innerHTML = ""; return; }
    let html = `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>&laquo; Trước</button>`;
    for(let p = 1; p <= pages; p++){
      html += `<button type="button" data-page="${p}" class="${p === currentPage ? "active" : ""}">${p}</button>`;
    }
    html += `<button type="button" data-page="${currentPage + 1}" ${currentPage === pages ? "disabled" : ""}>Sau &raquo;</button>`;
    pager.innerHTML = html;
    pager.querySelectorAll("button[data-page]").forEach(btn => {
      btn.addEventListener("click", () => renderPage(parseInt(btn.dataset.page, 10)));
    });
  }

  renderPage(1);
}
document.addEventListener("DOMContentLoaded", initArticleListing);

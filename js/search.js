/* =========================================================
   SEARCH.JS — Tìm kiếm sản phẩm thông minh (fuzzy search)
   Dùng Fuse.js (nhúng qua CDN ở index.html và san-pham.html), chạy
   hoàn toàn trên trình duyệt, không cần backend.

   Nguồn dữ liệu: dùng trực tiếp mảng PRODUCTS đang có (js/data.js) —
   đây đã là nguồn dữ liệu sản phẩm dùng chung cho toàn site và được
   đồng bộ tự động từ Google Sheet (xem refreshProductsFromSheet trong
   data.js). Cố tình KHÔNG tách ra file products.json riêng vì sẽ tạo
   thêm một nguồn dữ liệu tĩnh dễ bị lệch với Sheet — mọi nơi khác
   trên site đều lấy dữ liệu sống từ PRODUCTS, nên tìm kiếm cũng vậy
   để sản phẩm mới thêm trong Sheet lập tức tìm được luôn.
   ========================================================= */

/* ---------- Chuẩn hoá tiếng Việt: bỏ dấu + chữ thường ---------- */
function normalizeVN(str){
  return String(str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

let __fuseIndex = null;

function buildFuseIndex(){
  if(typeof Fuse === "undefined" || typeof PRODUCTS === "undefined") return null;
  const catName = function(slug){
    const c = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find(c => c.slug === slug);
    return c ? c.name : slug;
  };
  const searchData = PRODUCTS.map(p => {
    const specsText = Object.values(p.specs || {}).join(" ");
    return {
      __product: p,
      _searchName: normalizeVN(p.name),
      _searchCategory: normalizeVN(catName(p.category)),
      _searchSpecs: normalizeVN(specsText),
      _searchSize: normalizeVN(p.size),
      _searchDesc: normalizeVN(p.desc)
    };
  });
  return new Fuse(searchData, {
    keys: [
      { name: "_searchName", weight: 0.4 },
      { name: "_searchCategory", weight: 0.15 },
      { name: "_searchSpecs", weight: 0.2 },
      { name: "_searchSize", weight: 0.15 },
      { name: "_searchDesc", weight: 0.1 }
    ],
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 2
  });
}

// Trả về mảng sản phẩm (đã xếp theo độ liên quan), rỗng nếu không khớp
function fuzzySearchProducts(query){
  const q = normalizeVN(query);
  if(!q) return typeof PRODUCTS !== "undefined" ? PRODUCTS.slice() : [];

  if(!__fuseIndex) __fuseIndex = buildFuseIndex();
  if(!__fuseIndex){
    // Fuse chưa load được (lỗi mạng CDN) — tự lùi về so khớp chuỗi con đơn giản
    return (typeof PRODUCTS !== "undefined" ? PRODUCTS : []).filter(p =>
      normalizeVN(p.name).includes(q) || normalizeVN(p.size).includes(q)
    );
  }
  return __fuseIndex.search(q).map(r => r.item.__product);
}

// Sản phẩm đổi mới từ Sheet thì build lại index ở lần tìm kế tiếp
window.addEventListener("products-updated", () => { __fuseIndex = null; });

/* ---------- Dropdown gợi ý real-time ----------
   Dùng chung cho mọi ô tìm kiếm trên site (trang sản phẩm, trang chủ...).
   config:
   - inputId: id của ô input
   - wrapperSelector: selector của khối bao quanh input để neo dropdown
   - onViewAll(query): tuỳ chọn — hành động khi bấm "Xem tất cả kết quả"
     (mặc định: cuộn tới #product-grid, dùng cho trang sản phẩm) */
function initSearchDropdown(config){
  const input = document.getElementById(config.inputId);
  if(!input) return;
  const box = input.closest(config.wrapperSelector);
  if(!box) return;

  const dropdown = document.createElement("div");
  dropdown.className = "search-dropdown";
  dropdown.hidden = true;
  box.appendChild(dropdown);

  const catName = function(slug){
    const c = (typeof CATEGORIES !== "undefined" ? CATEGORIES : []).find(c => c.slug === slug);
    return c ? c.name : slug;
  };

  let debounceTimer;
  const MAX_SHOWN = 8;

  function renderDropdown(query){
    const q = query.trim();
    if(!q){ closeDropdown(); return; }

    const results = fuzzySearchProducts(q);
    if(!results.length){
      dropdown.innerHTML = `
        <div class="search-empty">
          Không tìm thấy sản phẩm phù hợp, thử từ khóa khác hoặc
          <a href="lien-he.html">Tư vấn với chuyên viên kỹ thuật</a>.
        </div>`;
      dropdown.hidden = false;
      return;
    }

    const shown = results.slice(0, MAX_SHOWN);
    dropdown.innerHTML = shown.map(p => `
      <a class="search-result-item" href="san-pham-chi-tiet.html?id=${p.id}">
        <span class="search-result-thumb">${typeof productIcon === "function" ? productIcon(p.icon, 26) : ""}</span>
        <span class="search-result-info">
          <span class="search-result-name">${p.name}</span>
          <span class="search-result-cat">${catName(p.category)} · ${p.size}</span>
        </span>
      </a>
    `).join("") + (results.length > MAX_SHOWN
      ? `<button type="button" class="search-view-all">Xem tất cả ${results.length} kết quả</button>`
      : "");
    dropdown.hidden = false;

    const viewAllBtn = dropdown.querySelector(".search-view-all");
    if(viewAllBtn){
      viewAllBtn.addEventListener("click", () => {
        closeDropdown();
        if(config.onViewAll){
          config.onViewAll(q);
        }else{
          const grid = document.getElementById("product-grid");
          if(grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  function closeDropdown(){ dropdown.hidden = true; }

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderDropdown(input.value), 250);
  });
  input.addEventListener("focus", () => {
    if(input.value.trim()) renderDropdown(input.value);
  });
  input.addEventListener("keydown", e => {
    if(e.key === "Escape") closeDropdown();
  });
  document.addEventListener("click", e => {
    if(!box.contains(e.target)) closeDropdown();
  });
}
document.addEventListener("DOMContentLoaded", () => {
  // Trang sản phẩm: dropdown neo vào .search-box, "Xem tất cả" cuộn tới lưới sản phẩm
  initSearchDropdown({ inputId: "search-input", wrapperSelector: ".search-box" });
  // Trang chủ: dropdown neo vào cả khối tìm kiếm, "Xem tất cả" chuyển sang trang sản phẩm
  initSearchDropdown({
    inputId: "home-search-input",
    wrapperSelector: ".home-search-box",
    onViewAll: q => { location.href = "san-pham.html?search=" + encodeURIComponent(q); }
  });
});

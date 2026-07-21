/* =========================================================
   GIỎ HÀNG — lưu trên trình duyệt (localStorage)
   Chưa có cổng thanh toán trực tuyến: khách xác nhận đơn qua
   Zalo / điện thoại / email ở trang thanh-toan.html
   ========================================================= */

const CART_KEY = "mh_cart_v1";

function getCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    return [];
  }
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadges();
}

// Tồn kho chưa xác định (sản phẩm cũ chưa có trường stock) coi như không giới hạn
function getProductStock(product){
  return (product && typeof product.stock === "number" && !isNaN(product.stock)) ? product.stock : Infinity;
}

// Trả về { added, capped, stock, qty } — capped=true nghĩa là số lượng đã bị
// chặn bớt lại đúng bằng tồn kho hiện có, để trang gọi hàm này hiện toast phù hợp.
function addToCart(id, qty){
  qty = Math.max(1, parseInt(qty) || 1);
  const product = findProduct(id);
  const stock = getProductStock(product);
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  const currentQty = existing ? existing.qty : 0;
  let desiredQty = currentQty + qty;
  let capped = false;
  if(desiredQty > stock){
    desiredQty = stock;
    capped = true;
  }
  if(desiredQty <= 0) return { added: false, capped: true, stock, qty: 0 };
  if(existing){
    existing.qty = desiredQty;
  }else{
    cart.push({ id, qty: desiredQty });
  }
  saveCart(cart);
  return { added: true, capped, stock, qty: desiredQty };
}

function updateCartQty(id, qty){
  qty = Math.max(1, parseInt(qty) || 1);
  const product = findProduct(id);
  const stock = getProductStock(product);
  let capped = false;
  if(qty > stock){
    qty = stock;
    capped = true;
  }
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if(item){
    item.qty = qty;
    saveCart(cart);
  }
  return { capped, stock, qty };
}

function removeFromCart(id){
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

function clearCart(){
  saveCart([]);
}

function cartCount(){
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartDetailed(){
  return getCart()
    .map(item => {
      const product = findProduct(item.id);
      if(!product) return null;
      return { product, qty: item.qty, lineTotal: product.price * item.qty };
    })
    .filter(Boolean);
}

function cartTotal(){
  return cartDetailed().reduce((sum, i) => sum + i.lineTotal, 0);
}

function updateCartBadges(){
  const count = cartCount();
  document.querySelectorAll(".cart-badge").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

/* =========================================================
   Chuyển khoản QR (VietQR) — dùng ở trang thanh toán
   ========================================================= */

// Mã đơn hàng ngắn gọn, không dấu, tối đa 20 ký tự — dùng làm nội dung chuyển khoản
// để đối chiếu đơn hàng nào đã thanh toán khi kiểm tra sao kê ngân hàng.
function generateOrderCode(){
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return ("DH" + ts + rand).slice(0, 20);
}

// Phí ship theo khu vực — mức cố định tạm thời (xem SHIPPING_FEES/SHIPPING_ZONES
// trong js/config.js). Sau này thay bằng API tính phí thật (GHN/GHTK) thì chỉ
// cần sửa hàm này, chỗ gọi nó ở thanh-toan.html không cần đổi gì.
function getShippingFee(zoneName){
  if(typeof SHIPPING_ZONES === "undefined" || typeof SHIPPING_FEES === "undefined") return 0;
  const zone = SHIPPING_ZONES.find(z => z.name === zoneName);
  if(!zone) return 0;
  return SHIPPING_FEES[zone.tier] || 0;
}

function buildVietQrUrl(amount, note){
  const bank = typeof VIETQR_BANK_CODE !== "undefined" ? VIETQR_BANK_CODE : "";
  const acc = typeof VIETQR_ACCOUNT_NO !== "undefined" ? VIETQR_ACCOUNT_NO : "";
  const name = typeof VIETQR_ACCOUNT_NAME !== "undefined" ? VIETQR_ACCOUNT_NAME : "";
  if(!bank || !acc) return "";
  return `https://img.vietqr.io/image/${bank}-${acc}-compact.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(note)}&accountName=${encodeURIComponent(name)}`;
}

function showToast(message){
  let toast = document.querySelector(".toast");
  if(!toast){
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

document.addEventListener("DOMContentLoaded", updateCartBadges);

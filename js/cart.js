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

function addToCart(id, qty){
  qty = Math.max(1, parseInt(qty) || 1);
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  if(existing){
    existing.qty += qty;
  }else{
    cart.push({ id, qty });
  }
  saveCart(cart);
}

function updateCartQty(id, qty){
  qty = Math.max(1, parseInt(qty) || 1);
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if(item){
    item.qty = qty;
    saveCart(cart);
  }
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

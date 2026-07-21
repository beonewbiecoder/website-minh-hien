/* =========================================================
   ĐĂNG NHẬP BẰNG GOOGLE (Firebase Authentication)
   Chỉ dùng để xác định danh tính khách — KHÔNG có database riêng,
   Google Sheet vẫn là nơi lưu đơn hàng duy nhất (xem js/config.js
   để điền FIREBASE_CONFIG, và google-apps-script/Code.gs để biết
   cách server xác thực lại token trước khi trả dữ liệu đơn hàng).

   Nếu FIREBASE_CONFIG chưa điền, mọi hàm ở đây tự tắt nhẹ nhàng —
   nút đăng nhập vẫn hiện nhưng báo "chưa cấu hình", trang không vỡ.
   ========================================================= */

let __authReady = false;
let __currentUser = null;
const __authListeners = [];

function isFirebaseConfigured(){
  return typeof FIREBASE_CONFIG !== "undefined" && !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId;
}

function initAuth_(){
  if(!isFirebaseConfigured()){
    __authReady = true;
    __authListeners.forEach(fn => fn(null));
    return;
  }
  if(typeof firebase === "undefined"){
    __authReady = true;
    return;
  }
  if(!firebase.apps || !firebase.apps.length){
    firebase.initializeApp(FIREBASE_CONFIG);
  }
  firebase.auth().onAuthStateChanged(user => {
    __currentUser = user;
    __authReady = true;
    __authListeners.forEach(fn => fn(user));
  });
}

// Đăng ký hàm callback(user) — gọi lại mỗi khi trạng thái đăng nhập đổi.
// Nếu trạng thái đã sẵn sàng từ trước, gọi ngay lập tức với giá trị hiện tại.
function onAuthChange(fn){
  __authListeners.push(fn);
  if(__authReady) fn(__currentUser);
}

function getCurrentUser(){ return __currentUser; }

function signInWithGoogle(){
  if(!isFirebaseConfigured()){
    showToast("Đăng nhập chưa được cấu hình");
    return Promise.reject(new Error("Firebase chưa cấu hình"));
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider).catch(err => {
    showToast("Đăng nhập thất bại, vui lòng thử lại");
    throw err;
  });
}

function signOutUser(){
  if(!isFirebaseConfigured()) return Promise.resolve();
  return firebase.auth().signOut();
}

// Token định danh để gửi lên Apps Script — server tự xác thực lại token này
// (không tin trực tiếp email do trình duyệt gửi lên) trước khi trả/huỷ đơn hàng.
function getCurrentIdToken(){
  if(!__currentUser) return Promise.resolve("");
  return __currentUser.getIdToken();
}

/* ---------- Nút tài khoản trên header (gắn ở mọi trang) ---------- */
const ACCOUNT_ICON_ = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

function renderAccountButton(){
  const slot = document.getElementById("account-slot");
  if(!slot) return;

  function paint(user){
    if(!isFirebaseConfigured()){
      slot.innerHTML = `<button type="button" class="icon-btn" id="account-btn" aria-label="Đăng nhập bằng Google" title="Đăng nhập (chưa cấu hình)">${ACCOUNT_ICON_}</button>`;
      document.getElementById("account-btn").addEventListener("click", () => showToast("Đăng nhập chưa được cấu hình"));
      return;
    }

    if(user){
      const initial = (user.displayName || user.email || "?").trim().charAt(0).toUpperCase();
      slot.innerHTML = `
        <div class="account-menu-wrap">
          <button type="button" class="account-avatar-btn" id="account-btn" aria-label="Tài khoản: ${user.displayName || user.email}">
            ${user.photoURL ? `<img src="${user.photoURL}" alt="">` : `<span>${initial}</span>`}
          </button>
          <div class="account-menu" id="account-menu">
            <div class="account-menu-name">${user.displayName || "Khách hàng"}</div>
            <div class="account-menu-email">${user.email || ""}</div>
            <a href="don-hang-cua-toi.html">Đơn hàng của tôi</a>
            <button type="button" id="account-signout">Đăng xuất</button>
          </div>
        </div>`;
      const btn = document.getElementById("account-btn");
      const menu = document.getElementById("account-menu");
      btn.addEventListener("click", () => menu.classList.toggle("open"));
      document.getElementById("account-signout").addEventListener("click", () => signOutUser());
      document.addEventListener("click", (e) => {
        if(!slot.contains(e.target)) menu.classList.remove("open");
      });
    }else{
      slot.innerHTML = `<button type="button" class="btn btn-outline btn-sm" id="account-btn">Đăng nhập Google</button>`;
      document.getElementById("account-btn").addEventListener("click", signInWithGoogle);
    }
  }

  onAuthChange(paint);
}

document.addEventListener("DOMContentLoaded", () => {
  initAuth_();
  renderAccountButton();
});

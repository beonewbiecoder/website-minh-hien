/* =========================================================
   ĐĂNG NHẬP (Firebase Authentication) — Google + Email/mật khẩu
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

// Trang nằm trong thư mục con (vd bai-viet/bai-x.html) cần "../" để trỏ đúng
// về trang gốc — các trang ở gốc thì để trống.
function sitePrefix_(){
  return location.pathname.indexOf("/bai-viet/") !== -1 ? "../" : "";
}

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

function signInWithEmail(email, password){
  if(!isFirebaseConfigured()) return Promise.reject(new Error("Firebase chưa cấu hình"));
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

function registerWithEmail(email, password, displayName){
  if(!isFirebaseConfigured()) return Promise.reject(new Error("Firebase chưa cấu hình"));
  return firebase.auth().createUserWithEmailAndPassword(email, password).then(cred => {
    if(displayName && cred.user) return cred.user.updateProfile({ displayName: displayName }).then(() => cred);
    return cred;
  });
}

function sendResetPasswordEmail(email){
  if(!isFirebaseConfigured()) return Promise.reject(new Error("Firebase chưa cấu hình"));
  return firebase.auth().sendPasswordResetEmail(email);
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

/* ---------- Khung đăng nhập bằng email/mật khẩu (dùng chung 1 khung cho cả site) ---------- */
let __emailAuthMode = "login"; // "login" | "register"

function emailAuthErrorText_(err){
  const code = err && err.code;
  const map = {
    "auth/email-already-in-use": "Email này đã có tài khoản — thử đăng nhập thay vì đăng ký.",
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/weak-password": "Mật khẩu quá ngắn, cần ít nhất 6 ký tự.",
    "auth/wrong-password": "Sai mật khẩu, thử lại nhé.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/too-many-requests": "Thử sai quá nhiều lần, vui lòng đợi một lát rồi thử lại."
  };
  return (code && map[code]) || "Có lỗi xảy ra, vui lòng thử lại.";
}

function openEmailAuthModal(){
  renderEmailAuthModal_();
  setEmailAuthMode_("login");
  document.body.classList.add("email-auth-open");
}

function closeEmailAuthModal_(){
  document.body.classList.remove("email-auth-open");
  const errorEl = document.getElementById("email-auth-error");
  if(errorEl) errorEl.style.display = "none";
}

function setEmailAuthMode_(mode){
  __emailAuthMode = mode;
  const isRegister = mode === "register";
  document.getElementById("email-auth-title").textContent = isRegister ? "Tạo tài khoản mới" : "Đăng nhập bằng email";
  document.getElementById("email-auth-name-group").style.display = isRegister ? "block" : "none";
  document.getElementById("email-auth-submit").textContent = isRegister ? "Đăng ký" : "Đăng nhập";
  document.getElementById("email-auth-toggle-mode").textContent = isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký ngay";
  const errorEl = document.getElementById("email-auth-error");
  if(errorEl) errorEl.style.display = "none";
}

function renderEmailAuthModal_(){
  if(document.getElementById("email-auth-modal")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="email-auth-backdrop" id="email-auth-backdrop"></div>
    <div class="email-auth-modal" id="email-auth-modal" role="dialog" aria-label="Đăng nhập bằng email">
      <button type="button" class="email-auth-close" id="email-auth-close" aria-label="Đóng">✕</button>
      <h3 id="email-auth-title">Đăng nhập bằng email</h3>
      <form id="email-auth-form" novalidate>
        <div class="form-group" id="email-auth-name-group" style="display:none;">
          <label>Họ tên</label>
          <input type="text" id="ea-name" placeholder="Nguyễn Văn A">
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="ea-email" required placeholder="ban@gmail.com">
        </div>
        <div class="form-group" style="margin-bottom:10px;">
          <label>Mật khẩu *</label>
          <input type="password" id="ea-password" required minlength="6" placeholder="Ít nhất 6 ký tự">
        </div>
        <p class="email-auth-error" id="email-auth-error" style="display:none;"></p>
        <button type="submit" class="btn btn-primary btn-block" id="email-auth-submit">Đăng nhập</button>
      </form>
      <button type="button" class="email-auth-link" id="email-auth-toggle-mode">Chưa có tài khoản? Đăng ký ngay</button>
      <button type="button" class="email-auth-link" id="email-auth-forgot">Quên mật khẩu?</button>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById("email-auth-backdrop").addEventListener("click", closeEmailAuthModal_);
  document.getElementById("email-auth-close").addEventListener("click", closeEmailAuthModal_);
  document.getElementById("email-auth-toggle-mode").addEventListener("click", () => {
    setEmailAuthMode_(__emailAuthMode === "login" ? "register" : "login");
  });

  document.getElementById("email-auth-forgot").addEventListener("click", () => {
    const email = document.getElementById("ea-email").value.trim();
    const errorEl = document.getElementById("email-auth-error");
    if(!email){
      errorEl.textContent = "Nhập email vào ô bên trên trước, rồi bấm lại \"Quên mật khẩu?\".";
      errorEl.style.display = "block";
      return;
    }
    sendResetPasswordEmail(email).then(() => {
      showToast("Đã gửi email đặt lại mật khẩu, kiểm tra hộp thư nhé");
      closeEmailAuthModal_();
    }).catch(err => {
      errorEl.textContent = emailAuthErrorText_(err);
      errorEl.style.display = "block";
    });
  });

  document.getElementById("email-auth-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("ea-email").value.trim();
    const password = document.getElementById("ea-password").value;
    const name = document.getElementById("ea-name").value.trim();
    const errorEl = document.getElementById("email-auth-error");
    errorEl.style.display = "none";
    const submitBtn = document.getElementById("email-auth-submit");
    submitBtn.disabled = true;

    const action = __emailAuthMode === "register"
      ? registerWithEmail(email, password, name)
      : signInWithEmail(email, password);

    action.then(() => {
      submitBtn.disabled = false;
      closeEmailAuthModal_();
      showToast(__emailAuthMode === "register" ? "Tạo tài khoản thành công ✓" : "Đăng nhập thành công ✓");
      document.getElementById("email-auth-form").reset();
    }).catch(err => {
      submitBtn.disabled = false;
      errorEl.textContent = emailAuthErrorText_(err);
      errorEl.style.display = "block";
    });
  });
}

/* ---------- Nút tài khoản trên header — gắn ở mọi trang, có bản desktop
   (#account-slot, trong thanh trên) và bản mobile (#account-slot-mobile,
   nằm trong menu 3 sọc) — cùng logic, chỉ khác nơi hiển thị qua CSS. ---------- */
const ACCOUNT_ICON_ = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

function accountSlotHTML_(user){
  if(!isFirebaseConfigured()){
    return `<button type="button" class="icon-btn account-btn-el" aria-label="Đăng nhập" title="Đăng nhập (chưa cấu hình)">${ACCOUNT_ICON_}</button>`;
  }
  if(user){
    const initial = (user.displayName || user.email || "?").trim().charAt(0).toUpperCase();
    return `
      <div class="account-menu-wrap">
        <button type="button" class="account-avatar-btn account-btn-el" aria-label="Tài khoản: ${user.displayName || user.email}">
          ${user.photoURL ? `<img src="${user.photoURL}" alt="">` : `<span>${initial}</span>`}
        </button>
        <div class="account-menu">
          <div class="account-menu-name">${user.displayName || "Khách hàng"}</div>
          <div class="account-menu-email">${user.email || ""}</div>
          <a href="${sitePrefix_()}don-hang-cua-toi.html">Đơn hàng của tôi</a>
          <button type="button" class="account-signout-el">Đăng xuất</button>
        </div>
      </div>`;
  }
  return `
    <div class="account-login-options">
      <button type="button" class="btn btn-outline btn-sm account-google-btn">Đăng nhập Google</button>
      <button type="button" class="account-email-link-btn">hoặc dùng email</button>
    </div>`;
}

function wireAccountSlot_(slot, user){
  if(!isFirebaseConfigured()){
    const btn = slot.querySelector(".account-btn-el");
    btn.addEventListener("click", () => showToast("Đăng nhập chưa được cấu hình"));
    return;
  }
  if(user){
    const btn = slot.querySelector(".account-btn-el");
    const menu = slot.querySelector(".account-menu");
    btn.addEventListener("click", () => menu.classList.toggle("open"));
    slot.querySelector(".account-signout-el").addEventListener("click", () => signOutUser());
    document.addEventListener("click", (e) => {
      if(!slot.contains(e.target)) menu.classList.remove("open");
    });
  }else{
    slot.querySelector(".account-google-btn").addEventListener("click", signInWithGoogle);
    slot.querySelector(".account-email-link-btn").addEventListener("click", openEmailAuthModal);
  }
}

function renderAccountButton(){
  const slots = [document.getElementById("account-slot"), document.getElementById("account-slot-mobile")].filter(Boolean);
  if(!slots.length) return;

  onAuthChange(user => {
    slots.forEach(slot => {
      slot.innerHTML = accountSlotHTML_(user);
      wireAccountSlot_(slot, user);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAuth_();
  renderAccountButton();
});

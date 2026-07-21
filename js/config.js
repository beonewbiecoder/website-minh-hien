/* =========================================================
   CẤU HÌNH KẾT NỐI GOOGLE SHEET / APPS SCRIPT
   Sau khi deploy Apps Script (xem google-apps-script/Code.gs),
   dán URL Web App nhận được vào biến bên dưới.
   Để trống "" thì website vẫn chạy bình thường với dữ liệu mẫu có sẵn.
   ========================================================= */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxlIw5LuuphOdowghg2X1miDroAFYmTd55lccu9Qu7a8SGYRFKRK9jy5B0PNRFkPooNyQ/exec";

/* =========================================================
   THANH LIÊN HỆ NHANH (mobile) — số gọi & link Zalo
   Đây là số Zalo cá nhân dùng tạm. Khi có Zalo OA chính thức,
   chỉ cần đổi ZALO_URL ở đây — không cần sửa chỗ nào khác.
   ========================================================= */
const BRAND_SHORT_NAME = "Cửa Hàng Minh Hiền";
const CONTACT_PHONE = "0918159870";
const CONTACT_PHONE_DISPLAY = "091 815 9870";
const ZALO_URL = "https://zalo.me/0918159870";
const CONTACT_EMAIL = "minhhien.bz@gmail.com";
const CONTACT_ADDRESS = "11 Thái Phiên, Phường Minh Phụng, TP. Hồ Chí Minh";
const CONTACT_HOURS = "Thứ Hai – Thứ Bảy: 7:00 – 17:00";

/* Link Google Maps trỏ đúng Google Business Profile đã tạo (không phải geocode theo địa chỉ chữ) */
const MAPS_URL = "https://maps.app.goo.gl/xZ1LxMxwxvJL9X4x6";
const MAPS_EMBED_URL = "https://www.google.com/maps?q=10.754757,106.6448351&output=embed";

/* =========================================================
   TÀI KHOẢN NHẬN CHUYỂN KHOẢN (hiện QR VietQR ở trang thanh toán)
   Đổi tài khoản chỉ cần sửa 3 biến này, không sửa chỗ nào khác.
   ========================================================= */
const VIETQR_BANK_CODE = "ACB";
const VIETQR_ACCOUNT_NO = "68329168";
const VIETQR_ACCOUNT_NAME = "BANH THUC HIEN";

/* =========================================================
   ĐĂNG NHẬP BẰNG GOOGLE (Firebase Authentication)
   Chỉ dùng để xác định danh tính khách — KHÔNG dùng Firestore/database
   nào khác, đơn hàng vẫn lưu 100% trong Google Sheet như cũ.

   CÁCH LẤY GIÁ TRỊ: vào https://console.firebase.google.com → Tạo dự án
   (miễn phí) → Project settings → tab "General" → mục "Your apps" →
   bấm biểu tượng "</>" (Web) để tạo 1 web app → Firebase cho ra đúng
   6 giá trị bên dưới, copy dán vào là xong.
   Sau đó vào Authentication → Sign-in method → bật "Google".
   Cuối cùng vào Authentication → Settings → Authorized domains →
   thêm domain "beonewbiecoder.github.io" (không có thì nút đăng nhập
   sẽ báo lỗi domain không được phép).

   Giá trị "apiKey" bên dưới PHẢI được dán thêm 1 lần nữa vào hằng số
   FIREBASE_API_KEY trong google-apps-script/Code.gs — dùng để Apps Script
   xác thực lại đúng người dùng khi tra cứu/huỷ đơn (tránh khách xem/huỷ
   được đơn của người khác). apiKey của Firebase là public, không phải bí
   mật, dán vào code phía server như vậy là bình thường, không rủi ro.

   Để trống "" thì nút đăng nhập vẫn hiện nhưng báo "chưa cấu hình",
   website vẫn hoạt động bình thường (đặt hàng không bắt buộc đăng nhập).
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAWwCaTBA7o82okuC_s5k5rDvq-mbmREko",
  authDomain: "chmh-e22e1.firebaseapp.com",
  projectId: "chmh-e22e1",
  storageBucket: "chmh-e22e1.firebasestorage.app",
  messagingSenderId: "506370746806",
  appId: "1:506370746806:web:4f787c4a698e6f5a503917"
};

/* =========================================================
   PHÍ VẬN CHUYỂN THEO KHU VỰC (mức cố định tạm thời)
   Đây là số tiền VÍ DỤ để dựng sẵn cấu trúc — chủ shop cần tự
   chỉnh lại đúng mức phí thật trước khi đưa site vào hoạt động
   chính thức. Sau này muốn đổi sang API tính phí thật của GHN/GHTK,
   chỉ cần thay hàm getShippingFee() trong js/cart.js, không cần sửa
   chỗ nào khác.
   ========================================================= */
const SHIPPING_FEES = {
  near: 20000,   // Nội thành TP.HCM — tự giao
  mid: 35000,    // Tỉnh/thành lân cận
  far: 60000     // Tỉnh xa — qua đơn vị vận chuyển thứ 3
};

// Danh sách tỉnh/thành cho dropdown ở trang thanh toán, gắn theo mức phí ở trên.
// "near" = nội thành TP.HCM, "mid" = các tỉnh lân cận, "far" = còn lại.
// Chủ shop có thể tự sửa danh sách này cho khớp địa giới hành chính mới nhất.
const SHIPPING_ZONES = [
  { name: "TP. Hồ Chí Minh", tier: "near" },
  { name: "Bình Dương", tier: "mid" },
  { name: "Đồng Nai", tier: "mid" },
  { name: "Long An", tier: "mid" },
  { name: "Tây Ninh", tier: "mid" },
  { name: "Bà Rịa - Vũng Tàu", tier: "mid" },
  { name: "Tiền Giang", tier: "mid" },
  { name: "Hà Nội", tier: "far" },
  { name: "Đà Nẵng", tier: "far" },
  { name: "Cần Thơ", tier: "far" },
  { name: "Tỉnh/thành khác", tier: "far" }
];

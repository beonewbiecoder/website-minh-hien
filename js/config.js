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

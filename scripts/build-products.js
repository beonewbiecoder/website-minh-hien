/* =========================================================
   BUILD SCRIPT — tải dữ liệu sản phẩm mới nhất từ Google Sheet (qua Apps
   Script) và ghi thành file JS tĩnh, phát nhanh qua CDN GitHub Pages thay vì
   phải gọi sống Apps Script mỗi lần khách xem sản phẩm (vốn chậm, 1-3 giây,
   nặng hơn nữa khi mạng khách yếu).

   Chạy tự động bởi GitHub Actions (.github/workflows/build-products.yml):
   - Apps Script tự gọi (workflow_dispatch) ngay sau khi admin lưu/xoá sản
     phẩm, hoặc có đơn hàng mới/huỷ (đổi tồn kho) — xem triggerProductsRebuild_
     trong google-apps-script/Code.gs
   - Kèm lịch chạy định kỳ mỗi 30 phút làm lưới an toàn (phòng khi lần gọi
     trên bị lỗi mạng)
   KHÔNG cần chạy tay, KHÔNG cần cài Node trên máy cá nhân.

   Đọc: APPS_SCRIPT_URL (lấy trực tiếp từ js/config.js, không phải bí mật)
        → gọi action=products
   Ghi: js/products-data.js (nạp đè lên PRODUCTS ngay sau js/data.js)
   ========================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function getAppsScriptUrl() {
  const configSrc = fs.readFileSync(path.join(ROOT, "js", "config.js"), "utf8");
  const match = configSrc.match(/APPS_SCRIPT_URL\s*=\s*"([^"]*)"/);
  return match ? match[1] : "";
}

async function main() {
  const url = getAppsScriptUrl();
  if (!url) {
    console.log("Chưa cấu hình APPS_SCRIPT_URL trong js/config.js — bỏ qua build sản phẩm.");
    return;
  }

  const res = await fetch(url + "?action=products");
  const data = await res.json();
  if (!data || !data.success || !Array.isArray(data.products)) {
    throw new Error("Apps Script không trả về dữ liệu sản phẩm hợp lệ: " + JSON.stringify(data).slice(0, 300));
  }

  const jsOut = `/* =========================================================
   TỰ ĐỘNG SINH RA BỞI scripts/build-products.js — KHÔNG SỬA TAY.
   Dữ liệu lấy từ Sheet Products (qua Apps Script) tại thời điểm build.
   Sửa sản phẩm ở trang quan-ly-san-pham.html, GitHub Actions sẽ tự build
   lại file này (thường mất chưa tới 1 phút).
   ========================================================= */

const PRODUCTS_DATA_ = ${JSON.stringify(data.products, null, 2)};

PRODUCTS.length = 0;
PRODUCTS_DATA_.forEach(function (p) { PRODUCTS.push(p); });
`;

  fs.writeFileSync(path.join(ROOT, "js", "products-data.js"), jsOut, "utf8");
  console.log(`→ đã ghi js/products-data.js (${data.products.length} sản phẩm)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

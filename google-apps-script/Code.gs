/**
 * MINH HIỀN HYDRAULICS — Apps Script backend
 *
 * Nối website với Google Sheet:
 * - Lưu đơn hàng (tab "Orders") + gửi email báo
 * - Lưu yêu cầu tư vấn (tab "Contacts") + gửi email báo
 * - Trả về danh sách sản phẩm (tab "Products") dạng JSON cho website hiển thị
 *
 * CÁCH DÙNG — xem hướng dẫn đầy đủ trong tin nhắn Claude đã gửi.
 * Tóm tắt: dán file này vào Extensions > Apps Script của Google Sheet,
 * sửa NOTIFY_EMAIL nếu cần, rồi Deploy > New deployment > Web app
 * (Execute as: Me — Who has access: Anyone). Copy URL dán vào js/config.js.
 */

const NOTIFY_EMAIL = "minhhien.bz@gmail.com";
const SHEET_ORDERS = "Orders";
const SHEET_CONTACTS = "Contacts";
const SHEET_PRODUCTS = "Products";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === "order") {
      saveOrder(data);
    } else if (data.type === "contact") {
      saveContact(data);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "products") {
    return ContentService.createTextOutput(JSON.stringify({ success: true, products: getProducts() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: "unknown action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function saveOrder(data) {
  const sheet = getSheet_(SHEET_ORDERS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Thời gian", "Họ tên", "Điện thoại", "Email", "Địa chỉ", "Ghi chú", "Sản phẩm", "Tổng tiền"]);
  }
  const itemsText = (data.items || [])
    .map(function (i) { return i.name + " (" + i.size + ") x" + i.qty + " " + i.unit + " = " + i.lineTotal + "đ"; })
    .join("\n");
  sheet.appendRow([
    new Date(), data.name || "", data.phone || "", data.email || "",
    data.address || "", data.note || "", itemsText, data.total || 0
  ]);

  const body = [
    "Có đơn hàng mới từ website!", "",
    "Khách hàng: " + data.name,
    "Điện thoại: " + data.phone,
    "Địa chỉ: " + (data.address || "(chưa cung cấp)"),
    "Ghi chú: " + (data.note || "(không có)"), "",
    "Sản phẩm:", itemsText, "",
    "Tổng tiền: " + (data.total || 0) + "đ"
  ].join("\n");
  MailApp.sendEmail(NOTIFY_EMAIL, "[Đơn hàng mới] " + data.name + " - " + (data.total || 0) + "đ", body);
}

function saveContact(data) {
  const sheet = getSheet_(SHEET_CONTACTS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Thời gian", "Họ tên", "Điện thoại", "Nội dung"]);
  }
  sheet.appendRow([new Date(), data.name || "", data.phone || "", data.message || ""]);

  const body = [
    "Có yêu cầu tư vấn mới từ website!", "",
    "Khách hàng: " + data.name,
    "Điện thoại: " + data.phone,
    "Nội dung: " + (data.message || "(không có)")
  ].join("\n");
  MailApp.sendEmail(NOTIFY_EMAIL, "[Yêu cầu tư vấn] " + data.name, body);
}

function getProducts() {
  const sheet = getSheet_(SHEET_PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const idx = function (name) { return headers.indexOf(name); };

  const CATEGORY_MAP = {
    "ống thủy lực": "ong-thuy-luc",
    "rắc co & đầu nối": "rac-co",
    "rắc co": "rac-co",
    "ong-thuy-luc": "ong-thuy-luc",
    "rac-co": "rac-co"
  };

  const products = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = row[idx("Tên sản phẩm")];
    if (!name) continue;

    const catRaw = String(row[idx("Danh mục")] || "").trim().toLowerCase();
    const category = CATEGORY_MAP[catRaw] || catRaw;

    const specs = {};
    for (let s = 1; s <= 5; s++) {
      const k = row[idx("Thông số " + s + " - Tên")];
      const v = row[idx("Thông số " + s + " - Giá trị")];
      if (k && v) specs[k] = v;
    }

    let icon = String(row[idx("Icon")] || "").trim();
    if (!icon) icon = category === "ong-thuy-luc" ? "hose" : "hex";

    const idCell = row[idx("ID")];
    products.push({
      id: idCell ? String(idCell) : slugify_(name),
      name: name,
      category: category,
      size: row[idx("Kích thước")] || "",
      price: Number(row[idx("Giá (VNĐ)")]) || 0,
      unit: row[idx("Đơn vị")] || "cái",
      desc: row[idx("Mô tả")] || "",
      badge: row[idx("Nhãn nổi bật")] || "",
      icon: icon,
      specs: specs
    });
  }
  return products;
}

function slugify_(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

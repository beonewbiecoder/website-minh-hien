/**
 * MINH HIỀN HYDRAULICS — Apps Script backend
 *
 * Nối website với Google Sheet:
 * - Lưu đơn hàng (tab "Orders") + gửi email báo
 * - Lưu yêu cầu tư vấn (tab "Contacts") + gửi email báo
 * - Trả về danh sách sản phẩm (tab "Products") dạng JSON cho website hiển thị
 * - Trợ lý chat AI (Gemini): trả lời dựa trên dữ liệu Sheet (Products/TuDien/FAQ),
 *   ghi log mọi hội thoại vào tab "ChatLog", báo email khi khách cần gặp chuyên viên
 *
 * CÁCH DÙNG — xem hướng dẫn đầy đủ trong tin nhắn Claude đã gửi.
 * Tóm tắt: dán file này vào Extensions > Apps Script của Google Sheet,
 * sửa NOTIFY_EMAIL/EMAIL_CHU_SHOP nếu cần, vào Project Settings > Script
 * Properties thêm GEMINI_API_KEY, rồi Deploy > Manage deployments > sửa
 * deployment cũ > Version: New version > Deploy (giữ nguyên URL cũ).
 */

const NOTIFY_EMAIL = "minhhien.bz@gmail.com";
// Email nhận báo khi khách bấm "Tư vấn với chuyên viên kỹ thuật" trong chat AI.
// Để trống thì dùng chung NOTIFY_EMAIL ở trên.
const EMAIL_CHU_SHOP = "";

const SHEET_ORDERS = "Orders";
const SHEET_CONTACTS = "Contacts";
const SHEET_PRODUCTS = "Products";
const SHEET_TUDIEN = "TuDien";
const SHEET_FAQ = "FAQ";
const SHEET_CHATLOG = "ChatLog";

const GEMINI_MODEL = "gemini-2.5-flash";
const SYSTEM_PROMPT = "Bạn là trợ lý tư vấn của cửa hàng Minh Hiền Hydraulics, chuyên ống thủy lực và rắc co. " +
  "CHỈ được trả lời dựa trên dữ liệu sản phẩm và FAQ được cung cấp bên dưới. TUYỆT ĐỐI không tự bịa giá, " +
  "thông số kỹ thuật, hoặc tình trạng còn hàng nếu không có trong dữ liệu. Nếu không chắc chắn hoặc câu hỏi " +
  "ngoài phạm vi dữ liệu, hãy trả lời trung thực là chưa có thông tin và mời khách bấm nút 'Tư vấn với chuyên " +
  "viên kỹ thuật'. Trả lời ngắn gọn, thân thiện, dễ hiểu cho khách hàng lớn tuổi không rành công nghệ.";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === "order") {
      saveOrder(data);
    } else if (data.type === "contact") {
      saveContact(data);
    } else if (data.type === "chat") {
      return handleChat_(data);
    } else if (data.type === "chat_escalate") {
      return handleChatEscalate_(data);
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
    sheet.appendRow([
      "Thời gian", "Mã đơn hàng", "Họ tên", "Điện thoại", "Hình thức nhận hàng",
      "Địa chỉ", "Phương thức thanh toán", "Ghi chú", "Sản phẩm", "Tổng tiền"
    ]);
  }
  const itemsText = (data.items || [])
    .map(function (i) { return i.name + " (" + i.size + ") x" + i.qty + " " + i.unit + " = " + i.lineTotal + "đ"; })
    .join("\n");
  const fulfillmentLabel = data.fulfillment === "pickup" ? "Tới lấy tại cửa hàng" : "Giao hàng tận nơi";
  const paymentLabel = data.payment === "bank" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)";

  sheet.appendRow([
    new Date(), data.orderCode || "", data.name || "", data.phone || "",
    fulfillmentLabel, data.address || "", paymentLabel, data.note || "",
    itemsText, data.total || 0
  ]);

  const body = [
    "Có đơn hàng mới từ website!", "",
    "Mã đơn hàng: " + (data.orderCode || "(không có)"),
    "Khách hàng: " + data.name,
    "Điện thoại: " + data.phone,
    "Hình thức nhận hàng: " + fulfillmentLabel,
    "Địa chỉ: " + (data.address || "(tới lấy tại cửa hàng)"),
    "Thanh toán: " + paymentLabel,
    "Ghi chú: " + (data.note || "(không có)"), "",
    "Sản phẩm:", itemsText, "",
    "Tổng tiền: " + (data.total || 0) + "đ"
  ].join("\n");
  MailApp.sendEmail(
    NOTIFY_EMAIL,
    "[Đơn hàng mới] " + (data.orderCode ? data.orderCode + " - " : "") + data.name + " - " + (data.total || 0) + "đ",
    body
  );
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
      specs: specs,
      // Cột "Tình trạng" là tuỳ chọn — nếu Sheet chưa có cột này thì mặc định Còn hàng
      status: String(row[idx("Tình trạng")] || "Còn hàng").trim()
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

/* =========================================================
   CHAT AI (Gemini) — trả lời dựa trên dữ liệu Sheet
   ========================================================= */

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheetRows_(name, headerRow) {
  const sheet = getSheet_(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headerRow);
    return [];
  }
  const rows = sheet.getDataRange().getValues();
  return rows.slice(1).filter(function (r) { return r[0]; });
}

// Chỉ đưa sản phẩm CÒN HÀNG vào ngữ cảnh cho AI, tránh tư vấn nhầm hàng đã hết
function getAvailableProductsContext_() {
  const products = getProducts();
  const available = products.filter(function (p) {
    return String(p.status || "").toLowerCase().indexOf("hết") === -1;
  });
  if (!available.length) return "(chưa có dữ liệu sản phẩm)";
  const catName = function (c) { return c === "ong-thuy-luc" ? "Ống thủy lực" : "Rắc co & Đầu nối"; };
  return available.map(function (p) {
    return "- " + p.name + " | " + catName(p.category) + " | Kích thước: " + p.size +
      " | Giá: " + Math.round(p.price).toLocaleString("vi-VN") + "đ/" + p.unit;
  }).join("\n");
}

function getTuDienContext_() {
  const rows = getSheetRows_(SHEET_TUDIEN, ["Cách nói dân dã", "Thuật ngữ chuẩn"]);
  if (!rows.length) return "(chưa có dữ liệu)";
  return rows.map(function (r) { return r[0] + " => " + r[1]; }).join("\n");
}

function getFaqContext_() {
  const rows = getSheetRows_(SHEET_FAQ, ["Câu hỏi", "Câu trả lời"]);
  if (!rows.length) return "(chưa có dữ liệu)";
  return rows.map(function (r) { return "Hỏi: " + r[0] + "\nĐáp: " + r[1]; }).join("\n\n");
}

function callGemini_(userMessage) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    return "Xin lỗi, trợ lý AI hiện chưa được cấu hình xong. Bạn bấm nút 'Tư vấn với chuyên viên kỹ thuật' bên dưới giúp mình nhé.";
  }

  const systemInstruction = SYSTEM_PROMPT +
    "\n\n--- DỮ LIỆU SẢN PHẨM ĐANG CÒN HÀNG ---\n" + getAvailableProductsContext_() +
    "\n\n--- TỪ ĐIỂN CÁCH NÓI DÂN DÃ CỦA KHÁCH ---\n" + getTuDienContext_() +
    "\n\n--- CÂU HỎI THƯỜNG GẶP (FAQ) ---\n" + getFaqContext_();

  const payload = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
  };

  try {
    const res = UrlFetchApp.fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent",
      {
        method: "post",
        contentType: "application/json",
        headers: { "x-goog-api-key": apiKey },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );
    if (res.getResponseCode() !== 200) {
      return "Xin lỗi, hiện mình chưa trả lời được câu hỏi này. Bạn bấm nút 'Tư vấn với chuyên viên kỹ thuật' bên dưới giúp mình nhé.";
    }
    const data = JSON.parse(res.getContentText());
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    const text = parts && parts[0] && parts[0].text;
    if (!text) {
      return "Xin lỗi, hiện mình chưa trả lời được câu hỏi này. Bạn bấm nút 'Tư vấn với chuyên viên kỹ thuật' bên dưới giúp mình nhé.";
    }
    return text.trim();
  } catch (err) {
    return "Xin lỗi, hiện mình chưa trả lời được câu hỏi này. Bạn bấm nút 'Tư vấn với chuyên viên kỹ thuật' bên dưới giúp mình nhé.";
  }
}

function logChatTurn_(sessionId, question, answer, escalated) {
  const sheet = getSheet_(SHEET_CHATLOG);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Thời gian", "Mã phiên chat", "Câu hỏi của khách", "Câu trả lời của AI", "Yêu cầu tư vấn chuyên viên"]);
  }
  sheet.appendRow([new Date(), sessionId, question, answer, escalated ? "Có" : "Không"]);
}

function handleChat_(data) {
  const sessionId = data.sessionId || Utilities.getUuid();
  const userMessage = String(data.message || "").trim();
  if (!userMessage) {
    return jsonOutput_({ success: false, error: "empty message" });
  }
  const reply = callGemini_(userMessage);
  logChatTurn_(sessionId, userMessage, reply, false);
  return jsonOutput_({ success: true, sessionId: sessionId, reply: reply });
}

function handleChatEscalate_(data) {
  const sessionId = data.sessionId || Utilities.getUuid();
  logChatTurn_(sessionId, data.lastMessage || "(bấm nút yêu cầu tư vấn)", "(khách bấm nút gặp chuyên viên)", true);
  sendEscalationEmail_(sessionId);
  return jsonOutput_({ success: true });
}

function sendEscalationEmail_(sessionId) {
  const targetEmail = EMAIL_CHU_SHOP || NOTIFY_EMAIL;
  const sheet = getSheet_(SHEET_CHATLOG);
  const rows = sheet.getDataRange().getValues();
  const sessionRows = rows.filter(function (r) { return r[1] === sessionId; });
  const recent = sessionRows.slice(-5);
  const transcript = recent.map(function (r) {
    return "Khách: " + r[2] + "\nAI: " + r[3];
  }).join("\n\n");

  const body = [
    "Có khách yêu cầu tư vấn trực tiếp từ khung chat AI trên website!", "",
    "Mã phiên: " + sessionId,
    "Thời gian: " + new Date().toLocaleString("vi-VN"), "",
    "Tóm tắt hội thoại gần đây:",
    transcript || "(chưa có tin nhắn nào trước đó)"
  ].join("\n");

  MailApp.sendEmail(targetEmail, "[Chat AI] Khách cần tư vấn trực tiếp", body);
}

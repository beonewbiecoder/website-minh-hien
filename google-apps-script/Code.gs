/**
 * MINH HIỀN HYDRAULICS — Apps Script backend
 *
 * Nối website với Google Sheet:
 * - Lưu đơn hàng (tab "Orders") + gửi email báo, trừ/hoàn tồn kho (tab "Products")
 * - Tra cứu đơn theo tài khoản Google đã đăng nhập + cho khách tự huỷ đơn
 * - Lưu yêu cầu tư vấn (tab "Contacts") + gửi email báo
 * - Trả về danh sách sản phẩm (tab "Products") dạng JSON cho website hiển thị
 * - Trợ lý chat AI (Gemini): trả lời dựa trên dữ liệu Sheet (Products/TuDien/FAQ),
 *   ghi log mọi hội thoại vào tab "ChatLog", báo email khi khách cần gặp chuyên viên
 *
 * CÁCH DÙNG — xem hướng dẫn đầy đủ trong tin nhắn Claude đã gửi.
 * Tóm tắt: dán file này vào Extensions > Apps Script của Google Sheet,
 * sửa NOTIFY_EMAIL/EMAIL_CHU_SHOP/FIREBASE_API_KEY nếu cần, vào Project
 * Settings > Script Properties thêm GEMINI_API_KEY, rồi Deploy > Manage
 * deployments > sửa deployment cũ > Version: New version > Deploy (giữ
 * nguyên URL cũ).
 */

const NOTIFY_EMAIL = "minhhien.bz@gmail.com";
// Email nhận báo khi khách bấm "Tư vấn với chuyên viên kỹ thuật" trong chat AI.
// Để trống thì dùng chung NOTIFY_EMAIL ở trên.
const EMAIL_CHU_SHOP = "";

// PHẢI khớp với FIREBASE_CONFIG.apiKey trong js/config.js — dùng để xác thực
// lại token đăng nhập Google trước khi trả/huỷ đơn hàng của khách (tránh một
// khách xem/huỷ được đơn của người khác chỉ bằng cách sửa email trong request).
const FIREBASE_API_KEY = "AIzaSyAWwCaTBA7o82okuC_s5k5rDvq-mbmREko";

const SHEET_ORDERS = "Orders";
const SHEET_CONTACTS = "Contacts";
const SHEET_PRODUCTS = "Products";
const SHEET_TUDIEN = "TuDien";
const SHEET_FAQ = "FAQ";
const SHEET_CHATLOG = "ChatLog";

// Các tài khoản Google được phép thêm/sửa/xoá sản phẩm qua trang
// quan-ly-san-pham.html. Ai đăng nhập bằng email KHÔNG có trong danh sách này
// đều bị chặn — kể cả khi biết đường link trang quản lý (xem verifyFirebaseIdToken_
// + isAdminEmail_, không tin email trình duyệt gửi lên, luôn xác thực lại với Google).
const ADMIN_EMAILS = ["minhhien.bz@gmail.com", "kmuffin03@gmail.com"];

// Tên thư mục Google Drive (cùng Drive với tài khoản đang chạy Apps Script) để
// lưu ảnh sản phẩm khách/chủ shop tải lên qua trang quản lý — tự tạo nếu chưa có.
const PRODUCT_IMAGES_FOLDER_NAME = "Website Minh Hiền - Ảnh sản phẩm";

// Repo GitHub chứa website — dùng để tự động "trigger" GitHub Actions build lại
// js/products-data.js (dữ liệu sản phẩm tĩnh, tải nhanh) ngay khi sản phẩm/tồn
// kho thay đổi. Xem triggerProductsRebuild_() bên dưới.
const GITHUB_OWNER = "beonewbiecoder";
const GITHUB_REPO = "website-minh-hien";
const GITHUB_PRODUCTS_WORKFLOW = "build-products.yml";

// Các trạng thái đơn hàng chuẩn hoá — dùng đúng các chuỗi này ở mọi nơi
// (Sheet, email, trang "Đơn hàng của tôi") để so khớp chính xác.
const STATUS_CHO_XAC_NHAN = "Chờ xác nhận";
const STATUS_DANG_CHUAN_BI = "Đã xác nhận — đang chuẩn bị hàng";
const STATUS_DANG_GIAO = "Đang giao";
const STATUS_HOAN_TAT = "Hoàn tất";
const STATUS_DA_HUY = "Đã huỷ";
// Chỉ cho khách tự huỷ khi đơn còn ở "Chờ xác nhận" — tức là CHƯA có nhân viên
// gọi điện xác nhận thật. Ngay khi chủ shop tự tay đổi trạng thái sang
// "Đã xác nhận — đang chuẩn bị hàng" (sau cuộc gọi xác nhận thật), nút huỷ biến
// mất, áp dụng cho cả đơn COD lẫn chuyển khoản như nhau.
const CANCELABLE_STATUSES = [STATUS_CHO_XAC_NHAN];

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
    } else if (data.type === "my_orders") {
      return handleMyOrders_(data);
    } else if (data.type === "cancel_order") {
      return handleCancelOrder_(data);
    } else if (data.type === "admin_save_product") {
      return handleAdminSaveProduct_(data);
    } else if (data.type === "admin_delete_product") {
      return handleAdminDeleteProduct_(data);
    }
    return jsonOutput_({ success: true });
  } catch (err) {
    // Ghi log lỗi lại (xem ở Apps Script > Executions/Việc thực thi) — front-end
    // gọi "order"/"contact" kiểu no-cors (gửi rồi quên) nên KHÔNG đọc được lỗi này,
    // nếu không log ở đây thì lỗi coi như biến mất, không cách nào biết được.
    console.error("doPost lỗi: " + err);
    return jsonOutput_({ success: false, error: String(err) });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  if (action === "products") {
    return jsonOutput_({ success: true, products: getProducts() });
  }
  return jsonOutput_({ success: false, error: "unknown action" });
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

/* =========================================================
   ĐƠN HÀNG — lưu, trừ tồn kho, xác thực + tra cứu theo tài khoản
   ========================================================= */

const ORDERS_HEADERS_ = [
  "Thời gian", "Mã đơn hàng", "Trạng thái", "Email", "Họ tên", "Điện thoại",
  "Hình thức nhận hàng", "Địa chỉ", "Tỉnh/Thành", "Phương thức thanh toán",
  "Ghi chú", "Sản phẩm", "Phí vận chuyển", "Tổng tiền", "Chi tiết SP (JSON)",
  "Hẹn ngày giờ nhận/giao hàng"
];

// Sheet Orders có thể đang mang header CŨ (từ trước khi có tính năng đăng
// nhập/tồn kho/phí ship) — nếu chỉ appendRow header lúc sheet trống thì sheet
// đã có dữ liệu từ trước sẽ giữ nguyên header cũ mãi mãi, làm dữ liệu mới ghi
// vào bị lệch cột. Hàm này so sánh header hiện tại với ORDERS_HEADERS_ chuẩn,
// tự sửa lại nếu khác — chạy an toàn dù sheet trống, có header cũ, hay đã đúng.
function ensureOrdersHeader_(sheet) {
  const lastCol = sheet.getLastColumn();
  const currentHeader = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const matches = currentHeader.length === ORDERS_HEADERS_.length &&
    ORDERS_HEADERS_.every(function (h, i) { return h === currentHeader[i]; });
  if (!matches) {
    sheet.getRange(1, 1, 1, ORDERS_HEADERS_.length).setValues([ORDERS_HEADERS_]);
  }
}

// CHẠY TAY 1 LẦN (chọn hàm này ở dropdown cạnh nút Run trong Apps Script editor,
// bấm Run) để biến cột "Trạng thái" trong Sheet Orders thành ô chọn sẵn (dropdown)
// kèm tô màu theo trạng thái — tránh gõ tay sai chính tả làm trang web không nhận
// diện được trạng thái. Chạy lại hàm này bất cứ lúc nào cũng an toàn (tự dọn rule
// màu cũ trước khi tạo lại, không bị cộng dồn trùng lặp).
// LƯU Ý: tên hàm KHÔNG được kết thúc bằng dấu "_" — Apps Script (bản gắn với
// Sheet) tự ẩn mọi hàm có tên kết thúc bằng "_" khỏi danh sách "chọn hàm để
// Chạy", coi đó là hàm nội bộ. Hàm này cần hiện ra để người dùng tự chạy tay.
function setupOrdersStatusDropdown() {
  const sheet = getSheet_(SHEET_ORDERS);
  ensureOrdersHeader_(sheet);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf("Trạng thái") + 1;
  if (statusCol === 0) {
    throw new Error("Không tìm thấy cột Trạng thái trong Sheet Orders.");
  }

  // Áp cho 500 dòng kể từ dòng 2 — đủ dùng cho nhiều tháng đơn hàng. Nếu sau này
  // vượt quá, chạy lại hàm này để mở rộng thêm.
  const numRows = 500;
  const range = sheet.getRange(2, statusCol, numRows, 1);

  const statusList = [STATUS_CHO_XAC_NHAN, STATUS_DANG_CHUAN_BI, STATUS_DANG_GIAO, STATUS_HOAN_TAT, STATUS_DA_HUY];
  const validationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(statusList, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(validationRule);

  // Xoá rule tô màu CŨ từng áp cho đúng vùng này (nếu đã chạy hàm này trước đó)
  // rồi tạo lại từ đầu — tránh cộng dồn rule trùng nhau mỗi lần chạy lại.
  const a1 = range.getA1Notation();
  const keptRules = sheet.getConditionalFormatRules().filter(function (r) {
    return r.getRanges().every(function (rg) { return rg.getA1Notation() !== a1; });
  });

  const colorMap = [
    { text: STATUS_CHO_XAC_NHAN, bg: "#fff2cc", font: "#7f6000" },   // vàng
    { text: STATUS_DANG_CHUAN_BI, bg: "#d9ead3", font: "#274e13" },  // xanh lá
    { text: STATUS_DANG_GIAO, bg: "#cfe2f3", font: "#1155cc" },      // xanh dương
    { text: STATUS_HOAN_TAT, bg: "#b6d7a8", font: "#274e13" },       // xanh lá đậm
    { text: STATUS_DA_HUY, bg: "#f4cccc", font: "#990000" }          // đỏ
  ];
  const newRules = colorMap.map(function (c) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(c.text)
      .setBackground(c.bg)
      .setFontColor(c.font)
      .setRanges([range])
      .build();
  });

  sheet.setConditionalFormatRules(keptRules.concat(newRules));
}

function saveOrder(data) {
  const sheet = getSheet_(SHEET_ORDERS);
  ensureOrdersHeader_(sheet);

  const itemsText = (data.items || [])
    .map(function (i) { return i.name + " (" + i.size + ") x" + i.qty + " " + i.unit + " = " + i.lineTotal + "đ"; })
    .join("\n");
  const fulfillmentLabel = data.fulfillment === "pickup" ? "Tới lấy tại cửa hàng" : "Giao hàng tận nơi";
  const paymentLabel = data.payment === "bank" ? "Chuyển khoản ngân hàng" : "Thanh toán khi nhận hàng (COD)";
  // Mọi đơn (COD lẫn chuyển khoản) đều bắt đầu ở "Chờ xác nhận" — chủ shop
  // luôn gọi điện xác nhận thật với khách trước, rồi mới tự tay đổi trạng thái
  // sang "Đã xác nhận — đang chuẩn bị hàng" trong Sheet (lúc đó khách mới hết
  // nút tự huỷ đơn).
  const status = STATUS_CHO_XAC_NHAN;
  const itemsJson = JSON.stringify(data.items || []);

  sheet.appendRow([
    new Date(), data.orderCode || "", status, data.email || "", data.name || "", data.phone || "",
    fulfillmentLabel, data.address || "", data.zone || "", paymentLabel,
    data.note || "", itemsText, data.shippingFee || 0, data.total || 0, itemsJson,
    "" // Hẹn ngày giờ nhận/giao hàng — để trống, chủ shop tự nhập tay sau khi đã xác nhận đơn
  ]);

  // Trừ tồn kho ngay khi tạo đơn (kể cả COD lẫn chuyển khoản) — tránh 2 khách
  // cùng đặt trúng sản phẩm cuối cùng trong lúc chờ xác nhận thanh toán.
  adjustStockForItems_(data.items || [], -1);

  const body = [
    "Có đơn hàng mới từ website!", "",
    "Mã đơn hàng: " + (data.orderCode || "(không có)"),
    "Trạng thái: " + status,
    "Khách hàng: " + data.name,
    "Điện thoại: " + data.phone,
    "Email tài khoản: " + (data.email || "(khách chưa đăng nhập)"),
    "Hình thức nhận hàng: " + fulfillmentLabel,
    "Địa chỉ: " + (data.address || "(tới lấy tại cửa hàng)"),
    "Tỉnh/Thành: " + (data.zone || "-"),
    "Thanh toán: " + paymentLabel,
    "Ghi chú: " + (data.note || "(không có)"), "",
    "Sản phẩm:", itemsText, "",
    "Phí vận chuyển: " + (data.shippingFee || 0) + "đ",
    "Tổng tiền: " + (data.total || 0) + "đ"
  ].join("\n");
  sendEmailSafe_(
    NOTIFY_EMAIL,
    "[Đơn hàng mới] " + (data.orderCode ? data.orderCode + " - " : "") + data.name + " - " + (data.total || 0) + "đ",
    body
  );

  // Chỉ gửi được cho khách nếu họ đã đăng nhập (mới có email) — khách vãng lai
  // không nhập email nên bỏ qua, không lỗi gì.
  if (data.email) {
    const paymentNote = data.payment === "bank"
      ? "Vui lòng hoàn tất chuyển khoản theo thông tin đã hiện trên website — cửa hàng sẽ xác nhận và gọi điện sau khi nhận được tiền."
      : "Nhân viên sẽ gọi điện xác nhận đơn hàng trước khi giao.";
    const customerBody = [
      "Cảm ơn bạn đã đặt hàng tại Cửa Hàng Minh Hiền!", "",
      "Mã đơn hàng: " + (data.orderCode || ""),
      "Trạng thái: " + status, "",
      "Sản phẩm:", itemsText, "",
      "Phí vận chuyển: " + (data.shippingFee || 0) + "đ",
      "Tổng tiền: " + (data.total || 0) + "đ", "",
      "Hình thức nhận hàng: " + fulfillmentLabel,
      "Địa chỉ: " + (data.address || "(tới lấy tại cửa hàng)"),
      "Thanh toán: " + paymentLabel, "",
      paymentNote, "",
      "Xem lại đơn hàng bất cứ lúc nào tại: https://beonewbiecoder.github.io/website-minh-hien/don-hang-cua-toi.html", "",
      "Cần hỗ trợ, gọi hotline 091 815 9870 hoặc nhắn Zalo.",
      "Cửa Hàng Minh Hiền"
    ].join("\n");
    sendEmailSafe_(
      data.email,
      "Xác nhận đơn hàng " + (data.orderCode || "") + " - Cửa Hàng Minh Hiền",
      customerBody
    );
  }
}

// Gửi email, tự bắt lỗi + ghi log lại (Apps Script > Executions) thay vì để lỗi
// ném ra làm dừng cả hàm — 1 email gửi thất bại (hết quota Gmail, sai định dạng...)
// không được làm mất luôn email còn lại (chủ shop / khách hàng) trong cùng 1 lần
// đặt/huỷ đơn.
function sendEmailSafe_(to, subject, body, options) {
  try {
    MailApp.sendEmail(to, subject, body, options || {});
  } catch (err) {
    console.error("Gửi email thất bại tới " + to + " (" + subject + "): " + err);
  }
}

// Xác thực lại idToken Firebase với chính máy chủ Google (Identity Toolkit) —
// KHÔNG tin trực tiếp email do trình duyệt gửi lên, tránh khách giả email
// người khác để xem/huỷ đơn của họ. Trả về email đã xác minh, hoặc null.
// Trả về { email, error } thay vì chỉ email/null — giữ lại lý do thất bại cụ thể
// (mã lỗi HTTP, nội dung Google trả về...) để hiện ra khi debug, thay vì chỉ
// biết chung chung "xác thực thất bại" mà không rõ tại đâu.
function verifyFirebaseIdToken_(idToken) {
  if (!idToken) return { email: null, error: "Thiếu token đăng nhập (idToken rỗng)." };
  if (!FIREBASE_API_KEY) return { email: null, error: "Server (Code.gs) chưa điền FIREBASE_API_KEY." };
  try {
    const res = UrlFetchApp.fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY,
      {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ idToken: idToken }),
        muteHttpExceptions: true
      }
    );
    const code = res.getResponseCode();
    const bodyText = res.getContentText();
    if (code !== 200) {
      return { email: null, error: "Google từ chối xác thực (mã " + code + "): " + bodyText.slice(0, 300) };
    }
    const data = JSON.parse(bodyText);
    const user = data.users && data.users[0];
    if (!user || !user.email) {
      return { email: null, error: "Xác thực thành công nhưng không thấy email trong phản hồi." };
    }
    return { email: user.email, error: null };
  } catch (err) {
    return { email: null, error: "Lỗi khi gọi Google xác thực: " + String(err) };
  }
}

function handleMyOrders_(data) {
  const auth = verifyFirebaseIdToken_(data.idToken);
  if (!auth.email) {
    return jsonOutput_({ success: false, error: auth.error });
  }
  const email = auth.email;
  const sheet = getSheet_(SHEET_ORDERS);
  ensureOrdersHeader_(sheet);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return jsonOutput_({ success: true, orders: [] });
  const headers = rows[0];
  const idx = function (name) { return headers.indexOf(name); };
  const emailLower = email.trim().toLowerCase();

  const orders = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowEmail = String(row[idx("Email")] || "").trim().toLowerCase();
    if (!rowEmail || rowEmail !== emailLower) continue;

    let items = [];
    try { items = JSON.parse(row[idx("Chi tiết SP (JSON)")] || "[]"); } catch (e) { items = []; }

    orders.push({
      orderCode: row[idx("Mã đơn hàng")],
      date: formatDateVN_(row[idx("Thời gian")]),
      status: row[idx("Trạng thái")],
      total: Number(row[idx("Tổng tiền")]) || 0,
      items: items,
      fulfillment: row[idx("Hình thức nhận hàng")] || "",
      schedule: row[idx("Hẹn ngày giờ nhận/giao hàng")] || ""
    });
  }
  orders.reverse(); // mới nhất trước
  return jsonOutput_({ success: true, orders: orders });
}

function handleCancelOrder_(data) {
  const auth = verifyFirebaseIdToken_(data.idToken);
  if (!auth.email) {
    return jsonOutput_({ success: false, error: auth.error });
  }
  const email = auth.email;
  const orderCode = data.orderCode;
  if (!orderCode) return jsonOutput_({ success: false, error: "Thiếu mã đơn hàng." });

  const sheet = getSheet_(SHEET_ORDERS);
  ensureOrdersHeader_(sheet);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return jsonOutput_({ success: false, error: "Không tìm thấy đơn hàng." });
  const headers = rows[0];
  const idx = function (name) { return headers.indexOf(name); };
  const emailLower = email.trim().toLowerCase();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (String(row[idx("Mã đơn hàng")]) !== String(orderCode)) continue;

    const rowEmail = String(row[idx("Email")] || "").trim().toLowerCase();
    if (!rowEmail || rowEmail !== emailLower) {
      return jsonOutput_({ success: false, error: "Bạn không có quyền huỷ đơn này." });
    }
    const currentStatus = row[idx("Trạng thái")];
    if (CANCELABLE_STATUSES.indexOf(currentStatus) === -1) {
      return jsonOutput_({ success: false, error: "Đơn hàng này không còn huỷ được." });
    }

    sheet.getRange(r + 1, idx("Trạng thái") + 1).setValue(STATUS_DA_HUY);

    let items = [];
    try { items = JSON.parse(row[idx("Chi tiết SP (JSON)")] || "[]"); } catch (e) { items = []; }
    adjustStockForItems_(items, 1);

    sendCancelNotificationEmails_(row, headers, orderCode);

    return jsonOutput_({ success: true });
  }
  return jsonOutput_({ success: false, error: "Không tìm thấy đơn hàng." });
}

// Gửi email báo huỷ đơn — 1 bản cho chủ shop (bôi đỏ để dễ nhận ra ngay trong
// hộp thư, khác hẳn email "Đơn hàng mới" bình thường) và 1 bản cho khách (nếu
// đơn có email, tức khách đã đăng nhập lúc đặt).
function sendCancelNotificationEmails_(row, headers, orderCode) {
  const idx = function (name) { return headers.indexOf(name); };
  const name = row[idx("Họ tên")] || "";
  const phone = row[idx("Điện thoại")] || "";
  const email = row[idx("Email")] || "";
  const itemsText = row[idx("Sản phẩm")] || "";
  const total = row[idx("Tổng tiền")] || 0;

  const shopPlainBody = [
    "Đơn hàng " + orderCode + " VỪA BỊ HUỶ bởi khách hàng.", "",
    "Khách hàng: " + name,
    "Điện thoại: " + phone,
    "Email: " + (email || "(không có)"), "",
    "Sản phẩm:", itemsText, "",
    "Tổng tiền: " + total + "đ"
  ].join("\n");
  const shopHtmlBody = ""
    + '<div style="background:#fdeeec;color:#b3392f;padding:14px 18px;border-radius:8px;'
    + 'font-weight:bold;font-size:16px;margin-bottom:16px;">⚠ ĐƠN HÀNG ĐÃ BỊ HUỶ BỞI KHÁCH HÀNG</div>'
    + '<p><b>Mã đơn hàng:</b> ' + orderCode + '</p>'
    + '<p><b>Khách hàng:</b> ' + name + '<br><b>Điện thoại:</b> ' + phone + '<br><b>Email:</b> ' + (email || "(không có)") + '</p>'
    + '<p><b>Sản phẩm:</b><br>' + String(itemsText).replace(/\n/g, "<br>") + '</p>'
    + '<p><b>Tổng tiền:</b> ' + total + 'đ</p>';
  sendEmailSafe_(NOTIFY_EMAIL, "[ĐÃ HUỶ] Đơn hàng " + orderCode, shopPlainBody, { htmlBody: shopHtmlBody });

  if (email) {
    const customerBody = [
      "Đơn hàng " + orderCode + " của bạn đã được huỷ theo yêu cầu.", "",
      "Sản phẩm:", itemsText, "",
      "Tổng tiền: " + total + "đ", "",
      "Nếu đây không phải yêu cầu của bạn hoặc cần hỗ trợ thêm, vui lòng gọi hotline 091 815 9870.", "",
      "Cửa Hàng Minh Hiền"
    ].join("\n");
    sendEmailSafe_(email, "Đơn hàng " + orderCode + " đã được huỷ - Cửa Hàng Minh Hiền", customerBody);
  }
}

// Trigger đơn giản (tự chạy, KHÔNG cần bật gì thêm trong Apps Script) — khi
// chủ shop tự tay sửa cột "Trạng thái" trong Sheet thành "Đã huỷ", tự động
// hoàn tồn kho giống hệt như khi khách tự huỷ ở trang "Đơn hàng của tôi".
function onEdit(e) {
  try {
    const sheet = e.range.getSheet();
    if (sheet.getName() !== SHEET_ORDERS) return;
    if (e.range.getRow() === 1) return;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const statusCol = headers.indexOf("Trạng thái") + 1;
    if (statusCol === 0 || e.range.getColumn() !== statusCol) return;

    const newStatus = e.value;
    const oldStatus = e.oldValue;
    if (newStatus !== STATUS_DA_HUY || oldStatus === STATUS_DA_HUY) return;

    const rowValues = sheet.getRange(e.range.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
    const idx = function (name) { return headers.indexOf(name); };
    let items = [];
    try { items = JSON.parse(rowValues[idx("Chi tiết SP (JSON)")] || "[]"); } catch (err) { items = []; }
    adjustStockForItems_(items, 1);
  } catch (err) {
    // Im lặng bỏ qua lỗi trong trigger — không được làm hỏng thao tác sửa Sheet của chủ shop
  }
}

// sign = -1 để trừ (lúc tạo đơn), +1 để hoàn (lúc huỷ đơn)
function adjustStockForItems_(items, sign) {
  if (!items || !items.length) return;
  const sheet = getSheet_(SHEET_PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;
  const headers = rows[0];
  const idCol = headers.indexOf("ID");
  const stockCol = headers.indexOf("Tồn kho");
  if (idCol === -1 || stockCol === -1) return; // Sheet chưa có cột tồn kho — bỏ qua, không lỗi

  items.forEach(function (item) {
    if (!item.id) return;
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][idCol]) === String(item.id)) {
        const current = Number(rows[r][stockCol]) || 0;
        const next = Math.max(0, current + sign * (Number(item.qty) || 0));
        sheet.getRange(r + 1, stockCol + 1).setValue(next);
        break;
      }
    }
  });
  // Gọi 1 lần duy nhất sau khi cập nhật xong hết sản phẩm trong đơn (không gọi
  // lặp lại trong vòng lặp trên) — báo GitHub build lại dữ liệu tĩnh vì tồn kho
  // vừa đổi.
  triggerProductsRebuild_();
}

function formatDateVN_(value) {
  try {
    return Utilities.formatDate(new Date(value), "GMT+7", "dd/MM/yyyy HH:mm");
  } catch (e) {
    return String(value || "");
  }
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

  const stockIdx = idx("Tồn kho");

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

    // Cột "Tồn kho" là tuỳ chọn — nếu Sheet chưa có cột này thì coi như không giới hạn (999)
    let stock = 999;
    if (stockIdx !== -1) {
      const v = Number(row[stockIdx]);
      stock = isNaN(v) ? 999 : v;
    }

    // Cột "Hình ảnh" lưu nhiều URL cách nhau bằng dấu phẩy (do trang quản lý
    // sản phẩm tự ghi vào sau khi tải ảnh lên Drive) — tuỳ chọn, sản phẩm chưa
    // có ảnh thật thì mảng rỗng, giao diện tự dùng icon SVG thay thế.
    const imagesIdx = idx("Hình ảnh");
    const images = imagesIdx !== -1
      ? String(row[imagesIdx] || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean)
      : [];
    const model3dIdx = idx("Model 3D");
    const model3d = model3dIdx !== -1 ? String(row[model3dIdx] || "").trim() : "";
    // Mô tả chi tiết (tuỳ chọn) — hiện ở cuối trang chi tiết sản phẩm, sau phần
    // "Sản phẩm liên quan", KHÔNG hiện ở khu vực đầu trang để giữ gọn/tối giản.
    const longDescIdx = idx("Mô tả chi tiết");
    const longDesc = longDescIdx !== -1 ? String(row[longDescIdx] || "").trim() : "";

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
      stock: stock,
      // Cột "Tình trạng" là tuỳ chọn — nếu Sheet chưa có cột này thì mặc định Còn hàng
      status: String(row[idx("Tình trạng")] || "Còn hàng").trim(),
      images: images,
      model3d: model3d,
      longDesc: longDesc
    });
  }
  return products;
}

/* =========================================================
   QUẢN LÝ SẢN PHẨM (trang quan-ly-san-pham.html) — chỉ ADMIN_EMAILS
   được phép, xác thực lại idToken với Google giống hệt cơ chế đơn hàng.
   ========================================================= */

function isAdminEmail_(email) {
  const lower = String(email || "").trim().toLowerCase();
  return ADMIN_EMAILS.some(function (e) { return e.toLowerCase() === lower; });
}

// Xác thực idToken + kiểm tra có trong ADMIN_EMAILS không. Trả về { email, error } —
// error khác null nghĩa là chưa đăng nhập / không phải Google thật / không có quyền.
function verifyAdmin_(idToken) {
  const auth = verifyFirebaseIdToken_(idToken);
  if (!auth.email) return { email: null, error: auth.error };
  if (!isAdminEmail_(auth.email)) {
    return { email: null, error: "Tài khoản " + auth.email + " không có quyền quản lý sản phẩm." };
  }
  return { email: auth.email, error: null };
}

// Các cột PHẢI có trong Sheet Products để trang quản lý ghi được đầy đủ dữ liệu.
// Không đụng tới cột nào khác đã có sẵn (không overwrite header như Orders) —
// chỉ tự thêm cột nào còn thiếu vào cuối, an toàn với Sheet Products đã có dữ
// liệu/thứ tự cột tự sắp xếp từ trước.
const PRODUCTS_REQUIRED_COLUMNS_ = ["ID", "Tên sản phẩm", "Danh mục", "Kích thước", "Giá (VNĐ)", "Đơn vị",
  "Mô tả", "Mô tả chi tiết", "Nhãn nổi bật", "Icon", "Tình trạng", "Tồn kho", "Hình ảnh", "Model 3D",
  "Thông số 1 - Tên", "Thông số 1 - Giá trị", "Thông số 2 - Tên", "Thông số 2 - Giá trị",
  "Thông số 3 - Tên", "Thông số 3 - Giá trị", "Thông số 4 - Tên", "Thông số 4 - Giá trị",
  "Thông số 5 - Tên", "Thông số 5 - Giá trị"];

function ensureProductsColumns_(sheet) {
  const lastCol = sheet.getLastColumn();
  const currentHeader = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  const missing = PRODUCTS_REQUIRED_COLUMNS_.filter(function (h) { return currentHeader.indexOf(h) === -1; });
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
}

function getOrCreateProductImagesFolder_() {
  const folders = DriveApp.getFoldersByName(PRODUCT_IMAGES_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(PRODUCT_IMAGES_FOLDER_NAME);
}

// CHẠY TAY 1 LẦN để xin quyền Google Drive (chọn hàm này ở dropdown cạnh nút
// Run, bấm Run) — chạm trực tiếp vào DriveApp nên chắc chắn sẽ hiện popup xin
// quyền nếu chưa cấp. Chạy xong không lỗi gì thì xem "Nhật ký thực thi" thấy
// dòng "OK - Thư mục Drive đã sẵn sàng" là xong, không cần chạy lại nữa.
function testDriveAccess() {
  const folder = getOrCreateProductImagesFolder_();
  console.log("OK - Thư mục Drive đã sẵn sàng: " + folder.getUrl());
}

// images: mảng { name, mimeType, base64 } gửi từ trang quản lý (đọc file bằng
// FileReader phía trình duyệt) — lưu vào Drive, đặt quyền "ai có link cũng xem
// được", trả về URL hiển thị trực tiếp được bằng thẻ <img>.
function saveProductImagesToDrive_(images) {
  if (!images || !images.length) return [];
  const folder = getOrCreateProductImagesFolder_();
  return images.map(function (img) {
    const blob = Utilities.newBlob(Utilities.base64Decode(img.base64), img.mimeType, img.name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  });
}

// Tự động gọi GitHub Actions build lại js/products-data.js (dữ liệu sản phẩm
// tĩnh, tải nhanh cho khách xem — xem scripts/build-products.js) ngay khi sản
// phẩm hoặc tồn kho thay đổi, thay vì phải đợi tới lịch chạy định kỳ 30 phút.
// Cần Script Property "GITHUB_TOKEN" (Personal Access Token, quyền "Actions:
// write" + "Contents: write" trên đúng repo này) — thiếu thì bỏ qua, không lỗi
// (vẫn còn lịch chạy định kỳ làm lưới an toàn). Không bao giờ để lỗi ở đây làm
// hỏng việc lưu sản phẩm/đơn hàng chính — luôn bọc try/catch, chỉ ghi log.
function triggerProductsRebuild_() {
  try {
    const token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
    if (!token) {
      console.error("Chưa cấu hình GITHUB_TOKEN trong Script Properties — bỏ qua tự động build sản phẩm (vẫn có lịch chạy định kỳ 30 phút).");
      return;
    }
    UrlFetchApp.fetch(
      "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/actions/workflows/" + GITHUB_PRODUCTS_WORKFLOW + "/dispatches",
      {
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/vnd.github+json"
        },
        payload: JSON.stringify({ ref: "master" }),
        muteHttpExceptions: true
      }
    );
  } catch (err) {
    console.error("Lỗi khi tự động trigger build sản phẩm: " + err);
  }
}

function handleAdminSaveProduct_(data) {
  const admin = verifyAdmin_(data.idToken);
  if (!admin.email) return jsonOutput_({ success: false, error: admin.error });

  const sheet = getSheet_(SHEET_PRODUCTS);
  ensureProductsColumns_(sheet);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = function (name) { return headers.indexOf(name); };

  const rows = sheet.getDataRange().getValues();
  let rowNum = -1; // số dòng thật trên Sheet (1-based), -1 = chưa tìm thấy (tạo mới)
  let id = String(data.id || "").trim();
  if (id) {
    for (let r = 1; r < rows.length; r++) {
      if (String(rows[r][idx("ID")]) === id) { rowNum = r + 1; break; }
    }
  }
  if (!id) {
    id = slugify_(data.name || "san-pham");
    // Tránh trùng ID với sản phẩm đã có — thêm hậu tố số nếu cần
    const existingIds = rows.slice(1).map(function (r) { return String(r[idx("ID")]); });
    let uniqueId = id, n = 2;
    while (existingIds.indexOf(uniqueId) !== -1) { uniqueId = id + "-" + n; n++; }
    id = uniqueId;
  }

  const newImageUrls = saveProductImagesToDrive_(data.newImages || []);
  const keptImageUrls = Array.isArray(data.keepImageUrls) ? data.keepImageUrls : [];
  const allImages = keptImageUrls.concat(newImageUrls);

  // Ghi lại đúng tên tiếng Việt đầy đủ (không phải slug "ong-thuy-luc") vào cột
  // Danh mục — khớp quy ước cột này đang dùng từ trước (dễ đọc nếu chủ shop mở
  // Sheet ra xem trực tiếp), getProducts() vẫn tự nhận diện đúng qua CATEGORY_MAP.
  const CATEGORY_LABELS_ = { "ong-thuy-luc": "Ống thủy lực", "rac-co": "Rắc co & Đầu nối" };

  const specs = data.specs || [];
  const rowValues = {};
  rowValues["ID"] = id;
  rowValues["Tên sản phẩm"] = data.name || "";
  rowValues["Danh mục"] = CATEGORY_LABELS_[data.category] || data.category || "";
  rowValues["Kích thước"] = data.size || "";
  rowValues["Giá (VNĐ)"] = Number(data.price) || 0;
  rowValues["Đơn vị"] = data.unit || "cái";
  rowValues["Mô tả"] = data.desc || "";
  rowValues["Mô tả chi tiết"] = data.longDesc || "";
  rowValues["Nhãn nổi bật"] = data.badge || "";
  rowValues["Icon"] = data.icon || "";
  rowValues["Tình trạng"] = data.status || "Còn hàng";
  rowValues["Tồn kho"] = Number(data.stock) || 0;
  rowValues["Hình ảnh"] = allImages.join(",");
  rowValues["Model 3D"] = data.model3d || "";
  for (let s = 0; s < 5; s++) {
    rowValues["Thông số " + (s + 1) + " - Tên"] = (specs[s] && specs[s].name) || "";
    rowValues["Thông số " + (s + 1) + " - Giá trị"] = (specs[s] && specs[s].value) || "";
  }

  if (rowNum === -1) {
    const newRow = new Array(headers.length).fill("");
    Object.keys(rowValues).forEach(function (key) {
      const col = idx(key);
      if (col !== -1) newRow[col] = rowValues[key];
    });
    sheet.appendRow(newRow);
  } else {
    Object.keys(rowValues).forEach(function (key) {
      const col = idx(key);
      if (col !== -1) sheet.getRange(rowNum, col + 1).setValue(rowValues[key]);
    });
  }

  triggerProductsRebuild_();
  return jsonOutput_({ success: true, id: id, images: allImages });
}

function handleAdminDeleteProduct_(data) {
  const admin = verifyAdmin_(data.idToken);
  if (!admin.email) return jsonOutput_({ success: false, error: admin.error });

  const id = String(data.id || "").trim();
  if (!id) return jsonOutput_({ success: false, error: "Thiếu ID sản phẩm." });

  const sheet = getSheet_(SHEET_PRODUCTS);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("ID");
  if (idCol === -1) return jsonOutput_({ success: false, error: "Sheet Products chưa có cột ID." });

  for (let r = 1; r < rows.length; r++) {
    if (String(rows[r][idCol]) === id) {
      sheet.deleteRow(r + 1);
      triggerProductsRebuild_();
      return jsonOutput_({ success: true });
    }
  }
  return jsonOutput_({ success: false, error: "Không tìm thấy sản phẩm." });
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

// Chỉ đưa sản phẩm CÒN HÀNG (còn tồn kho, không bị đánh dấu hết) vào ngữ
// cảnh cho AI, tránh tư vấn nhầm hàng đã hết.
function getAvailableProductsContext_() {
  const products = getProducts();
  const available = products.filter(function (p) {
    const statusHetHang = String(p.status || "").toLowerCase().indexOf("hết") !== -1;
    return p.stock > 0 && !statusHetHang;
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

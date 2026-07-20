# CLAUDE.md — Ngữ cảnh project website Minh Hiền Hydraulics

> File này để 1 phiên Claude Code mới đọc vào là hiểu ngay hiện trạng, không cần người dùng giải thích lại từ đầu. Nội dung được viết dựa trên việc đọc trực tiếp code thật + `git log`, không dựa vào suy đoán.

## 1. Tổng quan project

- Website bán hàng cho **Cửa Hàng Minh Hiền** — chuyên ống thủy lực và rắc co, phụ kiện thủy lực cho máy công trình, nhà xưởng, cơ khí chế tạo.
- Đối tượng khách hàng chính: GenX/GenY, phần lớn **lowtech** (lớn tuổi, không rành công nghệ) → mọi quyết định thiết kế ưu tiên dễ nhìn, chữ to, nút rõ ràng có label (không icon-only), bố cục tối giản.
- Hạ tầng: **hoàn toàn miễn phí, không backend riêng**
  - Hosting tĩnh: **GitHub Pages** — repo `beonewbiecoder/website-minh-hien`, nhánh `master`, live tại `https://beonewbiecoder.github.io/website-minh-hien/`
  - Dữ liệu + backend logic: **Google Sheet + Google Apps Script** (Web App), gọi thêm **Gemini API** cho chat AI
  - Không có build step, không npm — HTML/CSS/JS thuần, mở file là chạy được
- Lý do chọn hạ tầng này: project đang ở giai đoạn thử nghiệm, chưa tạo doanh thu ổn định, cần giữ chi phí vận hành = 0 đồng.

## 2. Cấu trúc file/trang hiện có

**Trang (8 file HTML, đều load chung `js/config.js` → `data.js` → `cart.js` → `main.js`):**

| File | Chức năng |
|---|---|
| `index.html` | Trang chủ: hero, ô tìm kiếm sản phẩm (có dropdown gợi ý), danh mục, sản phẩm nổi bật, vì sao chọn, đánh giá khách hàng (mẫu) |
| `san-pham.html` | Danh sách sản phẩm: lọc theo danh mục + tìm kiếm mờ (Fuse.js), thanh lọc/tìm kiếm sticky khi cuộn |
| `san-pham-chi-tiet.html` | Chi tiết 1 sản phẩm theo `?id=`, chọn số lượng, thêm giỏ hàng, sản phẩm liên quan |
| `gio-hang.html` | Giỏ hàng (localStorage): sửa số lượng, xóa, tính tổng |
| `thanh-toan.html` | Form thông tin nhận hàng → gửi đơn qua Apps Script + hiện 3 kênh xác nhận: gọi điện / Zalo / email |
| `gioi-thieu.html` | Giới thiệu cửa hàng, sứ mệnh/tầm nhìn, quy trình phục vụ 4 bước |
| `trai-nghiem.html` | Đánh giá khách hàng (**dữ liệu mẫu, chưa phải thật** — xem mục 8) + tin tức/mẹo kỹ thuật |
| `lien-he.html` | Thông tin liên hệ, bản đồ Google Maps thật, form gửi yêu cầu tư vấn |

**JS (`js/`):**

| File | Chức năng |
|---|---|
| `config.js` | Toàn bộ hằng số cấu hình dùng chung site (xem mục 4) |
| `data.js` | `CATEGORIES`, `PRODUCTS` (17 sản phẩm mẫu) + `refreshProductsFromSheet()` đồng bộ từ Sheet |
| `cart.js` | Giỏ hàng localStorage: add/update/remove, `cartDetailed()`, `showToast()` |
| `main.js` | File lớn nhất — icon SVG sản phẩm, nav mobile, thanh liên hệ nhanh (mobile bar + desktop fab), widget chat AI, card sản phẩm, listing/filter, sticky toolbar, redirect tìm kiếm trang chủ |
| `search.js` | Fuzzy search: `normalizeVN()`, `buildFuseIndex()`, `fuzzySearchProducts()`, dropdown gợi ý dùng chung cho trang chủ + trang sản phẩm |

**CSS:** `css/style.css` — 1 file duy nhất, design token khai báo ở `:root` (xem mục 3).

**Backend (`google-apps-script/`):**

| File | Ghi chú |
|---|---|
| `Code.gs` | **Bản tham chiếu** trong repo — mã nguồn thật đang chạy nằm trong Apps Script editor của Google Sheet (do người dùng tự dán vào và deploy). Sửa file này trong repo KHÔNG tự động cập nhật bản đang chạy. |
| `products-seed.tsv` | Dữ liệu mẫu 17 sản phẩm để paste vào tab Products |
| `tudien-seed.tsv` | Mẫu từ điển "cách nói dân dã → thuật ngữ chuẩn" cho tab TuDien |
| `faq-seed.tsv` | Mẫu câu hỏi thường gặp cho tab FAQ |

## 3. Tiêu chí thiết kế đã thống nhất (áp dụng cho MỌI tính năng mới)

- Tông màu chủ đạo xanh dương (`--navy: #123049`) + cam làm accent (`--accent: #e07b28`), đồng bộ toàn site. **Không dùng xanh lá cho nút gọi điện.**
- Nút bấm: tối thiểu ~48px chiều cao, luôn có chữ rõ ràng kèm icon — không icon-only.
- Thành phần nổi (floating button, sticky bar, popup): bo góc (`--radius` 10px / `--radius-lg` 16px), box-shadow nhẹ, cách mép màn hình 14-20px, không dính sát mép.
- Responsive: thiết kế riêng cho mobile và desktop khi ngữ cảnh dùng khác nhau — ví dụ thanh liên hệ nhanh là **thanh ngang ở đáy** trên mobile, nhưng là **cột icon nổi bên phải, giữa màn hình theo chiều dọc** trên desktop (xem mục 5).
- **z-index đã dùng — tránh đụng khi thêm phần tử fixed/sticky mới:**
  - `.site-header` (sticky, top): `100`
  - `.main-nav` mở trên mobile (overlay): `99`
  - `.product-toolbar` (sticky search/filter): `90`
  - `.mobile-contact-bar`, `.desktop-fab`: `150`
  - `.search-dropdown`: `160`
  - `.ai-chat-backdrop`: `198`, `.ai-chat-panel`: `199`, `.ai-chat-bubble`: `200`
  - `.toast`: `200`
- Khi chat AI mở (`body.ai-chat-open`) hoặc menu mobile mở (`body.nav-open`), các thanh liên hệ nhanh tự ẩn để tránh chồng lấn — dùng CSS descendant selector trên class `<body>`, không phải z-index đơn thuần.

## 4. Thông tin cấu hình cố định (tất cả nằm trong `js/config.js`, không hard-code rải rác)

```
BRAND_SHORT_NAME    = "Cửa Hàng Minh Hiền"
CONTACT_PHONE       = "0918159870"
CONTACT_PHONE_DISPLAY = "091 815 9870"
ZALO_URL            = "https://zalo.me/0918159870"   // số Zalo CÁ NHÂN tạm, chưa có Zalo OA — chỉ cần đổi biến này khi có OA
CONTACT_EMAIL       = "minhhien.bz@gmail.com"
CONTACT_ADDRESS     = "11 Thái Phiên, Phường Minh Phụng, TP. Hồ Chí Minh"
CONTACT_HOURS       = "Thứ Hai – Thứ Bảy: 7:00 – 17:00"
MAPS_URL            = "https://maps.app.goo.gl/xZ1LxMxwxvJL9X4x6"   // link Google Business Profile thật
MAPS_EMBED_URL      = tọa độ chính xác (10.754757, 106.6448351), KHÔNG geocode theo chữ địa chỉ
APPS_SCRIPT_URL     = URL Web App đã deploy (script.google.com/macros/s/.../exec)
```

Trong `google-apps-script/Code.gs` (phía server):
```
NOTIFY_EMAIL    = "minhhien.bz@gmail.com"   // nhận báo đơn hàng/liên hệ mới
EMAIL_CHU_SHOP  = ""   // để trống thì dùng chung NOTIFY_EMAIL; nhận báo khi khách bấm "gặp chuyên viên" trong chat AI
GEMINI_MODEL    = "gemini-2.5-flash"
GEMINI_API_KEY  = lưu trong Script Properties (Project Settings), KHÔNG có trong code, KHÔNG lộ ra frontend
```

## 5. Các tính năng đã triển khai (kiểm tra thực tế trong code, không phải trí nhớ)

| Tính năng | Trạng thái | File chính | Cơ chế |
|---|---|---|---|
| Giỏ hàng | ✅ Hoàn thành | `js/cart.js` | localStorage, không có cổng thanh toán online — chốt đơn qua gọi điện/Zalo/email |
| Đồng bộ sản phẩm từ Sheet | ✅ Hoàn thành | `js/data.js` (`refreshProductsFromSheet`) | Fetch `APPS_SCRIPT_URL?action=products`, ghi đè `PRODUCTS`, bắn event `products-updated` để mọi trang re-render |
| Đơn hàng → Sheet + email | ✅ Hoàn thành | `thanh-toan.html`, `Code.gs` (`saveOrder`) | POST `type:"order"`, ghi tab Orders, `MailApp` gửi `NOTIFY_EMAIL` |
| Liên hệ → Sheet + email | ✅ Hoàn thành | `lien-he.html`, `Code.gs` (`saveContact`) | POST `type:"contact"`, ghi tab Contacts, gửi email |
| Thanh liên hệ nhanh (mobile) | ✅ Hoàn thành | `main.js` (`renderContactBar`), CSS `.mobile-contact-bar` | Thanh ngang cố định đáy màn hình, 2 nút Gọi điện/Zalo, chỉ hiện ≤768px |
| Nhóm nút nổi (desktop) | ✅ Hoàn thành | cùng `renderContactBar`, CSS `.desktop-fab` | Cột dọc bên phải, giữa màn hình theo chiều dọc, icon-only mặc định, hover hiện label, chỉ hiện ≥769px |
| Chat widget AI (Gemini) | ✅ Hoàn thành (giao diện + logic) | `main.js` (`renderAIChatWidget`), `Code.gs` (`handleChat_`, `callGemini_`) | Nút icon robot (bubble mobile, gộp vào nhóm fab desktop), popup có nút "Tư vấn với chuyên viên kỹ thuật" cố định không cuộn mất. AI trả lời dựa trên context ghép từ Products (chỉ hàng còn)/TuDien/FAQ, có system prompt cấm bịa dữ liệu |
| Log hội thoại chat vào Sheet | ✅ Hoàn thành | `Code.gs` (`logChatTurn_`) | Mỗi lượt hỏi-đáp ghi 1 dòng vào tab ChatLog kèm session id (lưu ở `sessionStorage`, tồn tại xuyên suốt phiên duyệt web) |
| Nút "Tư vấn với chuyên viên kỹ thuật" | ✅ Hoàn thành | `Code.gs` (`handleChatEscalate_`, `sendEscalationEmail_`) | Ghi log "Có" + gửi email tóm tắt 5 tin nhắn gần nhất trong phiên + mở Zalo tab mới |
| Link Google Maps | ✅ Hoàn thành | `lien-he.html`, `js/config.js` | Toạ độ chính xác từ Business Profile thật, có nút "Mở trong Google Maps", địa chỉ ở footer 8 trang đều là link |
| Tìm kiếm mờ (Fuse.js) | ✅ Hoàn thành | `js/search.js` | CDN `jsdelivr`, chuẩn hoá tiếng Việt bỏ dấu cho cả dữ liệu và câu gõ, weighted keys, đã test gõ sai/thiếu dấu |
| Thanh tìm kiếm sticky (trang sản phẩm) | ✅ Hoàn thành | `main.js` (`initStickyProductToolbar`), CSS `.product-toolbar` | `position:sticky`, `top` đo động bằng JS theo chiều cao header thật, hiệu ứng bóng đổ khi dính (IntersectionObserver + sentinel) |
| Thanh tìm kiếm trang chủ | ✅ Hoàn thành | `index.html`, `main.js` (`initHomeSearchRedirect`) | Có dropdown gợi ý y hệt trang sản phẩm (dùng chung `initSearchDropdown()` đã tổng quát hoá); submit redirect sang `san-pham.html?search=` nếu không chọn gợi ý nào |
| Thông tin thật cửa hàng | ✅ Hoàn thành | tất cả 8 trang | Tên, SĐT, email, địa chỉ, giờ làm việc đã thay hết placeholder |
| Đánh giá khách hàng | ⚠️ **Vẫn là dữ liệu mẫu** | `trai-nghiem.html`, `index.html` | 6 tên/quote bịa (Anh Tuấn, Chú Hùng...) — xem mục 8 |
| Dữ liệu sản phẩm | ⚠️ **Vẫn là 17 sản phẩm mẫu** | `js/data.js` | Chưa phải sản phẩm thật của cửa hàng — xem mục 8 |

## 6. Nguồn dữ liệu (Google Sheet)

Sheet có (hoặc cần có) các tab sau, đọc/ghi qua `Code.gs`:

- **Products** — sản phẩm hiển thị trên site. Cột: `ID, Tên sản phẩm, Danh mục, Kích thước, Giá (VNĐ), Đơn vị, Mô tả, Nhãn nổi bật, Icon, Thông số 1-5 (Tên/Giá trị mỗi cặp)`. Cột **`Tình trạng`** là tuỳ chọn (Còn hàng/Hết hàng) — nếu chưa thêm, code tự mặc định "Còn hàng" cho mọi sản phẩm.
- **Orders** — đơn hàng từ giỏ hàng. Cột: `Thời gian, Họ tên, Điện thoại, Email, Địa chỉ, Ghi chú, Sản phẩm, Tổng tiền`. Tự tạo header khi ghi dòng đầu tiên.
- **Contacts** — yêu cầu tư vấn từ trang Liên hệ. Cột: `Thời gian, Họ tên, Điện thoại, Nội dung`.
- **TuDien** — từ điển giúp AI hiểu cách nói dân dã. Cột: `Cách nói dân dã, Thuật ngữ chuẩn`.
- **FAQ** — câu hỏi thường gặp AI ưu tiên dùng khi khớp. Cột: `Câu hỏi, Câu trả lời`.
- **ChatLog** — log mọi hội thoại chat AI. Cột: `Thời gian, Mã phiên chat, Câu hỏi của khách, Câu trả lời của AI, Yêu cầu tư vấn chuyên viên`.

Tất cả các tab (trừ Products) đều **tự tạo + tự ghi header** ở lần đầu Apps Script cần dùng đến (hàm `getSheet_()` / `getSheetRows_()`), không cần tạo tay trước — riêng TuDien/FAQ nếu để trống thì AI vẫn chạy nhưng thiếu ngữ cảnh.

## 7. Ý tưởng tương lai — CHƯA làm, để dành khi site có doanh thu ổn định

- Model 3D sản phẩm (AI image-to-3D hoặc scan LiDAR)
- AI voice hội thoại kiểu Gemini Live
- Zalo OA chính thức thay cho số Zalo cá nhân hiện tại

## 8. Việc dang dở / cần làm tiếp

- **Đánh giá khách hàng (`trai-nghiem.html`, `index.html`) vẫn là dữ liệu mẫu bịa** — người dùng chủ động quyết định để tạm vì site chưa công khai chính thức (chưa đưa vào hoạt động chính), cần xử lý trước khi quảng bá web thật (thay bằng đánh giá thật, hoặc ẩn đi).
- **Dữ liệu sản phẩm vẫn là 17 sản phẩm mẫu**, chưa phải hàng thật của cửa hàng. Người dùng nói sẽ gửi dữ liệu thật sau và muốn tối ưu lại layout trang sản phẩm cùng lúc — nên gộp 2 việc này làm 1 đợt, đừng sửa riêng lẻ trước.
- **Chưa xác nhận được tab TuDien/FAQ trong Sheet thật đã có dữ liệu hay còn trống** — code đã sẵn sàng dùng, file mẫu đã gửi (`tudien-seed.tsv`, `faq-seed.tsv`), nhưng việc dán vào Sheet là thao tác thủ công của người dùng, không kiểm tra được từ phía code repo. Hỏi lại người dùng nếu cần chắc chắn trước khi tinh chỉnh chất lượng câu trả lời AI.
- **`Code.gs` trong repo chỉ là bản tham chiếu** — mỗi lần sửa file này phải nhắc người dùng copy-paste thủ công vào Apps Script editor thật và Deploy lại (Manage deployments → New version, giữ nguyên URL), nếu không bản đang chạy sẽ không khớp với repo.
- **Cột "Tình trạng" (còn/hết hàng) trong tab Products chưa được thêm** vào Sheet thật (không bắt buộc, có fallback mặc định "Còn hàng") — nếu người dùng muốn AI biết chính xác hàng nào hết, cần thêm cột này thủ công.

---
*Cập nhật lần cuối: 2026-07-20*

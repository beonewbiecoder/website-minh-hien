# CLAUDE.md — Ngữ cảnh project website Minh Hiền Hydraulics

> File này để 1 phiên Claude Code mới đọc vào là hiểu ngay hiện trạng, không cần người dùng giải thích lại từ đầu. Nội dung được viết dựa trên việc đọc trực tiếp code thật + `git log`, không dựa vào suy đoán.

## 1. Tổng quan project

- Website bán hàng cho **Cửa Hàng Minh Hiền** — chuyên ống thủy lực và rắc co, phụ kiện thủy lực cho máy công trình, nhà xưởng, cơ khí chế tạo.
- Đối tượng khách hàng chính: GenX/GenY, phần lớn **lowtech** (lớn tuổi, không rành công nghệ) → mọi quyết định thiết kế ưu tiên dễ nhìn, chữ to, nút rõ ràng có label (không icon-only), bố cục tối giản, **không bắt buộc đăng nhập/đăng ký** để mua hàng (xem mục 5).
- Hạ tầng: **hoàn toàn miễn phí, không backend riêng**
  - Hosting tĩnh: **GitHub Pages** — repo `beonewbiecoder/website-minh-hien`, nhánh `master`, live tại `https://beonewbiecoder.github.io/website-minh-hien/`
  - Dữ liệu + backend logic: **Google Sheet + Google Apps Script** (Web App), gọi thêm **Gemini API** cho chat AI
  - **Firebase Authentication** (project `chmh-e22e1`, miễn phí gói Spark) — CHỈ dùng để xác định danh tính khách đăng nhập (Google + Email/mật khẩu), KHÔNG dùng Firestore hay database nào khác của Firebase
  - **GitHub Actions** (miễn phí trên repo public) — tự build trang bài viết từ Markdown, xem mục 2
  - Không có build step cho site chính, không npm để chạy local — HTML/CSS/JS thuần, mở file là chạy được. Riêng hệ thống bài viết CÓ 1 bước build (Node) nhưng chạy hoàn toàn trên GitHub Actions, người dùng không cần cài gì trên máy.
- Lý do chọn hạ tầng này: project đang ở giai đoạn thử nghiệm, chưa tạo doanh thu ổn định, cần giữ chi phí vận hành = 0 đồng.

## 2. Cấu trúc file/trang hiện có

**Trang chính (11 file HTML ở gốc repo):**

| File | Chức năng |
|---|---|
| `index.html` | Trang chủ: hero, tìm kiếm sản phẩm (dropdown gợi ý), danh mục, sản phẩm nổi bật, vì sao chọn, đánh giá khách hàng (mẫu), section "Kiến thức thủy lực" (3 bài mới nhất) |
| `san-pham.html` | Danh sách sản phẩm: lọc theo danh mục + tìm kiếm mờ (Fuse.js), thanh lọc/tìm kiếm sticky, hiện "Tạm hết hàng"/"Chỉ còn X sản phẩm" theo tồn kho. Thẻ sản phẩm (`productCardHTML` trong `main.js`) là **1 link duy nhất kiểu Shopee** — không còn nút "Thêm vào giỏ"/"Chi tiết" riêng, bấm vào bất kỳ đâu trên thẻ (ảnh/tên/giá) đều vào thẳng trang chi tiết, muốn thêm vào giỏ phải vào trang chi tiết |
| `san-pham-chi-tiet.html` | Chi tiết 1 sản phẩm theo `?id=`. Nút "Thêm vào giỏ hàng" + chọn số lượng đặt ngay cạnh giá (không cần cuộn); ẩn nút mua, hiện "Tạm hết hàng" nếu tồn kho = 0. Có nút **"← Quay lại"** (`#pd-back-btn`) phía trên breadcrumb — dùng `history.back()` để về đúng vị trí đang cuộn ở trang trước đó (kiểu Shopee), chỉ fallback sang link tĩnh `san-pham.html` nếu khách vào thẳng từ link chia sẻ (không có lịch sử cùng site) |
| `gio-hang.html` | Giỏ hàng (localStorage): sửa số lượng (chặn vượt tồn kho), xóa có xác nhận, tính tổng, nút "Tiến hành đặt hàng" |
| `thanh-toan.html` | **Trang thanh toán 1-trang duy nhất** (kiểu Amazon) — xem chi tiết đầy đủ ở mục 5 |
| `gioi-thieu.html` | Giới thiệu cửa hàng, sứ mệnh/tầm nhìn, quy trình phục vụ 4 bước |
| `trai-nghiem.html` | Đánh giá khách hàng (**dữ liệu mẫu, chưa phải thật** — xem mục 8) + tin tức/mẹo kỹ thuật (nội dung mẫu cũ, khác với hệ thống bài viết thật ở `bai-viet.html`) |
| `lien-he.html` | Thông tin liên hệ, bản đồ Google Maps thật, form gửi yêu cầu tư vấn |
| `bai-viet.html` | Danh sách toàn bộ bài viết "Kiến thức thủy lực", phân trang phía trình duyệt (9 bài/trang) |
| `don-hang-cua-toi.html` | Tra cứu đơn hàng theo tài khoản đã đăng nhập, tự huỷ đơn — xem mục 5 |
| `bai-viet/*.html` | Trang chi tiết từng bài viết — **tự động sinh ra**, KHÔNG sửa tay (xem phần build bên dưới) |

Tất cả các trang đều load chung `js/config.js` → `js/data.js` → `js/cart.js` → `js/auth.js` → `js/main.js`, cộng thêm SDK Firebase (`firebase-app-compat.js`, `firebase-auth-compat.js`) qua CDN trước `config.js`.

**JS (`js/`):**

| File | Chức năng |
|---|---|
| `config.js` | Toàn bộ hằng số cấu hình dùng chung site (xem mục 4) |
| `data.js` | `CATEGORIES`, `PRODUCTS` (17 sản phẩm mẫu, có `stock`) + `refreshProductsFromSheet()` đồng bộ từ Sheet |
| `cart.js` | Giỏ hàng localStorage: `addToCart`/`updateCartQty` (chặn vượt tồn kho, trả về `{capped, stock}`), `cartDetailed()`, `showToast()`, `generateOrderCode()`, `buildVietQrUrl()`, `getShippingFee()` |
| `auth.js` | Đăng nhập Google + Email/mật khẩu qua Firebase Auth. Render nút tài khoản (`renderAccountButton`, 2 slot: `#account-slot` desktop + `#account-slot-mobile` trong menu mobile), khung modal đăng nhập email dùng chung toàn site (`renderEmailAuthModal_`/`openEmailAuthModal`), `getCurrentIdToken()` để gọi Apps Script xác thực |
| `main.js` | File lớn nhất — icon SVG sản phẩm, nav mobile (có nút X đóng menu), thanh liên hệ nhanh (mobile bar + desktop fab, chặn bấm Zalo liên tục `guardZaloClick_`), widget chat AI, card sản phẩm (hiện tồn kho), listing/filter, sticky toolbar, redirect tìm kiếm trang chủ, render thẻ bài viết (`renderArticleCards`, `initArticleListing`) |
| `search.js` | Fuzzy search: `normalizeVN()`, `buildFuseIndex()`, `fuzzySearchProducts()`, dropdown gợi ý dùng chung cho trang chủ + trang sản phẩm |
| `articles-data.js` | **Tự động sinh ra** bởi `scripts/build-articles.js` — mảng `ARTICLES` dùng cho trang chủ + `bai-viet.html`. KHÔNG sửa tay. |

**CSS:** `css/style.css` — 1 file duy nhất, design token khai báo ở `:root` (xem mục 3).

**Hệ thống bài viết (build tĩnh từ Markdown):**

| File | Chức năng |
|---|---|
| `bai-viet/*.md` | Nguồn nội dung bài viết — frontmatter (`title`, `description`, `date`, `image`, `slug`) + nội dung Markdown, heading bắt đầu từ `##` (H1 do template tự thêm từ `title`) |
| `scripts/build-articles.js` | Build script Node — đọc `.md`, parse frontmatter, convert Markdown → HTML, tự nhận diện Q&A để sinh JSON-LD `FAQPage`, sinh `bai-viet/<slug>.html` + `js/articles-data.js`. Header/nav trong template này giống hệt các trang khác — sửa nav ở đây thì nhớ sửa cả 11 trang kia (xem mục 3). |
| `.github/workflows/build-articles.yml` | GitHub Actions — tự chạy build script khi push thay đổi vào `bai-viet/**.md`, `scripts/build-articles.js`, hoặc `package.json`; tự commit lại `bai-viet/*.html` + `js/articles-data.js` nếu có thay đổi (bot `github-actions[bot]`) |
| `package.json` | Chỉ dùng cho CI (khai báo dependency `marked` để build) — không liên quan gì đến việc chạy site |

**Backend (`google-apps-script/`):**

| File | Ghi chú |
|---|---|
| `Code.gs` | **Bản tham chiếu** trong repo — mã nguồn thật đang chạy nằm trong Apps Script editor của Google Sheet (do người dùng tự dán vào và deploy). Sửa file này trong repo KHÔNG tự động cập nhật bản đang chạy — **luôn nhắc người dùng copy lại + Deploy > Manage deployments > New version** sau khi sửa. Có thể trỏ người dùng lấy bản mới nhất trực tiếp từ `raw.githubusercontent.com/beonewbiecoder/website-minh-hien/master/google-apps-script/Code.gs` để tránh lỗi copy tay từ khung chat. |
| `products-seed.tsv` | Dữ liệu mẫu 17 sản phẩm để paste vào tab Products |
| `tudien-seed.tsv` | Mẫu từ điển "cách nói dân dã → thuật ngữ chuẩn" cho tab TuDien |
| `faq-seed.tsv` | Mẫu câu hỏi thường gặp cho tab FAQ |

## 3. Tiêu chí thiết kế đã thống nhất (áp dụng cho MỌI tính năng mới)

- Tông màu chủ đạo xanh dương (`--navy: #123049`) + cam làm accent (`--accent: #e07b28`), đồng bộ toàn site. **Không dùng xanh lá cho nút gọi điện.**
- Nút bấm: tối thiểu ~48px chiều cao, luôn có chữ rõ ràng kèm icon — không icon-only.
- Thành phần nổi (floating button, sticky bar, popup): bo góc (`--radius` 10px / `--radius-lg` 16px), box-shadow nhẹ, cách mép màn hình 14-20px, không dính sát mép.
- Responsive: thiết kế riêng cho mobile và desktop khi ngữ cảnh dùng khác nhau — ví dụ thanh liên hệ nhanh là **thanh ngang ở đáy** trên mobile, nhưng là **cột icon nổi bên phải, giữa màn hình theo chiều dọc** trên desktop.
- **Menu chính (`.main-nav`) chuyển sang dạng menu mobile (fixed, toàn màn hình) ở ngưỡng `max-width: 1150px`** — RIÊNG breakpoint này khác với hầu hết breakpoint khác trong file (`900px`), vì menu có 6 mục (kể cả "Đơn hàng của tôi") cần nhiều chỗ hơn ở màn hình desktop cỡ vừa. Đừng nhầm gộp chung 2 giá trị này khi sửa CSS.
- Nút tài khoản (đăng nhập) có 2 bản DOM song song, JS dùng chung: `#account-slot` (thanh header, chỉ hiện ≥1151px) và `#account-slot-mobile` (bên trong menu mobile, đứng đầu danh sách, chỉ hiện ≤1150px) — xem `js/auth.js`. Menu mobile có thêm nút X (`.main-nav-close`) ở góc trên phải để đóng theo bản năng.
- **z-index đã dùng — tránh đụng khi thêm phần tử fixed/sticky mới:**
  - `.site-header` (sticky, top): `100`
  - `.main-nav` mở trên mobile (overlay): `99`
  - `.product-toolbar` (sticky search/filter): `90`
  - `.mobile-contact-bar`, `.desktop-fab`, `.checkout-sticky-bar`: `150`
  - `.search-dropdown`, `.account-menu`: `160`
  - `.ai-chat-backdrop`: `198`, `.ai-chat-panel`: `199`
  - `.toast`: `200`
  - `.email-auth-backdrop`: `210`, `.email-auth-modal`: `211` (cao nhất — modal chặn, phải luôn nổi trên mọi thứ khác)
- Khi chat AI mở (`body.ai-chat-open`), menu mobile mở (`body.nav-open`), hoặc đang ở trang thanh toán (`body.checkout-page`), các thanh liên hệ nhanh/chat AI tự ẩn để tránh chồng lấn — dùng CSS descendant selector trên class `<body>`, không phải z-index đơn thuần.

## 4. Thông tin cấu hình cố định (tất cả nằm trong `js/config.js`, không hard-code rải rác)

```
BRAND_SHORT_NAME    = "Cửa Hàng Minh Hiền"
CONTACT_PHONE       = "0918159870"
CONTACT_PHONE_DISPLAY = "091 815 9870"
ZALO_URL            = "https://zalo.me/0918159870"   // số Zalo CÁ NHÂN tạm, chưa có Zalo OA
CONTACT_EMAIL       = "minhhien.bz@gmail.com"
CONTACT_ADDRESS     = "11 Thái Phiên, Phường Minh Phụng, TP. Hồ Chí Minh"
CONTACT_HOURS       = "Thứ Hai – Thứ Bảy: 7:00 – 17:00"
MAPS_URL            = "https://maps.app.goo.gl/xZ1LxMxwxvJL9X4x6"
MAPS_EMBED_URL      = tọa độ chính xác (10.754757, 106.6448351), KHÔNG geocode theo chữ địa chỉ
APPS_SCRIPT_URL     = URL Web App đã deploy (script.google.com/macros/s/.../exec)

VIETQR_BANK_CODE    = "ACB"
VIETQR_ACCOUNT_NO   = "68329168"
VIETQR_ACCOUNT_NAME = "BANH THUC HIEN"

FIREBASE_CONFIG     = { apiKey, authDomain, projectId: "chmh-e22e1", storageBucket,
                         messagingSenderId, appId }   // ĐÃ điền đầy đủ, đăng nhập Google hoạt động thật
                         // apiKey PHẢI khớp với FIREBASE_API_KEY trong Code.gs (xem dưới)

SHIPPING_FEES       = { near: 20000, mid: 35000, far: 60000 }   // VÍ DỤ TẠM — chủ shop
                         // cần tự chỉnh lại đúng mức phí thật trước khi vận hành chính thức
SHIPPING_ZONES      = danh sách tỉnh/thành gắn theo mức phí trên (dropdown ở trang thanh toán)
```

Trong `google-apps-script/Code.gs` (phía server):
```
NOTIFY_EMAIL     = "minhhien.bz@gmail.com"   // nhận báo đơn hàng mới/huỷ đơn/liên hệ mới
EMAIL_CHU_SHOP   = ""   // để trống thì dùng chung NOTIFY_EMAIL; nhận báo khi khách bấm "gặp chuyên viên" trong chat AI
FIREBASE_API_KEY = đã điền, PHẢI khớp với FIREBASE_CONFIG.apiKey ở trên — dùng để xác thực
                    lại token đăng nhập (gọi Identity Toolkit REST API), tránh khách giả email
                    người khác để xem/huỷ đơn của họ. apiKey Firebase là public, không phải bí mật.
GEMINI_MODEL     = "gemini-2.5-flash"
GEMINI_API_KEY   = lưu trong Script Properties (Project Settings), KHÔNG có trong code
```

**Firebase project đã cấu hình xong (project `chmh-e22e1`):**
- Đã tạo web app, lấy đủ 6 giá trị `FIREBASE_CONFIG`
- Đã bật **Google** làm Sign-in provider, đã thêm `beonewbiecoder.github.io` vào Authorized domains
- Đã cấp quyền `UrlFetchApp` cho Apps Script (chạy tay 1 hàm trong editor để trigger popup xin quyền — bắt buộc phải làm lần đầu vì thêm code gọi ra ngoài mới)
- Đã xác nhận API key không bị giới hạn (Application restrictions = None) trong Google Cloud Console, và Identity Toolkit API đã enabled
- **CHƯA xác nhận đã bật provider "Email/Password"** trong Firebase Console → Authentication → Sign-in method — cần làm để tính năng đăng nhập bằng email hoạt động (đã có sẵn giao diện/code, chỉ thiếu bật ở phía Firebase)

## 5. Các tính năng đã triển khai (kiểm tra thực tế trong code, không phải trí nhớ)

| Tính năng | Trạng thái | File chính | Cơ chế |
|---|---|---|---|
| Giỏ hàng | ✅ Hoàn thành | `js/cart.js` | localStorage, chặn thêm vượt tồn kho |
| Đồng bộ sản phẩm từ Sheet | ✅ Hoàn thành | `js/data.js` (`refreshProductsFromSheet`) | Fetch `APPS_SCRIPT_URL?action=products`, ghi đè `PRODUCTS` (gồm cả `stock`), bắn event `products-updated` |
| **Thanh toán 1 trang (single-page checkout)** | ✅ Hoàn thành | `thanh-toan.html` | Thông tin nhận hàng (giao hàng/tới lấy tại cửa hàng, ẩn ô địa chỉ khi tới lấy) → tóm tắt đơn dạng accordion → phương thức thanh toán COD/chuyển khoản. Nút "Xác nhận đặt hàng" cố định đáy màn hình (`.checkout-sticky-bar`), tự khoá + hiện spinner khi đang gửi (chặn đặt trùng), chỉ mở lại khi lỗi mạng. |
| **Banner mời đăng nhập ở checkout** | ✅ Hoàn thành | `thanh-toan.html` (đầu `renderCheckout`) | Hiện đầu trang thanh toán, có thể bỏ qua — không bắt buộc để đặt hàng. Đổi thành xác nhận màu xanh nếu đã đăng nhập. |
| **Phí vận chuyển theo khu vực** | ✅ Hoàn thành | `js/cart.js` (`getShippingFee`), `js/config.js` (`SHIPPING_FEES`/`SHIPPING_ZONES`) | 3 mức cố định tạm (nội thành/lân cận/tỉnh xa) theo dropdown tỉnh/thành, cộng đúng vào tổng tiền + số tiền QR trước khi khách xác nhận. Ẩn khi chọn "tới lấy tại cửa hàng". |
| **QR chuyển khoản VietQR** | ✅ Hoàn thành | `js/cart.js` (`buildVietQrUrl`) | Ảnh động `img.vietqr.io`, số tiền = tổng giỏ hàng + phí ship, nội dung CK = mã đơn hàng tự sinh (`generateOrderCode`). QR vẫn hiện lại ở trang xác nhận sau khi đặt để khách hoàn tất chuyển khoản. |
| **Đăng nhập Google + Email/mật khẩu** | ✅ Hoàn thành | `js/auth.js` | Firebase Auth, KHÔNG bắt buộc để đặt hàng. Nút tài khoản ở header (desktop) / trong menu mobile. Khung modal email dùng chung toàn site: đăng nhập/đăng ký/quên mật khẩu, thông báo lỗi tiếng Việt. Apple Sign-In **không làm** (cần Apple Developer trả phí $99/năm, trái nguyên tắc miễn phí). Facebook Sign-In cân nhắc sau nếu cần (cần tạo Facebook App riêng). |
| **Trạng thái đơn hàng chuẩn hoá** | ✅ Hoàn thành | `Code.gs` (`STATUS_*`, `saveOrder`), `don-hang-cua-toi.html` (`statusInfo`) | 5 trạng thái: "Chờ xác nhận" (mặc định cho MỌI đơn — cả COD lẫn chuyển khoản — huỷ được), "Đã xác nhận — đang chuẩn bị hàng" (chủ shop tự tay đổi sang SAU KHI đã gọi điện xác nhận thật với khách — hết nút huỷ từ lúc này), "Đang giao", "Hoàn tất", "Đã huỷ". Mọi bước chuyển trạng thái đều là thao tác tay của chủ shop trong Sheet. |
| **Trang "Đơn hàng của tôi"** | ✅ Hoàn thành | `don-hang-cua-toi.html`, `Code.gs` (`handleMyOrders_`) | Cần đăng nhập. Tra cứu đơn theo email đã xác thực lại qua Identity Toolkit (KHÔNG tin email client gửi lên). Badge màu theo trạng thái, tải lại là thấy trạng thái mới nhất chủ shop cập nhật. |
| **Khách tự huỷ đơn** | ✅ Hoàn thành | `don-hang-cua-toi.html`, `Code.gs` (`handleCancelOrder_`) | Chỉ hiện nút huỷ khi đơn ở 2 trạng thái đầu (chưa giao), có xác nhận trước khi huỷ thật. Tự hoàn tồn kho khi huỷ. |
| **Tồn kho tự động** | ✅ Hoàn thành | `Code.gs` (`adjustStockForItems_`, `onEdit`) | Trừ ngay khi tạo đơn (cả COD lẫn chuyển khoản, tránh 2 khách trúng hàng cuối). Hoàn lại khi huỷ — kể cả khi chủ shop **tự tay sửa cột Trạng thái thành "Đã huỷ" trong Sheet** (trigger `onEdit` tự chạy, không cần bật gì thêm). Cột "Tồn kho" trong Products là tuỳ chọn — chưa có thì coi như không giới hạn (999). |
| **Cảnh báo tồn kho trên site** | ✅ Hoàn thành | `js/main.js` (`productCardHTML`), `san-pham-chi-tiet.html` | "Chỉ còn X sản phẩm" khi tồn kho ≤5, ẩn nút mua + hiện "Tạm hết hàng" khi = 0. Giỏ hàng/trang chi tiết đều chặn nhập số lượng vượt tồn kho. |
| **Email xác nhận/huỷ đơn cho khách** | ✅ Hoàn thành | `Code.gs` (`saveOrder`, `sendCancelNotificationEmails_`) | Chỉ gửi được nếu khách đã đăng nhập (mới có email). Nội dung đủ mã đơn, sản phẩm, tổng tiền, trạng thái, hướng dẫn bước tiếp theo. |
| **Email báo chủ shop khi có đơn/huỷ đơn** | ✅ Hoàn thành | `Code.gs` (`saveOrder`, `sendCancelNotificationEmails_`) | Đơn mới: email thường. **Huỷ đơn: email bôi đỏ nổi bật (`htmlBody`)** để phân biệt ngay trong hộp thư, khác iframe với `saveContact`. |
| **Hệ thống bài viết "Kiến thức thủy lực" (SEO+AEO)** | ✅ Hoàn thành | `bai-viet.html`, `bai-viet/*.md`, `scripts/build-articles.js`, `.github/workflows/build-articles.yml` | Viết bài bằng Markdown (frontmatter title/description/date/image/slug) → GitHub Actions tự build ra HTML tĩnh + JSON-LD `Article` (+ `FAQPage` nếu tự nhận diện được câu hỏi dạng heading kết thúc bằng "?"). Đã test qua Google Rich Results Test — hợp lệ, không lỗi. 2 bài mẫu đã có (BSP/NPT, dấu hiệu thay ống). |
| Liên hệ → Sheet + email | ✅ Hoàn thành | `lien-he.html`, `Code.gs` (`saveContact`) | POST `type:"contact"`, ghi tab Contacts, gửi email |
| Thanh liên hệ nhanh (mobile + desktop) | ✅ Hoàn thành | `main.js` (`renderContactBar`) | Ẩn trên trang thanh toán (`body.checkout-page`). Nút Zalo có chặn bấm liên tục 2 giây (`guardZaloClick_`) để giảm khả năng zalo.me báo lỗi — **chưa chắc hết hẳn**, nguyên nhân gốc nghi ở phía Zalo, không phải lỗi code. |
| Chat widget AI (Gemini) | ✅ Hoàn thành | `main.js` (`renderAIChatWidget`), `Code.gs` (`handleChat_`, `callGemini_`) | AI trả lời dựa trên Products (chỉ hàng còn tồn kho > 0)/TuDien/FAQ, cấm bịa dữ liệu |
| Tìm kiếm mờ (Fuse.js) | ✅ Hoàn thành | `js/search.js` | Chuẩn hoá tiếng Việt bỏ dấu, weighted keys |
| Thông tin thật cửa hàng | ✅ Hoàn thành | tất cả các trang | Tên, SĐT, email, địa chỉ, giờ làm việc, Maps thật |
| Đánh giá khách hàng | ⚠️ **Vẫn là dữ liệu mẫu** | `trai-nghiem.html`, `index.html` | Xem mục 8 |
| Dữ liệu sản phẩm | ⚠️ **Vẫn là 17 sản phẩm mẫu** | `js/data.js` | Xem mục 8 |

## 6. Nguồn dữ liệu (Google Sheet)

Sheet có (hoặc cần có) các tab sau, đọc/ghi qua `Code.gs`:

- **Products** — sản phẩm hiển thị trên site. Cột: `ID, Tên sản phẩm, Danh mục, Kích thước, Giá (VNĐ), Đơn vị, Mô tả, Nhãn nổi bật, Icon, Thông số 1-5 (Tên/Giá trị mỗi cặp)`. Cột **`Tình trạng`** (Còn hàng/Hết hàng, tuỳ chọn) và **`Tồn kho`** (số lượng, tuỳ chọn — **chưa xác nhận đã thêm vào Sheet thật**) — thiếu thì code tự mặc định "Còn hàng"/không giới hạn (999).
- **Orders** — đơn hàng. **16 cột theo đúng thứ tự:** `Thời gian, Mã đơn hàng, Trạng thái, Email, Họ tên, Điện thoại, Hình thức nhận hàng, Địa chỉ, Tỉnh/Thành, Phương thức thanh toán, Ghi chú, Sản phẩm, Phí vận chuyển, Tổng tiền, Chi tiết SP (JSON), Hẹn ngày giờ nhận/giao hàng`. Header **tự sửa lại đúng chuẩn mỗi lần có đơn mới/tra cứu** (`ensureOrdersHeader_`) — kể cả khi Sheet đã có header cũ (8-10 cột, hoặc 15 cột từ trước khi có cột hẹn lịch) từ bản trước, không bị lệch cột nữa như lỗi đã gặp và sửa trong phiên làm việc trước. Cột cuối **"Hẹn ngày giờ nhận/giao hàng"** để trống lúc tạo đơn — chủ shop tự nhập tay (dạng chữ tự do, ví dụ "15/07 - 9h sáng") SAU KHI đã gọi điện xác nhận thật với khách; trang "Đơn hàng của tôi" tự hiện khung màu cam nếu cột này có giá trị, ẩn nếu để trống.
- **Contacts** — yêu cầu tư vấn. Cột: `Thời gian, Họ tên, Điện thoại, Nội dung`.
- **TuDien** — từ điển cách nói dân dã cho AI. Cột: `Cách nói dân dã, Thuật ngữ chuẩn`.
- **FAQ** — câu hỏi thường gặp AI ưu tiên dùng. Cột: `Câu hỏi, Câu trả lời`.
- **ChatLog** — log hội thoại chat AI. Cột: `Thời gian, Mã phiên chat, Câu hỏi của khách, Câu trả lời của AI, Yêu cầu tư vấn chuyên viên`.

Tất cả các tab (trừ Products) đều **tự tạo + tự ghi header/tự sửa header đúng chuẩn** khi Apps Script cần dùng đến, không cần tạo tay trước.

## 7. Ý tưởng tương lai — CHƯA làm, để dành khi site có doanh thu ổn định

- Model 3D sản phẩm (AI image-to-3D hoặc scan LiDAR)
- AI voice hội thoại kiểu Gemini Live
- Zalo OA chính thức thay cho số Zalo cá nhân hiện tại
- Facebook Sign-In (nếu khách thật sự cần thêm lựa chọn ngoài Google/Email — cần tạo Facebook App riêng, không khó nhưng thêm 1 vòng cấu hình)
- Tích hợp API tính phí ship thật của GHN/GHTK thay cho mức phí cố định tạm (`getShippingFee()` trong `js/cart.js` đã để sẵn cấu trúc dễ thay, chỉ sửa 1 hàm)

## 8. Việc dang dở / cần làm tiếp

- **Đánh giá khách hàng (`trai-nghiem.html`, `index.html`) vẫn là dữ liệu mẫu bịa** — cần xử lý trước khi quảng bá web thật (thay bằng đánh giá thật, hoặc ẩn đi).
- **Dữ liệu sản phẩm vẫn là 17 sản phẩm mẫu**, chưa phải hàng thật. Khi có dữ liệu thật, **nhớ thêm luôn cột "Tồn kho"** vào Products lúc đó (đang để trống/999, tính năng cảnh báo hết hàng chưa thật sự "bật" cho tới khi có cột này với số liệu thật).
- **Chưa xác nhận tab TuDien/FAQ trong Sheet thật đã có dữ liệu hay còn trống** — file mẫu đã gửi (`tudien-seed.tsv`, `faq-seed.tsv`), việc dán vào Sheet là thao tác tay của người dùng.
- **`Code.gs` trong repo chỉ là bản tham chiếu** — mỗi lần sửa phải nhắc người dùng lấy bản mới nhất (khuyến khích dùng link `raw.githubusercontent.com/.../Code.gs` để tránh lỗi copy tay) dán vào Apps Script editor thật và Deploy lại (Manage deployments → New version, giữ nguyên URL).
- **Nếu sửa `Code.gs` thêm code gọi `UrlFetchApp`/API mới** mà gặp lỗi "You do not have permission to call UrlFetchApp.fetch" — nhắc người dùng vào Apps Script editor, chọn 1 hàm bất kỳ ở dropdown cạnh nút Run, bấm Run để trigger lại popup xin quyền (Review permissions → Advanced → Go to ... unsafe → Allow). Đây là bước xin quyền lại, tách biệt với Deploy.
- **Chưa xác nhận đã bật provider "Email/Password"** trong Firebase Console (Authentication → Sign-in method) — cần bật để đăng nhập email hoạt động thật, code/giao diện đã sẵn sàng.
- **Ảnh mặc định cho Open Graph (`images/og-default.png`) chưa tồn tại** — chia sẻ link bài viết lên Zalo/Facebook sẽ không có ảnh preview. Cần ảnh logo/đại diện thật của cửa hàng để thêm vào.
- **Lỗi zalo.me báo lỗi khi bấm nút "Nhắn Zalo" liên tục nhiều lần** — đã giảm bớt bằng cách chặn bấm lại trong 2 giây (`guardZaloClick_` trong `main.js`), nhưng chưa chắc hết hẳn vì nghi nguyên nhân gốc nằm ở phía Zalo (rate-limit), không phải lỗi trong code site.
- **Phí vận chuyển (`SHIPPING_FEES` trong `js/config.js`) đang là số ví dụ tạm** (20k/35k/60k) — chủ shop cần tự chỉnh lại đúng mức phí thật trước khi vận hành chính thức.
- **Hành trình đơn hàng kiểu Shopee — ĐÃ chốt & làm xong phần trạng thái xác nhận/huỷ VÀ hẹn lịch nhập tay (2026-07-22), CÒN THIẾU đúng phần tích hợp vận chuyển bên thứ 3 (GHN/GHTK):**
  - ✅ Đã làm (2026-07-21): mọi đơn (COD lẫn chuyển khoản) đều bắt đầu ở "Chờ xác nhận" (huỷ được). Chủ shop gọi điện xác nhận thật xong mới tự tay đổi sang "Đã xác nhận — đang chuẩn bị hàng" trong Sheet — lúc đó nút huỷ mới biến mất. Xem `CANCELABLE_STATUSES` trong `Code.gs` + `statusInfo()` trong `don-hang-cua-toi.html`.
  - ✅ Đã làm (2026-07-22): thêm cột **"Hẹn ngày giờ nhận/giao hàng"** vào Sheet Orders (cột 16, xem mục 6) — chủ shop tự nhập tay (chữ tự do) sau khi xác nhận đơn xong và đã thống nhất lịch với khách qua điện thoại. `handleMyOrders_` trong `Code.gs` trả thêm field `schedule` + `fulfillment`; `don-hang-cua-toi.html` (`orderCardHTML`) tự hiện khung màu cam "Hẹn giờ tới lấy tại cửa hàng" hoặc "Hẹn ngày giờ giao hàng" (tuỳ `fulfillment`) nếu cột này có giá trị, ẩn nếu để trống. HOÀN TOÀN thủ công, chưa gửi email báo riêng khi chủ shop điền lịch (khách phải tự vào trang "Đơn hàng của tôi" xem).
  - ⏳ Còn thiếu, CHƯA làm (lý do: cần tài khoản/API key thật của bên thứ 3 mà Claude không tự tạo thay được): tích hợp API thật của GHN hoặc GHTK để tự động tạo vận đơn + tự động cập nhật trạng thái vận chuyển (như Shopee) thay vì chủ shop nhập tay. **Trước khi làm được phần này cần chủ shop tự:** (1) chọn dùng GHN hay GHTK (hoặc cả 2), (2) đăng ký tài khoản merchant bên đó (miễn phí), (3) lấy API token/Client ID từ trang quản trị merchant, (4) cung cấp lại token đó để điền vào Script Properties (giống cách đang lưu `GEMINI_API_KEY`, KHÔNG hard-code vào `Code.gs`). Xem thêm mục 7.
  - Lưu ý nếu quay lại làm tiếp: `STATUS_CHO_XAC_NHAN` trong `Code.gs` đã đổi text từ "Chờ xác nhận thanh toán" thành "Chờ xác nhận" (áp dụng cho cả 2 phương thức thanh toán) — nếu Sheet Orders thật đã có đơn cũ mang chữ "Chờ xác nhận thanh toán" thì đơn đó sẽ không khớp bất kỳ trạng thái chuẩn nào nữa (rơi vào nhánh mặc định `cancelable:false` ở client) — cần chủ shop tự sửa tay lại text ở các dòng cũ đó trong Sheet nếu có.
  - "Hẹn ngày giờ nhận/giao hàng" là **chữ tự do, không ép định dạng** — Sheet không kiểm tra gì cả, gõ sao thì hiện y vậy cho khách xem trên trang "Đơn hàng của tôi" (vd "15/07 - 9h sáng" hay "Giao chiều thứ 5" đều được).
- **CẦN CHẠY TAY 1 LẦN** hàm `setupOrdersStatusDropdown()` trong Apps Script editor (2026-07-22, chưa chắc người dùng đã chạy) — biến cột "Trạng thái" trong Sheet Orders thành ô chọn sẵn (dropdown 5 trạng thái) kèm tô màu: vàng (Chờ xác nhận), xanh lá (Đã xác nhận — đang chuẩn bị hàng), xanh dương (Đang giao), xanh lá đậm (Hoàn tất), đỏ (Đã huỷ). Cách chạy: mở Apps Script editor → chọn `setupOrdersStatusDropdown` ở dropdown cạnh nút Run → bấm Run (tương tự bước xin quyền `UrlFetchApp` ở trên, đây là thao tác tay 1 lần, không phải Deploy). Chạy lại bất cứ lúc nào cũng an toàn (tự dọn rule màu cũ, không bị trùng lặp) — cần chạy lại nếu sau này số đơn hàng vượt quá 500 dòng đã áp dropdown.
  - **LƯU Ý QUAN TRỌNG cho mọi hàm "chạy tay" tương lai:** Apps Script (bản gắn với Sheet, "container-bound") tự ẩn khỏi dropdown "chọn hàm để Chạy" mọi hàm có tên kết thúc bằng dấu `_` (coi là hàm nội bộ/private, giống quy ước ẩn khỏi menu Macro). Ban đầu hàm này đặt tên `setupOrdersStatusDropdown_` (có `_`) nên người dùng không tìm thấy trong dropdown dù code dán đúng 100% — đã đổi tên bỏ `_` để hiện ra được. Bất kỳ hàm mới nào cần người dùng tự chạy tay qua giao diện Apps Script (không phải chỉ gọi nội bộ từ hàm khác) đều PHẢI đặt tên KHÔNG kết thúc bằng `_`.

---
*Cập nhật lần cuối: 2026-07-22*

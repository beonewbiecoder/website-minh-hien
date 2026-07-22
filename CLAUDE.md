# CLAUDE.md — Ngữ cảnh project website Minh Hiền Hydraulics

> File này để 1 phiên Claude Code mới đọc vào là hiểu ngay hiện trạng, không cần người dùng giải thích lại từ đầu. Nội dung được viết dựa trên việc đọc trực tiếp code thật + `git log`, không dựa vào suy đoán.

## 1. Tổng quan project

- Website bán hàng cho **Cửa Hàng Minh Hiền** — chuyên ống thủy lực và rắc co, phụ kiện thủy lực cho máy công trình, nhà xưởng, cơ khí chế tạo.
- Đối tượng khách hàng chính: GenX/GenY, phần lớn **lowtech** (lớn tuổi, không rành công nghệ) → mọi quyết định thiết kế ưu tiên dễ nhìn, chữ to, nút rõ ràng có label (không icon-only), bố cục tối giản, **không bắt buộc đăng nhập/đăng ký** để mua hàng (xem mục 5).
- Hạ tầng: **hoàn toàn miễn phí, không backend riêng**
  - Hosting tĩnh: **GitHub Pages** — repo `beonewbiecoder/website-minh-hien`, nhánh `master`, live tại `https://beonewbiecoder.github.io/website-minh-hien/`
  - Dữ liệu + backend logic: **Google Sheet + Google Apps Script** (Web App), gọi thêm **Gemini API** cho chat AI
  - **Firebase Authentication** (project `chmh-e22e1`, miễn phí gói Spark) — CHỈ dùng để xác định danh tính khách đăng nhập (Google + Email/mật khẩu), KHÔNG dùng Firestore hay database nào khác của Firebase
  - **GitHub Actions** (miễn phí trên repo public) — tự build trang bài viết từ Markdown (xem mục 2) VÀ tự build `js/products-data.js` (dữ liệu sản phẩm tĩnh, xem mục 2 + mục 5 "Đồng bộ sản phẩm") — cả 2 đều theo cùng 1 triết lý: KHÔNG gọi sống Apps Script mỗi lần khách vào xem (chậm 1-3 giây), thay vào đó "build" sẵn thành file tĩnh, phát nhanh qua CDN GitHub Pages.
  - Không có build step cho site chính, không npm để chạy local — HTML/CSS/JS thuần, mở file là chạy được. Riêng hệ thống bài viết + dữ liệu sản phẩm CÓ bước build (Node) nhưng chạy hoàn toàn trên GitHub Actions, người dùng không cần cài gì trên máy.
- Lý do chọn hạ tầng này: project đang ở giai đoạn thử nghiệm, chưa tạo doanh thu ổn định, cần giữ chi phí vận hành = 0 đồng.

## 2. Cấu trúc file/trang hiện có

**Trang chính (12 file HTML ở gốc repo):**

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
| `quan-ly-san-pham.html` | **Trang quản lý sản phẩm nội bộ** (2026-07-22) — KHÔNG có trong menu/nav, không ai vô tình bấm trúng. Chỉ 2 tài khoản trong `ADMIN_EMAILS` (`Code.gs`) mới thêm/sửa/xoá được sản phẩm — xem chi tiết đầy đủ ở mục 5. |

Tất cả các trang đều load chung `js/config.js` → `js/data.js` → **`js/products-data.js`** → `js/cart.js` → `js/auth.js` → `js/main.js`, cộng thêm SDK Firebase (`firebase-app-compat.js`, `firebase-auth-compat.js`) qua CDN trước `config.js`.

**JS (`js/`):**

| File | Chức năng |
|---|---|
| `config.js` | Toàn bộ hằng số cấu hình dùng chung site (xem mục 4) |
| `data.js` | `CATEGORIES`, `PRODUCTS` (17 sản phẩm mẫu ban đầu — bị `products-data.js` nạp đè ngay sau đó bằng dữ liệu thật) |
| `products-data.js` | **Tự động sinh ra** bởi `scripts/build-products.js` (2026-07-22) — nạp đè `PRODUCTS` bằng dữ liệu THẬT lấy từ Sheet Products tại thời điểm build gần nhất. Nạp bằng thẻ `<script>` bình thường (đồng bộ, không phải fetch) nên có ngay lập tức khi trang tải, không còn độ trễ/race condition như bản cũ dùng `refreshProductsFromSheet()` (đã bỏ hẳn). KHÔNG sửa tay — xem mục 5 "Đồng bộ sản phẩm". |
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
| `package.json` | Chỉ dùng cho CI (khai báo dependency `marked` để build bài viết) — không liên quan gì đến việc chạy site |

**Hệ thống dữ liệu sản phẩm tĩnh (2026-07-22, build từ Sheet, xem thêm mục 5 "Đồng bộ sản phẩm"):**

| File | Chức năng |
|---|---|
| `scripts/build-products.js` | Build script Node — đọc `APPS_SCRIPT_URL` trực tiếp từ `js/config.js` (không phải bí mật), gọi `?action=products`, ghi kết quả thành `js/products-data.js`. KHÔNG cần dependency npm nào (dùng `fetch` có sẵn của Node 20). |
| `.github/workflows/build-products.yml` | GitHub Actions — 2 cách kích hoạt: (1) `workflow_dispatch` do `Code.gs` tự gọi (`triggerProductsRebuild_`) ngay khi sản phẩm/tồn kho thay đổi, (2) lịch chạy định kỳ mỗi 30 phút làm lưới an toàn. Tự commit lại `js/products-data.js` nếu có thay đổi (bot `github-actions[bot]`). |

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
ADMIN_EMAILS     = ["minhhien.bz@gmail.com", "kmuffin03@gmail.com"]   // 2026-07-22, 2 tài khoản
                    được phép thêm/sửa/xoá sản phẩm qua quan-ly-san-pham.html — xác thực lại
                    qua verifyAdmin_() (Identity Toolkit), KHÔNG tin email trình duyệt gửi lên
PRODUCT_IMAGES_FOLDER_NAME = "Website Minh Hiền - Ảnh sản phẩm"   // tên thư mục Drive tự tạo
                    để lưu ảnh sản phẩm tải lên qua trang quản lý
GITHUB_OWNER = "beonewbiecoder", GITHUB_REPO = "website-minh-hien",
GITHUB_PRODUCTS_WORKFLOW = "build-products.yml"   // dùng để tự gọi GitHub Actions
                    build lại dữ liệu sản phẩm tĩnh (xem mục 2 + mục 5)
GITHUB_TOKEN     = **CHƯA CHẮC ĐÃ CẤU HÌNH** — Script Property (Project Settings),
                    Personal Access Token của GitHub, quyền tối thiểu "Actions: write"
                    + "Contents: write" trên đúng repo website-minh-hien. Thiếu thì
                    triggerProductsRebuild_() tự bỏ qua (không lỗi), vẫn còn lịch
                    chạy định kỳ 30 phút làm lưới an toàn — xem mục 8.
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
| **Đồng bộ sản phẩm — build tĩnh (2026-07-22)** | ✅ Hoàn thành, **đã test thật thành công** | `scripts/build-products.js`, `.github/workflows/build-products.yml`, `js/products-data.js`, `Code.gs` (`triggerProductsRebuild_`) | **Đã đổi kiến trúc**, KHÔNG còn fetch sống từ trình duyệt nữa (bản cũ `refreshProductsFromSheet()` trong `data.js` đã bị xoá hẳn — gây race condition, báo nhầm "không tìm thấy sản phẩm"/"giỏ hàng trống" khi sản phẩm mới thêm chưa kịp đồng bộ, có lúc còn làm kẹt cứng trang thanh toán). Giờ: GitHub Actions build sẵn `js/products-data.js` (nạp bằng thẻ `<script>` bình thường, đồng bộ, không có độ trễ) mỗi khi Apps Script tự gọi `workflow_dispatch` (ngay sau khi admin lưu/xoá sản phẩm, hoặc có đơn hàng mới/huỷ làm đổi tồn kho — xem `adjustStockForItems_`/`handleAdminSaveProduct_`/`handleAdminDeleteProduct_`), cộng thêm lịch chạy định kỳ 30 phút làm lưới an toàn. Đánh đổi: sản phẩm/tồn kho mới đổi cần khoảng vài chục giây tới ~1 phút mới lên site (thời gian Action chạy) — CHỦ SHOP ĐÃ ĐỒNG Ý đánh đổi này (quy mô vừa/nhỏ, chưa cần tức thời) và **đã xác nhận test thật OK**: trang sản phẩm/chi tiết/giỏ hàng tải nhanh hẳn, không còn báo lỗi nhầm. `GITHUB_TOKEN` đã được điền đúng vào Script Properties (đã tự trigger được GitHub Actions thành công qua `workflow_dispatch`, không cần đợi lịch chạy nền 30 phút). Bước "Đặt hàng" ở `thanh-toan.html` vẫn mất ~2-3 giây vì còn đi qua Apps Script thật (ghi Sheet + gửi email + trừ tồn kho + trigger rebuild) — đây là hành động 1 lần/khách, KHÔNG phải vấn đề, chủ shop đã xác nhận chấp nhận được. |
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
| **Quản lý sản phẩm (admin)** | ✅ Hoàn thành, **đã test thật thành công** (2026-07-22) | `quan-ly-san-pham.html`, `Code.gs` (`handleAdminSaveProduct_`/`handleAdminDeleteProduct_`/`saveProductImagesToDrive_`) | Trang nội bộ KHÔNG có trong menu, chỉ 2 email trong `ADMIN_EMAILS` mới thêm/sửa/xoá được sản phẩm (client-side check chỉ để ẩn/hiện giao diện, quyền THẬT xác thực lại ở server qua `verifyAdmin_()` giống hệt cơ chế huỷ đơn — không tin email trình duyệt gửi lên). Form nhập đủ trường: tên/danh mục/kích thước/giá/đơn vị/mô tả ngắn/**mô tả chi tiết**/nhãn/icon/tình trạng/tồn kho/5 thông số kỹ thuật. Ảnh: chọn tối đa 5 tấm, tự động resize bằng canvas (còn ≤1600px, JPEG q=0.8) trước khi gửi lên — Apps Script lưu vào thư mục Drive `PRODUCT_IMAGES_FOLDER_NAME` (tự tạo), set quyền "ai có link cũng xem được", trả về URL `drive.google.com/thumbnail?id=...`. Nhiều URL lưu cách nhau bằng dấu phẩy trong 1 cột "Hình ảnh" của Sheet Products (xem mục 6). Model 3D: mới có ô nhập LINK (chưa làm upload file thật/hiển thị 3D — để dành sau, xem mục 8). Card sản phẩm (`productCardHTML`) và trang chi tiết (gallery + thumbnail bấm đổi ảnh) tự ưu tiên hiện ảnh thật nếu `images.length > 0`, fallback về icon SVG cũ nếu chưa có ảnh. Cần chạy tay `testDriveAccess()` 1 lần đầu tiên (xin quyền Drive) — đã xác nhận hoạt động đúng. |
| **Mô tả chi tiết sản phẩm** | ✅ Hoàn thành (2026-07-22) | `san-pham-chi-tiet.html` (`#detail-info-section`), `quan-ly-san-pham.html` (ô "Mô tả chi tiết"), `Code.gs` (cột "Mô tả chi tiết") | Nội dung dài, không giới hạn — cố tình đặt HẲN XUỐNG CUỐI trang chi tiết sản phẩm, sau cả phần "Sản phẩm liên quan", để không phá vỡ trải nghiệm tối giản ở khu vực đầu trang (ảnh + giá + mua hàng). Khác với "Mô tả ngắn" (cột "Mô tả", vẫn hiện ngay đầu trang như cũ). Xuống dòng 2 lần (dòng trống) tách thành đoạn `<p>` riêng; xuống dòng đơn giữ nguyên trong cùng đoạn (`<br>`). Sản phẩm chưa nhập thì ẩn hẳn cả section, không hiện khung trống. |

## 6. Nguồn dữ liệu (Google Sheet)

Sheet có (hoặc cần có) các tab sau, đọc/ghi qua `Code.gs`:

- **Products** — sản phẩm hiển thị trên site. Cột: `ID, Tên sản phẩm, Danh mục, Kích thước, Giá (VNĐ), Đơn vị, Mô tả, Nhãn nổi bật, Icon, Thông số 1-5 (Tên/Giá trị mỗi cặp)`. Cột **`Tình trạng`** (Còn hàng/Hết hàng, tuỳ chọn) và **`Tồn kho`** (số lượng, tuỳ chọn — **chưa xác nhận đã thêm vào Sheet thật**) — thiếu thì code tự mặc định "Còn hàng"/không giới hạn (999). **3 cột mới (2026-07-22): `Hình ảnh`** (nhiều URL Drive cách nhau bằng dấu phẩy, do trang `quan-ly-san-pham.html` tự ghi vào, KHÔNG tự nhập tay), **`Model 3D`** (1 URL, hiện chỉ là link text, chưa có tính năng hiển thị 3D thật), và **`Mô tả chi tiết`** (nội dung dài, hiện ở cuối trang chi tiết sản phẩm — xem mục 5). Khác với Orders, `ensureProductsColumns_()` **KHÔNG overwrite header** nếu sai khác — chỉ tự thêm cột nào còn thiếu vào cuối, an toàn với thứ tự cột Products đã tự sắp xếp từ trước.
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
- **Trang quản lý sản phẩm (`quan-ly-san-pham.html`) — ĐÃ TEST THẬT THÀNH CÔNG (2026-07-22)**: đăng nhập bằng `ADMIN_EMAILS`, thêm sản phẩm kèm ảnh, ảnh lên đúng Drive + Sheet, hiện đúng trên `san-pham.html`/trang chi tiết. Gặp đúng lỗi "You do not have permission to call DriveApp..." ở lần đầu như dự đoán (chưa từng cấp quyền Drive) — đã xử lý bằng hàm `testDriveAccess()` (KHÔNG có dấu `_`, hiện trong dropdown Run) chạy tay 1 lần để trigger popup xin quyền, sau đó hoạt động bình thường.
  - **Lỗi báo nhầm "Không tìm thấy sản phẩm"/"Giỏ hàng đang trống" (kể cả kẹt cứng trang thanh toán) khi sản phẩm mới thêm chưa kịp đồng bộ — ĐÃ SỬA TẬN GỐC (2026-07-22)** bằng cách đổi hẳn kiến trúc sang build tĩnh, xem dòng "Đồng bộ sản phẩm — build tĩnh" ở mục 5. Không còn fetch bất đồng bộ nữa nên không còn race condition — mọi trang giờ có `PRODUCTS` đúng ngay từ đầu, không cần "Đang tải..." hay lắng nghe sự kiện gì cả (đã dọn sạch code tạm `productsSettled`/`productsReady`/`products-updated` của lần sửa trước đó trong cùng ngày).
  - **`GITHUB_TOKEN` đã được tạo và điền đúng vào Script Properties (2026-07-22), đã test thật thành công** — sửa sản phẩm ở trang quản lý tự trigger đúng workflow "Build dữ liệu sản phẩm từ Google Sheet" trên tab Actions của GitHub, chạy xong dưới 1 phút, `san-pham.html` tải lại nhanh hẳn, không còn báo lỗi nhầm. Lưu ý: token đầu tiên người dùng tạo bị dán lộ ra trong khung chat — đã hướng dẫn xoá token đó và tạo token mới an toàn hơn trước khi điền vào Script Properties.
  - Giỏ hàng (`gio-hang.html`) giờ hiện ảnh thật của sản phẩm thay vì luôn icon SVG (nếu sản phẩm đã có ảnh).
  - **Model 3D mới chỉ là 1 ô nhập link text** (`Model 3D` trong Sheet) — CHƯA làm: upload file 3D thật lên Drive, và CHƯA có bất kỳ chỗ nào trên site hiển thị/render model 3D. Đây là việc "để dành sau" theo đúng ý người dùng, chỉ mới chừa sẵn chỗ trong dữ liệu.
  - Ảnh sản phẩm được resize bằng canvas phía trình duyệt (tối đa 1600px, JPEG chất lượng 0.8) trước khi gửi — nếu sau này thấy ảnh vẫn nặng/tải chậm, có thể hạ thêm kích thước hoặc chất lượng trong hàm `resizeImageFile_` ở `quan-ly-san-pham.html`.
  - **Đã sửa (2026-07-22): badge "Nhãn nổi bật" (vd "Bán chạy") bị lệch ra giữa ảnh ở trang chi tiết sản phẩm** — do CSS `.badge` trước đó chỉ định nghĩa cho `.product-thumb .badge` (thẻ ở trang danh sách), trang chi tiết dùng `.pd-gallery` nên không có style áp vào. Đã gộp selector `.product-thumb .badge, .pd-gallery .badge` + thêm `position: relative` cho `.pd-gallery`.
  - **Đã thêm (2026-07-22): "Mô tả chi tiết"** — xem dòng riêng ở mục 5, cố tình tách biệt khỏi "Mô tả ngắn" và đặt cuối trang để giữ trải nghiệm tối giản ở khu vực đầu trang.

---
*Cập nhật lần cuối: 2026-07-22*

/* =========================================================
   BUILD SCRIPT — sinh trang HTML tĩnh từ bai-viet/*.md
   Chạy tự động bởi GitHub Actions (.github/workflows/build-articles.yml)
   mỗi khi có file .md mới trong bai-viet/ được push lên.
   KHÔNG cần chạy tay, KHÔNG cần cài Node trên máy cá nhân.

   Đọc: bai-viet/*.md (frontmatter + nội dung Markdown)
   Ghi:
     - bai-viet/<slug>.html   (trang chi tiết từng bài, tối ưu SEO + JSON-LD)
     - js/articles-data.js    (mảng ARTICLES dùng cho trang chủ + trang danh sách)
   ========================================================= */

const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const ROOT = path.join(__dirname, "..");
const ARTICLES_DIR = path.join(ROOT, "bai-viet");
const SITE_BASE_URL = "https://beonewbiecoder.github.io/website-minh-hien/";
const BRAND_NAME = "Cửa Hàng Minh Hiền";

marked.setOptions({ gfm: true, breaks: false, headerIds: false });

/* ---------- Tiện ích ---------- */

function slugify(text) {
  return String(text)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mdInlineToPlainText(text) {
  return String(text)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateVN(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

// Google Rich Results Test yêu cầu datePublished/dateModified có giờ + múi giờ đầy đủ (ISO 8601),
// không chấp nhận chỉ "YYYY-MM-DD". Cửa hàng ở Việt Nam nên dùng cố định +07:00.
function toIsoDateTime(isoDate) {
  return `${isoDate}T00:00:00+07:00`;
}

/* ---------- Đọc frontmatter (YAML đơn giản, chỉ key: value phẳng) ---------- */

function parseFrontmatter(raw, fileName) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${fileName}: thiếu khối frontmatter (---) ở đầu file`);
  }
  const meta = {};
  match[1].split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  });
  return { meta, body: match[2] };
}

function validateMeta(meta, fileName) {
  const required = ["title", "description", "date", "slug"];
  const missing = required.filter((k) => !meta[k]);
  if (missing.length) {
    throw new Error(`${fileName}: thiếu trường frontmatter bắt buộc: ${missing.join(", ")}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    throw new Error(`${fileName}: "date" phải theo định dạng YYYY-MM-DD (vd: 2026-07-20)`);
  }
  if (!/^[a-z0-9-]+$/.test(meta.slug)) {
    throw new Error(`${fileName}: "slug" chỉ được chứa chữ thường a-z, số 0-9 và dấu gạch ngang`);
  }
}

/* ---------- Tự nhận diện Q&A (câu hỏi làm heading, trả lời ngay bên dưới) cho FAQPage ---------- */

function extractFAQ(tokens) {
  const faqs = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== "heading" || !/\?\s*$/.test(t.text.trim())) continue;
    const answerParts = [];
    for (let j = i + 1; j < tokens.length; j++) {
      const nt = tokens[j];
      if (nt.type === "heading") break;
      if (nt.type === "paragraph") answerParts.push(mdInlineToPlainText(nt.text));
      else if (nt.type === "list") {
        nt.items.forEach((item) => answerParts.push(mdInlineToPlainText(item.text)));
      }
    }
    const answer = answerParts.join(" ").trim();
    if (answer) faqs.push({ question: mdInlineToPlainText(t.text), answer });
  }
  return faqs;
}

/* ---------- Render nội dung Markdown → HTML, đảm bảo bài viết chỉ có 1 H1 (do template chèn từ title) ---------- */

function renderBody(bodyMarkdown) {
  const tokens = marked.lexer(bodyMarkdown);
  const faqs = extractFAQ(tokens);

  let minDepth = 6;
  tokens.forEach((t) => { if (t.type === "heading" && t.depth < minDepth) minDepth = t.depth; });
  if (minDepth <= 1) {
    tokens.forEach((t) => { if (t.type === "heading") t.depth = Math.min(6, t.depth + 1); });
  }

  const contentHtml = marked.parser(tokens);
  return { contentHtml, faqs };
}

/* ---------- Đọc + xử lý 1 file bài viết ---------- */

function processArticle(fileName) {
  const filePath = path.join(ARTICLES_DIR, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const { meta, body } = parseFrontmatter(raw, fileName);
  validateMeta(meta, fileName);

  const { contentHtml, faqs } = renderBody(body);

  let imagePath = "";
  if (meta.image) {
    const abs = path.join(ROOT, meta.image.replace(/^\/+/, ""));
    if (fs.existsSync(abs)) imagePath = meta.image.replace(/^\/+/, "");
  }

  return {
    title: meta.title,
    description: meta.description,
    date: meta.date,
    dateDisplay: formatDateVN(meta.date),
    slug: meta.slug,
    image: imagePath,
    contentHtml,
    faqs,
    url: `bai-viet/${meta.slug}.html`
  };
}

/* ---------- Template trang chi tiết bài viết ---------- */

function articleHeaderNav() {
  return `<header class="site-header">
  <div class="topbar">
    <div class="container">
      <div class="topbar-links">
        <a href="tel:0918159870">📞 Hotline: 091 815 9870</a>
        <a href="../lien-he.html">Hệ thống cửa hàng</a>
      </div>
      <div class="topbar-links">
        <a href="../lien-he.html">Giao hàng toàn quốc · Tư vấn kỹ thuật miễn phí</a>
      </div>
    </div>
  </div>
  <div class="container header-main">
    <a href="../index.html" class="logo">
      <span class="logo-mark">MH</span>
      <span>CỬA HÀNG MINH HIỀN<small>Ống thủy lực &amp; Rắc co</small></span>
    </a>
    <nav class="main-nav">
      <a href="../index.html">Trang chủ</a>
      <a href="../san-pham.html">Sản phẩm</a>
      <a href="../gioi-thieu.html">Giới thiệu</a>
      <a href="../trai-nghiem.html">Trải nghiệm khách hàng</a>
      <a href="../lien-he.html">Liên hệ</a>
      <a href="../don-hang-cua-toi.html">Đơn hàng của tôi</a>
    </nav>
    <div class="header-actions">
      <div id="account-slot"></div>
      <a href="../gio-hang.html" class="icon-btn" aria-label="Giỏ hàng">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span class="cart-badge" style="display:none">0</span>
      </a>
      <button class="nav-toggle" aria-label="Mở menu"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function articleFooter() {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <h4>CỬA HÀNG MINH HIỀN</h4>
        <p>Chuyên cung cấp ống thủy lực, rắc co và phụ kiện thủy lực chính hãng cho máy công trình, nhà xưởng và cơ khí chế tạo.</p>
      </div>
      <div>
        <h4>Danh mục</h4>
        <ul>
          <li><a href="../san-pham.html?cat=ong-thuy-luc">Ống thủy lực</a></li>
          <li><a href="../san-pham.html?cat=rac-co">Rắc co &amp; Đầu nối</a></li>
          <li><a href="../san-pham.html">Tất cả sản phẩm</a></li>
        </ul>
      </div>
      <div>
        <h4>Về chúng tôi</h4>
        <ul>
          <li><a href="../gioi-thieu.html">Giới thiệu</a></li>
          <li><a href="../trai-nghiem.html">Trải nghiệm khách hàng</a></li>
          <li><a href="../lien-he.html">Liên hệ</a></li>
        </ul>
      </div>
      <div>
        <h4>Liên hệ</h4>
        <p>Hotline: 091 815 9870<br>Email: minhhien.bz@gmail.com<br><a href="https://maps.app.goo.gl/xZ1LxMxwxvJL9X4x6" target="_blank" rel="noopener">11 Thái Phiên, Phường Minh Phụng, TP.HCM</a></p>
      </div>
    </div>
    <div class="footer-bottom">
      © <span id="year"></span> Cửa Hàng Minh Hiền. Thông tin sản phẩm trên website mang tính minh họa, vui lòng liên hệ để được báo giá chính xác.
    </div>
  </div>
</footer>`;
}

function buildJsonLd(article) {
  const articleUrl = SITE_BASE_URL + article.url;
  const imageUrl = article.image ? SITE_BASE_URL + article.image : SITE_BASE_URL + "images/og-default.png";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: [imageUrl],
    datePublished: toIsoDateTime(article.date),
    dateModified: toIsoDateTime(article.date),
    author: { "@type": "Organization", name: BRAND_NAME, url: SITE_BASE_URL },
    publisher: { "@type": "Organization", name: BRAND_NAME, url: SITE_BASE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl }
  };

  const blocks = [`<script type="application/ld+json">${JSON.stringify(articleSchema, null, 2)}</script>`];

  if (article.faqs.length) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer }
      }))
    };
    blocks.push(`<script type="application/ld+json">${JSON.stringify(faqSchema, null, 2)}</script>`);
  }

  return blocks.join("\n");
}

function renderArticlePage(article) {
  const articleUrl = SITE_BASE_URL + article.url;
  const coverBlock = article.image
    ? `<img src="../${article.image}" alt="${escapeHtml(article.title)}" class="article-cover-img">`
    : `<div class="article-cover-placeholder" aria-hidden="true">
        <svg width="72" height="72" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <path d="M8 20c6-8 12 8 18 0s12 8 18 0 12 8 12 0" opacity=".9"/>
          <path d="M8 44c6-8 12 8 18 0s12 8 18 0 12 8 12 0" opacity=".5"/>
          <circle cx="8" cy="20" r="3" fill="currentColor" stroke="none"/>
          <circle cx="56" cy="20" r="3" fill="currentColor" stroke="none"/>
        </svg>
      </div>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(article.title)} — Cửa Hàng Minh Hiền</title>
<meta name="description" content="${escapeHtml(article.description)}">
<link rel="canonical" href="${articleUrl}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(article.title)}">
<meta property="og:description" content="${escapeHtml(article.description)}">
<meta property="og:url" content="${articleUrl}">
<meta property="og:image" content="${article.image ? SITE_BASE_URL + article.image : SITE_BASE_URL + "images/og-default.png"}">
<meta property="og:site_name" content="${BRAND_NAME}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/style.css">
${buildJsonLd(article)}
</head>
<body>

${articleHeaderNav()}

<main class="section-tight">
  <div class="container">
    <div class="breadcrumb"><a href="../index.html">Trang chủ</a> / <a href="../bai-viet.html">Kiến thức thủy lực</a> / ${escapeHtml(article.title)}</div>

    <article class="article-wrap">
      <span class="eyebrow">Kiến thức thủy lực</span>
      <h1>${escapeHtml(article.title)}</h1>
      <div class="article-meta">Cập nhật: ${article.dateDisplay}</div>

      <div class="article-cover">${coverBlock}</div>

      <div class="article-content">
        ${article.contentHtml}
      </div>
    </article>

    <div class="article-cta">
      <h2>Cần tư vấn chọn đúng loại ống hoặc rắc co?</h2>
      <p class="muted">Gọi ngay hotline hoặc để lại thông tin, đội ngũ kỹ thuật sẽ liên hệ trong vòng 30 phút.</p>
      <div class="hero-actions" style="justify-content:center">
        <a href="tel:0918159870" class="btn btn-primary btn-lg">Gọi 091 815 9870</a>
        <a href="../san-pham.html" class="btn btn-outline btn-lg">Xem sản phẩm</a>
      </div>
    </div>

    <div class="text-center" style="margin-top:30px;">
      <a href="../bai-viet.html" class="btn btn-secondary">&larr; Tất cả bài viết</a>
    </div>
  </div>
</main>

${articleFooter()}

<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="../js/config.js"></script>
<script src="../js/data.js"></script>
<script src="../js/cart.js"></script>
<script src="../js/auth.js"></script>
<script src="../js/main.js"></script>
</body>
</html>
`;
}

/* ---------- Chạy build ---------- */

function main() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log("Không tìm thấy thư mục bai-viet/, bỏ qua build.");
    return;
  }

  const mdFiles = fs.readdirSync(ARTICLES_DIR).filter((f) => f.toLowerCase().endsWith(".md"));
  if (!mdFiles.length) {
    console.log("Chưa có file .md nào trong bai-viet/.");
  }

  const articles = mdFiles.map((f) => {
    console.log(`Đang xử lý: ${f}`);
    return processArticle(f);
  });

  const slugs = new Set();
  articles.forEach((a) => {
    if (slugs.has(a.slug)) throw new Error(`Trùng slug: "${a.slug}" — mỗi bài viết phải có slug riêng.`);
    slugs.add(a.slug);
  });

  articles.sort((a, b) => (a.date < b.date ? 1 : -1));

  articles.forEach((article) => {
    const outPath = path.join(ARTICLES_DIR, `${article.slug}.html`);
    fs.writeFileSync(outPath, renderArticlePage(article), "utf8");
    console.log(`  → đã ghi bai-viet/${article.slug}.html${article.faqs.length ? ` (FAQPage: ${article.faqs.length} câu hỏi)` : ""}`);
  });

  const indexData = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    date: a.date,
    dateDisplay: a.dateDisplay,
    image: a.image,
    url: a.url
  }));

  const jsOut = `/* =========================================================
   TỰ ĐỘNG SINH RA BỞI scripts/build-articles.js — KHÔNG SỬA TAY.
   Sửa nội dung bài viết trong bai-viet/*.md rồi push, GitHub Actions
   sẽ tự chạy lại build script và cập nhật file này.
   ========================================================= */

const ARTICLES = ${JSON.stringify(indexData, null, 2)};
`;
  fs.writeFileSync(path.join(ROOT, "js", "articles-data.js"), jsOut, "utf8");
  console.log(`→ đã ghi js/articles-data.js (${articles.length} bài viết)`);
}

main();

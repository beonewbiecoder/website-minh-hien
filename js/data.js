/* =========================================================
   DỮ LIỆU SẢN PHẨM MẪU
   Đây là nội dung minh họa (placeholder) để dựng bố cục.
   Hãy thay bằng tên sản phẩm, giá, mô tả, hình ảnh thật của
   cửa hàng trước khi đưa website lên chính thức.
   ========================================================= */

const CATEGORIES = [
  {
    slug: "ong-thuy-luc",
    name: "Ống thủy lực",
    desc: "Ống chịu áp lực cao, bố trí 1–4 lớp thép bện hoặc xoắn ốc",
    icon: "hose"
  },
  {
    slug: "rac-co",
    name: "Rắc co & Đầu nối",
    desc: "Đầu nối ren BSP, NPT, JIC, ORFS, mặt bích, khớp nối nhanh",
    icon: "hex"
  }
];

let PRODUCTS = [
  {
    id: "ong-1sn-12",
    name: "Ống thủy lực 1 lớp thép bện SAE 100R1AT",
    category: "ong-thuy-luc",
    size: 'Phi 12.7mm (1/2")',
    price: 62000,
    unit: "mét",
    icon: "hose",
    badge: "Bán chạy",
    desc: "Ống 1 lớp thép bện, chịu áp suất làm việc trung bình, dùng cho hệ thống thủy lực di động và máy công trình.",
    specs: {
      "Tiêu chuẩn": "SAE 100R1AT / EN 853 1SN",
      "Áp suất làm việc": "88 – 225 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "1 lớp thép bện",
      "Ứng dụng": "Xe nâng, máy xúc, máy ép thủy lực"
    }
  },
  {
    id: "ong-2sn-34",
    name: "Ống thủy lực 2 lớp thép bện SAE 100R2AT",
    category: "ong-thuy-luc",
    size: 'Phi 19mm (3/4")',
    price: 98000,
    unit: "mét",
    icon: "hose",
    badge: "Bán chạy",
    desc: "Ống 2 lớp thép bện, chịu áp lực cao hơn R1, phù hợp hệ thống thủy lực công nghiệp và máy xây dựng.",
    specs: {
      "Tiêu chuẩn": "SAE 100R2AT / EN 853 2SN",
      "Áp suất làm việc": "125 – 320 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "2 lớp thép bện",
      "Ứng dụng": "Máy xúc, máy ép, hệ thống thủy lực công nghiệp"
    }
  },
  {
    id: "ong-4sp-1",
    name: "Ống thủy lực 4 lớp thép bện 4SP",
    category: "ong-thuy-luc",
    size: 'Phi 25.4mm (1")',
    price: 165000,
    unit: "mét",
    icon: "hose",
    desc: "Ống 4 lớp thép bện chịu áp cực cao, dùng cho hệ thống thủy lực tải nặng, ép cọc, cẩu trục.",
    specs: {
      "Tiêu chuẩn": "EN 856 4SP",
      "Áp suất làm việc": "250 – 400 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "4 lớp thép bện",
      "Ứng dụng": "Cẩu trục, máy ép cọc, thiết bị tải nặng"
    }
  },
  {
    id: "ong-4sh-114",
    name: "Ống thủy lực 4 lớp thép bện 4SH",
    category: "ong-thuy-luc",
    size: 'Phi 31.8mm (1-1/4")',
    price: 210000,
    unit: "mét",
    icon: "hose",
    desc: "Ống 4 lớp thép bện xoắn kép, chịu áp lực rất cao, dùng cho các hệ thống thủy lực siêu trường siêu trọng.",
    specs: {
      "Tiêu chuẩn": "EN 856 4SH",
      "Áp suất làm việc": "220 – 350 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "4 lớp thép bện xoắn kép",
      "Ứng dụng": "Máy ép công nghiệp, thiết bị khai khoáng"
    }
  },
  {
    id: "ong-spiral-2",
    name: "Ống thủy lực xoắn ốc (Spiral) R15",
    category: "ong-thuy-luc",
    size: 'Phi 50.8mm (2")',
    price: 385000,
    unit: "mét",
    icon: "hose",
    badge: "Cỡ lớn",
    desc: "Ống xoắn ốc nhiều lớp thép, chịu áp cực cao cho hệ thống thủy lực cỡ lớn, đường ống chính.",
    specs: {
      "Tiêu chuẩn": "SAE 100R15 / EN 856 R15",
      "Áp suất làm việc": "280 – 420 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 121°C",
      "Lớp gia cường": "4–6 lớp thép xoắn ốc",
      "Ứng dụng": "Đường ống chính, thiết bị khai khoáng, cảng biển"
    }
  },
  {
    id: "ong-chiu-nhiet",
    name: "Ống thủy lực chịu nhiệt cao EN 856 4SP",
    category: "ong-thuy-luc",
    size: 'Phi 25.4mm (1")',
    price: 178000,
    unit: "mét",
    icon: "hose",
    desc: "Lớp cao su ngoài chịu nhiệt, dùng ở môi trường nhiệt độ cao gần động cơ, lò hơi.",
    specs: {
      "Tiêu chuẩn": "EN 856 4SP - chịu nhiệt",
      "Áp suất làm việc": "250 – 380 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 121°C",
      "Lớp gia cường": "4 lớp thép bện",
      "Ứng dụng": "Gần động cơ, lò hơi, môi trường nhiệt độ cao"
    }
  },
  {
    id: "ong-r3-38",
    name: "Ống mềm thủy lực áp suất thấp SAE 100R3",
    category: "ong-thuy-luc",
    size: 'Phi 9.5mm (3/8")',
    price: 28000,
    unit: "mét",
    icon: "hose",
    badge: "Giá tốt",
    desc: "Ống mềm 2 lớp sợi dệt, dùng cho hệ thống áp suất thấp, dầu, nước, khí nén.",
    specs: {
      "Tiêu chuẩn": "SAE 100R3",
      "Áp suất làm việc": "35 – 65 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "2 lớp sợi dệt",
      "Ứng dụng": "Hệ thống dầu, nước, khí nén áp suất thấp"
    }
  },

  {
    id: "racco-bsp-12",
    name: "Rắc co ren BSP thẳng (nam - nữ)",
    category: "rac-co",
    size: 'Phi 1/2"',
    price: 32000,
    unit: "cái",
    icon: "hex",
    badge: "Bán chạy",
    desc: "Đầu nối ren BSP song song, dùng phổ biến trong hệ thống thủy lực và khí nén tại Việt Nam.",
    specs: {
      "Tiêu chuẩn ren": "BSP (British Standard Pipe)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Ren thẳng nam - nữ"
    }
  },
  {
    id: "racco-npt-34",
    name: "Rắc co ren côn NPT",
    category: "rac-co",
    size: 'Phi 3/4"',
    price: 38000,
    unit: "cái",
    icon: "hex",
    desc: "Đầu nối ren côn tiêu chuẩn Mỹ, tự làm kín nhờ độ côn của ren, phổ biến trong máy nhập khẩu.",
    specs: {
      "Tiêu chuẩn ren": "NPT (National Pipe Thread)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 400 bar",
      "Kiểu kết nối": "Ren côn tự làm kín"
    }
  },
  {
    id: "racco-jic-916",
    name: "Đầu nối JIC 37° (nam - nữ)",
    category: "rac-co",
    size: 'Phi 9/16"',
    price: 45000,
    unit: "cái",
    icon: "hex",
    badge: "Bán chạy",
    desc: "Đầu nối côn 37 độ, làm kín bằng mặt côn, dùng phổ biến cho máy xúc, máy công trình.",
    specs: {
      "Tiêu chuẩn": "JIC 37° (SAE J514)",
      "Chất liệu": "Thép carbon mạ kẽm / inox",
      "Áp suất chịu tải": "Đến 420 bar",
      "Kiểu kết nối": "Mặt côn 37° tự làm kín"
    }
  },
  {
    id: "racco-orfs-34",
    name: "Đầu nối ORFS mặt phẳng",
    category: "rac-co",
    size: 'Phi 3/4"',
    price: 52000,
    unit: "cái",
    icon: "hex",
    desc: "Đầu nối mặt phẳng có gioăng O-ring, độ kín cao, hạn chế rò rỉ, dùng cho hệ thống áp lực cao.",
    specs: {
      "Tiêu chuẩn": "ORFS (O-Ring Face Seal)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 450 bar",
      "Kiểu kết nối": "Mặt phẳng + gioăng O-ring"
    }
  },
  {
    id: "racco-flange-1",
    name: "Mặt bích thủy lực SAE 4 bu-lông",
    category: "rac-co",
    size: 'Phi 1"',
    price: 95000,
    unit: "cái",
    icon: "flange",
    desc: "Mặt bích tiêu chuẩn SAE, lắp với block thủy lực, chịu áp lực cao và dễ tháo lắp bảo trì.",
    specs: {
      "Tiêu chuẩn": "SAE J518 (Code 61 / Code 62)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 400 bar",
      "Kiểu kết nối": "4 bu-lông, gioăng O-ring"
    }
  },
  {
    id: "racco-quick-12",
    name: "Khớp nối nhanh thủy lực (Quick Coupling)",
    category: "rac-co",
    size: 'Phi 1/2"',
    price: 128000,
    unit: "bộ",
    icon: "quick",
    badge: "Tiện lợi",
    desc: "Khớp nối tháo lắp nhanh không cần dụng cụ, tự khóa, hạn chế thất thoát dầu khi ngắt kết nối.",
    specs: {
      "Tiêu chuẩn": "ISO 7241-A",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Cắm nhanh, tự khóa bi"
    }
  },
  {
    id: "racco-tee-12",
    name: "Tê ren thủy lực (Tee)",
    category: "rac-co",
    size: 'Phi 1/2"',
    price: 42000,
    unit: "cái",
    icon: "tee",
    desc: "Chia dòng thủy lực thành 3 hướng, dùng khi cần rẽ nhánh đường ống trong hệ thống.",
    specs: {
      "Tiêu chuẩn ren": "BSP / NPT (theo yêu cầu)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "3 ngả ren trong"
    }
  },
  {
    id: "racco-elbow-34",
    name: "Cút nối 90 độ ren BSP",
    category: "rac-co",
    size: 'Phi 3/4"',
    price: 36000,
    unit: "cái",
    icon: "elbow",
    desc: "Đầu nối góc 90 độ, giúp bẻ hướng đường ống mà không cần uốn cong ống thủy lực.",
    specs: {
      "Tiêu chuẩn ren": "BSP",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Góc 90°, ren trong - ngoài"
    }
  },
  {
    id: "racco-union-1",
    name: "Măng sông nối ống (Union)",
    category: "rac-co",
    size: 'Phi 1"',
    price: 58000,
    unit: "cái",
    icon: "union",
    desc: "Dùng để nối dài hai đoạn ống hoặc hai đầu rắc co có cùng kích thước ren.",
    specs: {
      "Tiêu chuẩn ren": "BSP / NPT (theo yêu cầu)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 380 bar",
      "Kiểu kết nối": "Ren trong hai đầu"
    }
  },
  {
    id: "racco-cap-12",
    name: "Đầu bít ren thủy lực (Plug/Cap)",
    category: "rac-co",
    size: 'Phi 1/2"',
    price: 18000,
    unit: "cái",
    icon: "cap",
    badge: "Giá tốt",
    desc: "Bịt kín đầu ống hoặc cổng không sử dụng, ngăn bụi bẩn và rò rỉ dầu.",
    specs: {
      "Tiêu chuẩn ren": "BSP / NPT (theo yêu cầu)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Ren ngoài / ren trong bịt kín"
    }
  }
];

/* Tồn kho mẫu — sản phẩm thật sẽ lấy số tồn kho từ cột "Tồn kho" trong Sheet
   (xem refreshProductsFromSheet). Gán tạm ở đây để demo cảnh báo sắp hết/hết hàng. */
const SAMPLE_STOCK_ = {
  "ong-1sn-12": 50, "ong-2sn-34": 40, "ong-4sp-1": 25, "ong-4sh-114": 15,
  "ong-spiral-2": 8, "ong-chiu-nhiet": 20, "ong-r3-38": 0,
  "racco-bsp-12": 100, "racco-npt-34": 60, "racco-jic-916": 3, "racco-orfs-34": 30,
  "racco-flange-1": 12, "racco-quick-12": 18, "racco-tee-12": 45, "racco-elbow-34": 50,
  "racco-union-1": 22, "racco-cap-12": 200
};
PRODUCTS.forEach(p => {
  if(p.stock === undefined) p.stock = SAMPLE_STOCK_[p.id] !== undefined ? SAMPLE_STOCK_[p.id] : 999;
});

function findProduct(id){
  return PRODUCTS.find(p => p.id === id);
}

function formatVND(n){
  return n.toLocaleString('vi-VN') + '₫';
}

/* =========================================================
   Tải danh sách sản phẩm mới nhất từ Google Sheet (nếu đã cấu hình
   APPS_SCRIPT_URL trong js/config.js). Nếu chưa cấu hình, lỗi mạng,
   hoặc Sheet trống thì giữ nguyên dữ liệu mẫu ở trên — website vẫn
   chạy bình thường.
   ========================================================= */
function refreshProductsFromSheet(){
  if(typeof APPS_SCRIPT_URL === "undefined" || !APPS_SCRIPT_URL) return;
  fetch(APPS_SCRIPT_URL + "?action=products")
    .then(res => res.json())
    .then(data => {
      if(data && data.success && Array.isArray(data.products) && data.products.length){
        PRODUCTS.length = 0;
        data.products.forEach(p => {
          if(p.stock === undefined || p.stock === null || isNaN(p.stock)) p.stock = 999;
          PRODUCTS.push(p);
        });
        window.dispatchEvent(new Event("products-updated"));
      }
    })
    .catch(() => { /* giữ dữ liệu mẫu nếu chưa kết nối được Sheet */ });
}
document.addEventListener("DOMContentLoaded", refreshProductsFromSheet);

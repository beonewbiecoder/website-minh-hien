/* =========================================================
   TỰ ĐỘNG SINH RA BỞI scripts/build-products.js — KHÔNG SỬA TAY.
   Dữ liệu lấy từ Sheet Products (qua Apps Script) tại thời điểm build.
   Sửa sản phẩm ở trang quan-ly-san-pham.html, GitHub Actions sẽ tự build
   lại file này (thường mất chưa tới 1 phút).
   ========================================================= */

const PRODUCTS_DATA_ = [
  {
    "id": "ong-1sn-12",
    "name": "Ống thủy lực 1 lớp thép bện SAE 100R1AT",
    "category": "ong-thuy-luc",
    "size": "Phi 12.7mm (1/2\")",
    "price": 62000,
    "unit": "mét",
    "desc": "Ống 1 lớp thép bện, chịu áp suất làm việc trung bình, dùng cho hệ thống thủy lực di động và máy công trình.",
    "badge": "Bán chạy",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "SAE 100R1AT / EN 853 1SN",
      "Áp suất làm việc": "88 – 225 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "1 lớp thép bện",
      "Ứng dụng": "Xe nâng, máy xúc, máy ép thủy lực"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "ong-2sn-34",
    "name": "Ống thủy lực 2 lớp thép bện SAE 100R2AT",
    "category": "ong-thuy-luc",
    "size": "Phi 19mm (3/4\")",
    "price": 98000,
    "unit": "mét",
    "desc": "Ống 2 lớp thép bện, chịu áp lực cao hơn R1, phù hợp hệ thống thủy lực công nghiệp và máy xây dựng.",
    "badge": "Bán chạy",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "SAE 100R2AT / EN 853 2SN",
      "Áp suất làm việc": "125 – 320 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "2 lớp thép bện",
      "Ứng dụng": "Máy xúc, máy ép, hệ thống thủy lực công nghiệp"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "ong-4sp-1",
    "name": "Ống thủy lực 4 lớp thép bện 4SP",
    "category": "ong-thuy-luc",
    "size": "Phi 25.4mm (1\")",
    "price": 165000,
    "unit": "mét",
    "desc": "Ống 4 lớp thép bện chịu áp cực cao, dùng cho hệ thống thủy lực tải nặng, ép cọc, cẩu trục.",
    "badge": "",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "EN 856 4SP",
      "Áp suất làm việc": "250 – 400 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "4 lớp thép bện",
      "Ứng dụng": "Cẩu trục, máy ép cọc, thiết bị tải nặng"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "ong-4sh-114",
    "name": "Ống thủy lực 4 lớp thép bện 4SH",
    "category": "ong-thuy-luc",
    "size": "Phi 31.8mm (1-1/4\")",
    "price": 210000,
    "unit": "mét",
    "desc": "Ống 4 lớp thép bện xoắn kép, chịu áp lực rất cao, dùng cho các hệ thống thủy lực siêu trường siêu trọng.",
    "badge": "",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "EN 856 4SH",
      "Áp suất làm việc": "220 – 350 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "4 lớp thép bện xoắn kép",
      "Ứng dụng": "Máy ép công nghiệp, thiết bị khai khoáng"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "ong-spiral-2",
    "name": "Ống thủy lực xoắn ốc (Spiral) R15",
    "category": "ong-thuy-luc",
    "size": "Phi 50.8mm (2\")",
    "price": 385000,
    "unit": "mét",
    "desc": "Ống xoắn ốc nhiều lớp thép, chịu áp cực cao cho hệ thống thủy lực cỡ lớn, đường ống chính.",
    "badge": "Cỡ lớn",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "SAE 100R15 / EN 856 R15",
      "Áp suất làm việc": "280 – 420 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 121°C",
      "Lớp gia cường": "4–6 lớp thép xoắn ốc",
      "Ứng dụng": "Đường ống chính, thiết bị khai khoáng, cảng biển"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "ong-chiu-nhiet",
    "name": "Ống thủy lực chịu nhiệt cao EN 856 4SP",
    "category": "ong-thuy-luc",
    "size": "Phi 25.4mm (1\")",
    "price": 178000,
    "unit": "mét",
    "desc": "Lớp cao su ngoài chịu nhiệt, dùng ở môi trường nhiệt độ cao gần động cơ, lò hơi.",
    "badge": "",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "EN 856 4SP - chịu nhiệt",
      "Áp suất làm việc": "250 – 380 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 121°C",
      "Lớp gia cường": "4 lớp thép bện",
      "Ứng dụng": "Gần động cơ, lò hơi, môi trường nhiệt độ cao"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "ong-r3-38",
    "name": "Ống mềm thủy lực áp suất thấp SAE 100R3",
    "category": "ong-thuy-luc",
    "size": "Phi 9.5mm (3/8\")",
    "price": 28000,
    "unit": "mét",
    "desc": "Ống mềm 2 lớp sợi dệt, dùng cho hệ thống áp suất thấp, dầu, nước, khí nén.",
    "badge": "Giá tốt",
    "icon": "hose",
    "specs": {
      "Tiêu chuẩn": "SAE 100R3",
      "Áp suất làm việc": "35 – 65 bar (tùy phi)",
      "Nhiệt độ": "-40°C đến 100°C",
      "Lớp gia cường": "2 lớp sợi dệt",
      "Ứng dụng": "Hệ thống dầu, nước, khí nén áp suất thấp"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-bsp-12",
    "name": "Rắc co ren BSP thẳng (nam - nữ)",
    "category": "rac-co",
    "size": "Phi 1/2\"",
    "price": 32000,
    "unit": "cái",
    "desc": "Đầu nối ren BSP song song, dùng phổ biến trong hệ thống thủy lực và khí nén tại Việt Nam.",
    "badge": "Bán chạy",
    "icon": "hex",
    "specs": {
      "Tiêu chuẩn ren": "BSP (British Standard Pipe)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Ren thẳng nam - nữ"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-npt-34",
    "name": "Rắc co ren côn NPT",
    "category": "rac-co",
    "size": "Phi 3/4\"",
    "price": 38000,
    "unit": "cái",
    "desc": "Đầu nối ren côn tiêu chuẩn Mỹ, tự làm kín nhờ độ côn của ren, phổ biến trong máy nhập khẩu.",
    "badge": "",
    "icon": "hex",
    "specs": {
      "Tiêu chuẩn ren": "NPT (National Pipe Thread)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 400 bar",
      "Kiểu kết nối": "Ren côn tự làm kín"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-jic-916",
    "name": "Đầu nối JIC 37° (nam - nữ)",
    "category": "rac-co",
    "size": "Phi 9/16\"",
    "price": 45000,
    "unit": "cái",
    "desc": "Đầu nối côn 37 độ, làm kín bằng mặt côn, dùng phổ biến cho máy xúc, máy công trình.",
    "badge": "Bán chạy",
    "icon": "hex",
    "specs": {
      "Tiêu chuẩn": "JIC 37° (SAE J514)",
      "Chất liệu": "Thép carbon mạ kẽm / inox",
      "Áp suất chịu tải": "Đến 420 bar",
      "Kiểu kết nối": "Mặt côn 37° tự làm kín"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-orfs-34",
    "name": "Đầu nối ORFS mặt phẳng",
    "category": "rac-co",
    "size": "Phi 3/4\"",
    "price": 52000,
    "unit": "cái",
    "desc": "Đầu nối mặt phẳng có gioăng O-ring, độ kín cao, hạn chế rò rỉ, dùng cho hệ thống áp lực cao.",
    "badge": "",
    "icon": "hex",
    "specs": {
      "Tiêu chuẩn": "ORFS (O-Ring Face Seal)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 450 bar",
      "Kiểu kết nối": "Mặt phẳng + gioăng O-ring"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-flange-1",
    "name": "Mặt bích thủy lực SAE 4 bu-lông",
    "category": "rac-co",
    "size": "Phi 1\"",
    "price": 95000,
    "unit": "cái",
    "desc": "Mặt bích tiêu chuẩn SAE, lắp với block thủy lực, chịu áp lực cao và dễ tháo lắp bảo trì.",
    "badge": "",
    "icon": "flange",
    "specs": {
      "Tiêu chuẩn": "SAE J518 (Code 61 / Code 62)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 400 bar",
      "Kiểu kết nối": "4 bu-lông, gioăng O-ring"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-quick-12",
    "name": "Khớp nối nhanh thủy lực (Quick Coupling)",
    "category": "rac-co",
    "size": "Phi 1/2\"",
    "price": 128000,
    "unit": "bộ",
    "desc": "Khớp nối tháo lắp nhanh không cần dụng cụ, tự khóa, hạn chế thất thoát dầu khi ngắt kết nối.",
    "badge": "Tiện lợi",
    "icon": "quick",
    "specs": {
      "Tiêu chuẩn": "ISO 7241-A",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Cắm nhanh, tự khóa bi"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-tee-12",
    "name": "Tê ren thủy lực (Tee)",
    "category": "rac-co",
    "size": "Phi 1/2\"",
    "price": 42000,
    "unit": "cái",
    "desc": "Chia dòng thủy lực thành 3 hướng, dùng khi cần rẽ nhánh đường ống trong hệ thống.",
    "badge": "",
    "icon": "tee",
    "specs": {
      "Tiêu chuẩn ren": "BSP / NPT (theo yêu cầu)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "3 ngả ren trong"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-elbow-34",
    "name": "Cút nối 90 độ ren BSP",
    "category": "rac-co",
    "size": "Phi 3/4\"",
    "price": 36000,
    "unit": "cái",
    "desc": "Đầu nối góc 90 độ, giúp bẻ hướng đường ống mà không cần uốn cong ống thủy lực.",
    "badge": "",
    "icon": "elbow",
    "specs": {
      "Tiêu chuẩn ren": "BSP",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Góc 90°, ren trong - ngoài"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-union-1",
    "name": "Măng sông nối ống (Union)",
    "category": "rac-co",
    "size": "Phi 1\"",
    "price": 58000,
    "unit": "cái",
    "desc": "Dùng để nối dài hai đoạn ống hoặc hai đầu rắc co có cùng kích thước ren.",
    "badge": "",
    "icon": "union",
    "specs": {
      "Tiêu chuẩn ren": "BSP / NPT (theo yêu cầu)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 380 bar",
      "Kiểu kết nối": "Ren trong hai đầu"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "racco-cap-12",
    "name": "Đầu bít ren thủy lực (Plug/Cap)",
    "category": "rac-co",
    "size": "Phi 1/2\"",
    "price": 18000,
    "unit": "cái",
    "desc": "Bịt kín đầu ống hoặc cổng không sử dụng, ngăn bụi bẩn và rò rỉ dầu.",
    "badge": "Giá tốt",
    "icon": "cap",
    "specs": {
      "Tiêu chuẩn ren": "BSP / NPT (theo yêu cầu)",
      "Chất liệu": "Thép carbon mạ kẽm",
      "Áp suất chịu tải": "Đến 350 bar",
      "Kiểu kết nối": "Ren ngoài / ren trong bịt kín"
    },
    "stock": 0,
    "status": "Còn hàng",
    "images": [],
    "model3d": "",
    "longDesc": ""
  },
  {
    "id": "nga-3-dau-nen-khi-12-li",
    "name": "Ngã 3 Đầu Nén Khí (12 li)",
    "category": "ong-thuy-luc",
    "size": "12 li",
    "price": 10000,
    "unit": "cái",
    "desc": "Không biết mô tả gì luôn=)))) hiện tại đang sửa thử xem nó đã xuất hiện nhanh hơn chưa",
    "badge": "Bán chạy",
    "icon": "hose",
    "specs": {
      "Số Đầu": "3 đầu",
      "Kích Thước": "12 li",
      "Vật liệu": "Nhựa"
    },
    "stock": 4,
    "status": "Còn hàng",
    "images": [
      "https://drive.google.com/thumbnail?id=1Cpgpudtfjskz2WPnqqHzZhDo2CawJkke&sz=w1000",
      "https://drive.google.com/thumbnail?id=1CZvXubOOsjdwWEVewsjdIXmKRs9qQEB9&sz=w1000",
      "https://drive.google.com/thumbnail?id=1YW80iV5lUhDg9iosug2PsrFG3EnJSMuW&sz=w1000",
      "https://drive.google.com/thumbnail?id=1a0wYSinOzCSb_f-vFCDDjVtVqmMaxRjK&sz=w1000"
    ],
    "model3d": "",
    "longDesc": ""
  }
];

PRODUCTS.length = 0;
PRODUCTS_DATA_.forEach(function (p) { PRODUCTS.push(p); });

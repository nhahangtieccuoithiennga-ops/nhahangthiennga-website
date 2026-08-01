# Hướng dẫn kết nối Form "Đặt lịch tư vấn" với Google Sheet

Form đã sẵn sàng trên web (nút "Đặt lịch tư vấn" ở trang chủ). Việc còn lại là 10 phút
làm theo các bước dưới đây để dữ liệu khách hàng tự động chảy vào 1 Google Sheet —
không cần server, không tốn phí.

## Bước 1 — Tạo Google Sheet mới
1. Vào https://sheets.google.com → tạo Sheet mới, đặt tên "Khách hàng đặt lịch tư vấn".
2. Dòng đầu tiên (header), gõ đúng các cột theo thứ tự sau:
   `Thời gian | Họ tên | Số điện thoại | Email | Loại tiệc | Số bàn dự kiến | Ngày dự kiến | Ghi chú | Trang gửi`

## Bước 2 — Mở Apps Script gắn với Sheet này
1. Trong Sheet, vào menu **Tiện ích mở rộng (Extensions) → Apps Script**.
2. Xoá hết code mẫu, dán đoạn code sau vào:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var p = e.parameter;
  sheet.appendRow([
    new Date(p.thoiGianGui || new Date()),
    p.hoTen || "",
    p.soDienThoai || "",
    p.email || "",
    p.loaiTiec || "",
    p.soBan || "",
    p.ngayDuKien || "",
    p.ghiChu || "",
    p.trang || ""
  ]);
  return ContentService.createTextOutput("OK");
}
```

3. Đặt tên project (góc trên bên trái) là "Booking Form Thiện Nga" rồi Lưu (Ctrl+S).

## Bước 3 — Deploy thành Web App
1. Nhấn nút **Deploy → New deployment** (Triển khai → Triển khai mới) ở góc trên bên phải.
2. Chọn loại (Select type) → **Web app**.
3. Cấu hình:
   - Execute as (Thực thi với tư cách): **Me (tài khoản của bạn)**
   - Who has access (Ai được truy cập): **Anyone** (Bất kỳ ai)
4. Nhấn **Deploy**. Lần đầu Google sẽ hỏi cấp quyền — chọn tài khoản của bạn → Advanced/Nâng cao → Go to Booking Form Thiện Nga (unsafe) → Allow/Cho phép. (Đây là bình thường vì đây là script tự viết, không phải app lạ.)
5. Copy **Web app URL** hiện ra (dạng `https://script.google.com/macros/s/xxxxxxxx/exec`).

## Bước 4 — Gắn URL vào website
Gửi URL đó cho Claude Code (hoặc tự mở file
`website/assets/booking-form.js`, dòng 19:

```javascript
var APPS_SCRIPT_URL = "";
```

đổi thành:

```javascript
var APPS_SCRIPT_URL = "https://script.google.com/macros/s/xxxxxxxx/exec";
```

rồi lưu lại và deploy web (FTP) như bình thường.

## Bước 5 — Kiểm tra
1. Vào website thật, bấm "Đặt lịch tư vấn", điền thử thông tin, bấm Gửi.
2. Mở lại Google Sheet — sẽ thấy 1 dòng mới xuất hiện với đầy đủ thông tin vừa điền.

## Lưu ý
- Mỗi lần sửa code trong Apps Script, phải bấm lại **Deploy → Manage deployments → nút sửa (bút chì) → chọn "New version" → Deploy** thì thay đổi mới có hiệu lực (không tự cập nhật).
- Nếu chưa kịp làm bước này, form vẫn hoạt động bình thường — khách vẫn thấy thông báo "Đã nhận được thông tin" và có nút gọi/Zalo ngay bên dưới để liên hệ trực tiếp, không bị mất khách.

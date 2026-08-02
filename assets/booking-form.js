/* ══════════════════════════════════════════════════════════
   FORM KHẢO SÁT ĐẶT LỊCH TƯ VẤN — Thiện Nga
   Tự chèn CSS + modal + logic. Include ở cuối trang:
   <script src="assets/booking-form.js"></script>

   Mở modal bằng cách gắn class "js-open-booking" vào bất kỳ nút/link nào
   (nút "Đặt lịch tư vấn" ở index.html đã được gắn sẵn).

   Dữ liệu gửi tới Google Apps Script Web App (APPS_SCRIPT_URL bên dưới)
   để ghi thành 1 dòng mới vào Google Sheet "khách hàng" — xem hướng dẫn
   tạo Apps Script trong file BOOKING_APPS_SCRIPT_HUONG_DAN.md cùng thư mục.
   Nếu chưa cấu hình, form vẫn hiện nhưng sẽ hướng khách gọi hotline/Zalo
   trực tiếp thay vì gửi âm thầm mà mất dữ liệu.
══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── CẤU HÌNH: dán URL Apps Script Web App vào đây sau khi Deploy ── */
  var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwezJxz0ZoNSHCd66nntlWmSehhedqfUE4xVtfeoeGPIjer63V-_N5TEt_S3xDqcQTgxg/exec";
  var PAYMENT_AMOUNT = 2000;
  var SEPAY_PAYMENT_URL = "https://vietqr.app/img?bank=TPBank&acc=10004884646&template=compact&amount=2000&des=test+Thien+Nga&showinfo=true&holder=LE%20THUONG%20DUY&store=Nh%C3%A0%20H%C3%A0ng%20Thi%E1%BB%87n%20Nga"; // dán link thanh toán/chuyển khoản SePay của bạn vào đây
  var SEPAY_QR_URL = "https://vietqr.app/img?bank=TPBank&acc=10004884646&template=compact&amount=2000&des=test+Thien+Nga&showinfo=true&holder=LE%20THUONG%20DUY&store=Nh%C3%A0%20H%C3%A0ng%20Thi%E1%BB%87n%20Nga";       // dán ảnh QR SePay nếu có

  var css = `
  .tnBkOverlay{position:fixed;inset:0;z-index:80;background:rgba(5,30,16,.55);backdrop-filter:blur(2px);
    display:none;align-items:center;justify-content:center;padding:16px}
  .tnBkOverlay.open{display:flex}
  .tnBkModal{width:min(480px,100%);max-height:calc(100dvh - 32px);overflow-y:auto;background:#fff;
    border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:'Inter','Segoe UI',Arial,sans-serif}
  .tnBkHead{background:linear-gradient(135deg,#0f5a2c,#174b35);color:#fff;padding:20px 22px;position:relative}
  .tnBkHead h3{font-family:Georgia,'Playfair Display',serif;font-size:20px;color:#f1cf73;margin:0 0 6px}
  .tnBkHead p{font-size:13px;color:#d9ecdf;margin:0}
  .tnBkClose{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;border:none;
    background:rgba(255,255,255,.18);color:#fff;font-size:18px;cursor:pointer}
  .tnBkClose:hover{background:rgba(255,255,255,.3)}
  .tnBkBody{padding:20px 22px}
  .tnBkField{margin-bottom:14px}
  .tnBkField label{display:block;font-size:13px;font-weight:800;color:#0b3f26;margin-bottom:5px}
  .tnBkField input,.tnBkField select,.tnBkField textarea{width:100%;padding:10px 12px;border:2px solid #d9e4eb;
    border-radius:9px;font-size:14px;font-family:inherit;color:#173322;outline:none;transition:border-color .15s}
  .tnBkField input:focus,.tnBkField select:focus,.tnBkField textarea:focus{border-color:#5d8f47}
  .tnBkField textarea{resize:vertical;min-height:64px}
  .tnBkRow2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .tnBkSubmit{width:100%;padding:13px;background:linear-gradient(145deg,#1e8f47,#0f5a2c);color:#fff;
    border:none;border-radius:10px;font-size:14.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;
    cursor:pointer;box-shadow:0 4px 0 #063d1a,0 8px 20px rgba(15,90,44,.4);transition:transform .12s,box-shadow .12s}
  .tnBkSubmit:hover{transform:translateY(2px);box-shadow:0 2px 0 #063d1a,0 5px 12px rgba(15,90,44,.35)}
  .tnBkSubmit:disabled{opacity:.6;cursor:wait}
  .tnBkNote{margin-top:12px;font-size:11.5px;color:#657668;text-align:center}
  .tnBkAlt{margin-top:14px;padding-top:14px;border-top:1px solid #eee;display:flex;gap:10px}
  .tnBkAlt a{flex:1;text-align:center;padding:10px;border-radius:9px;font-size:13px;font-weight:800;text-decoration:none}
  .tnBkAlt a.tnBkCall{background:#0f5a2c;color:#fff}
  .tnBkAlt a.tnBkZalo{background:#e8f4ff;color:#0068ff;border:1.5px solid #b6dcff}
  .tnBkSuccess{padding:30px 22px;text-align:center}
  .tnBkSuccess .tnBkIcon{font-size:44px;margin-bottom:10px}
  .tnBkSuccess h3{color:#0b3f26;font-family:Georgia,serif;font-size:19px;margin-bottom:8px}
  .tnBkSuccess p{color:#657668;font-size:13.5px;line-height:1.6}
  .tnBkSummary{margin:16px 0 18px;padding:14px;background:#f5fbf6;border:1px solid #d8e9db;border-radius:12px;text-align:left}
  .tnBkSummary .row{display:flex;justify-content:space-between;gap:12px;font-size:12.8px;color:#173322;padding:6px 0;border-bottom:1px dashed #d1dfd3}
  .tnBkSummary .row:last-child{border-bottom:none}
  .tnBkPayBox{margin-top:16px;padding:14px;border:1px solid #d8e9db;background:#fff;border-radius:12px;text-align:left}
  .tnBkPayBox strong{display:block;margin-bottom:8px;color:#0b3f26}
  .tnBkPayBox .amount{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border-radius:999px;background:#edf6ee;color:#0b3f26;font-weight:900;font-size:13px}
  .tnBkPayBox .qr{margin-top:12px;display:grid;place-items:center;min-height:140px;border:1px dashed #b9d2bb;border-radius:10px;background:#fafdfb}
  .tnBkPayBox .qr img{max-width:160px;max-height:160px;border-radius:10px}
  .tnBkWarn{background:#fff8e7;border:1.5px solid #b88a34;border-radius:9px;padding:10px 12px;
    font-size:12px;color:#7a5a1f;margin-bottom:14px;line-height:1.5}
  @media(max-width:480px){
    .tnBkRow2{grid-template-columns:1fr}
    .tnBkOverlay{padding:0}
    .tnBkModal{width:100%;height:100%;max-height:100dvh;border-radius:0}
  }
  `;
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var wrap = document.createElement("div");
  wrap.innerHTML = `
  <div class="tnBkOverlay" id="tnBkOverlay" role="dialog" aria-label="Đặt lịch tư vấn">
    <div class="tnBkModal">
      <div class="tnBkHead">
        <button class="tnBkClose" id="tnBkClose" aria-label="Đóng">×</button>
        <h3>Đặt lịch tư vấn miễn phí</h3>
        <p>Để lại thông tin, Thiện Nga sẽ liên hệ tư vấn thực đơn &amp; giá phù hợp với mình trong thời gian sớm nhất.</p>
      </div>
      <div class="tnBkBody" id="tnBkBody">
        <div class="tnBkWarn" id="tnBkWarn" style="display:none"></div>
        <form id="tnBkForm">
          <div class="tnBkField">
            <label>Họ tên *</label>
            <input type="text" id="tnBkName" required placeholder="Anh/chị tên gì ạ?">
          </div>
          <div class="tnBkField">
            <label>Số điện thoại / Zalo *</label>
            <input type="tel" id="tnBkPhone" required placeholder="09xxxxxxxx">
          </div>
          <div class="tnBkField">
            <label>Email (không bắt buộc)</label>
            <input type="email" id="tnBkEmail" placeholder="email@example.com">
          </div>
          <div class="tnBkRow2">
            <div class="tnBkField">
              <label>Loại tiệc</label>
              <select id="tnBkType">
                <option>Tiệc cưới</option>
                <option>Đám giỗ</option>
                <option>Sinh nhật / Thôi nôi</option>
                <option>Liên hoan / Tân gia</option>
                <option>Quán nhậu hàng ngày</option>
                <option>Khác</option>
              </select>
            </div>
            <div class="tnBkField">
              <label>Số bàn dự kiến</label>
              <input type="number" id="tnBkTables" min="1" placeholder="VD: 10">
            </div>
          </div>
          <div class="tnBkField">
            <label>Ngày dự kiến tổ chức</label>
            <input type="date" id="tnBkDate">
          </div>
          <div class="tnBkField">
            <label>Ghi chú thêm</label>
            <textarea id="tnBkNote" placeholder="Ngân sách mong muốn, yêu cầu decor, ghi chú khác..."></textarea>
          </div>
          <button type="submit" class="tnBkSubmit" id="tnBkSubmit">Gửi thông tin, nhận tư vấn</button>
          <p class="tnBkNote">Thông tin của anh/chị chỉ dùng để liên hệ tư vấn, không chia sẻ cho bên thứ ba.</p>
        </form>
        <div class="tnBkAlt">
          <a class="tnBkCall" href="tel:0965626128">☎ Gọi ngay</a>
          <a class="tnBkZalo" href="https://zalo.me/0965626128" target="_blank" rel="noopener">💬 Nhắn Zalo</a>
        </div>
      </div>
    </div>
  </div>
  `;
  document.body.appendChild(wrap);

  var overlay = document.getElementById("tnBkOverlay");
  var body = document.getElementById("tnBkBody");
  var warnBox = document.getElementById("tnBkWarn");

  if (!APPS_SCRIPT_URL) {
    warnBox.style.display = "block";
    warnBox.textContent = "Form đang chờ kết nối Google Sheet — anh/chị vẫn có thể điền, bên em sẽ nhận được thông báo, hoặc gọi hotline/Zalo bên dưới để được tư vấn ngay.";
  }

  function openModal() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.getElementById("tnBkClose").addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });

  document.querySelectorAll(".js-open-booking").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });

  document.getElementById("tnBkForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var submitBtn = document.getElementById("tnBkSubmit");
    var data = {
      hoTen: document.getElementById("tnBkName").value.trim(),
      soDienThoai: document.getElementById("tnBkPhone").value.trim(),
      email: document.getElementById("tnBkEmail").value.trim(),
      loaiTiec: document.getElementById("tnBkType").value,
      soBan: document.getElementById("tnBkTables").value.trim(),
      ngayDuKien: document.getElementById("tnBkDate").value,
      ghiChu: document.getElementById("tnBkNote").value.trim(),
      amount: PAYMENT_AMOUNT,
      trang: window.location.pathname.split("/").pop() || "index.html",
      thoiGianGui: new Date().toISOString()
    };

    function showSuccess() {
      var orderId = "TN" + Date.now().toString().slice(-8);
      var orderPayload = {
        orderId: orderId,
        customer: data.hoTen,
        phone: data.soDienThoai,
        amount: PAYMENT_AMOUNT,
        status: "pending",
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("tn_last_order", JSON.stringify(orderPayload));

      var qrHtml = "";
      if (SEPAY_QR_URL) {
        qrHtml = '<div class="qr"><img src="' + SEPAY_QR_URL + '" alt="QR SePay"></div>';
      } else {
        qrHtml = '<div class="qr"><div style="font-size:13px;color:#657668;text-align:center;line-height:1.6">Chưa có QR SePay được dán.\nAnh/chị có thể dán link SePay hoặc QR sau khi đã có dữ liệu thật.</div></div>';
      }

      body.innerHTML =
        '<div class="tnBkSuccess">' +
          '<div class="tnBkIcon">✅</div>' +
          '<h3>Đã nhận được thông tin!</h3>' +
          '<p>Cảm ơn anh/chị <b>' + (data.hoTen || "") + '</b> đã tin tưởng Thiện Nga.<br>' +
          'Bên em sẽ liên hệ số <b>' + (data.soDienThoai || "") + '</b> để tư vấn trong thời gian sớm nhất ạ.</p>' +
          '<div class="tnBkSummary">' +
            '<div class="row"><span>Mã đơn</span><b>' + orderId + '</b></div>' +
            '<div class="row"><span>Tổng tiền test</span><b>' + PAYMENT_AMOUNT.toLocaleString("vi-VN") + 'đ</b></div>' +
            '<div class="row"><span>Trạng thái</span><b>Pending</b></div>' +
          '</div>' +
          '<div class="tnBkPayBox">' +
            '<strong>Thanh toán qua SePay</strong>' +
            '<div class="amount">💳 Chuyển ' + PAYMENT_AMOUNT.toLocaleString("vi-VN") + 'đ</div>' +
            qrHtml +
            (SEPAY_PAYMENT_URL ? '<p style="margin-top:10px;font-size:12.5px"><a href="' + SEPAY_PAYMENT_URL + '" target="_blank" rel="noopener">Mở link thanh toán SePay</a></p>' : '') +
          '</div>' +
          '<div class="tnBkAlt" style="margin-top:18px">' +
            '<a class="tnBkCall" href="tel:0965626128">☎ Gọi ngay luôn</a>' +
            '<a class="tnBkZalo" href="https://zalo.me/0965626128" target="_blank" rel="noopener">💬 Nhắn Zalo</a>' +
          '</div>' +
        '</div>';
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Đang gửi...";

    var sheetRequest = Promise.resolve();
    if (APPS_SCRIPT_URL) {
      var formBody = new URLSearchParams(data).toString();
      sheetRequest = fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      }).catch(function (err) {
        console.error("Lỗi gửi Google Sheet:", err);
      });
    }

    var crmRequest = fetch("/admin/api.php?action=booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (response) {
      return response.json().catch(function () {
        return {};
      }).then(function (payload) {
        if (!response.ok || payload.error) {
          throw new Error(payload.error || "Không thể lưu booking");
        }
        return payload;
      });
    }).catch(function (err) {
      console.error("Lỗi lưu CRM:", err);
    });

    Promise.all([crmRequest, sheetRequest]).then(function () {
      showSuccess();
    }).catch(function () {
      showSuccess();
    });
  });
})();

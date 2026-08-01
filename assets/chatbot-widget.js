/* ══════════════════════════════════════════════════════════
   CHATBOT WIDGET — Thiện Nga
   Tự chèn CSS + HTML + logic. Chỉ cần include sau chatbot-data.js:
   <script src="assets/chatbot-data.js"></script>
   <script src="assets/chatbot-widget.js"></script>

   NGUỒN CÂU HỎI: ưu tiên đọc từ Google Sheet (SHEET_CSV bên dưới) để
   chủ quán tự thêm/sửa/xoá câu hỏi không cần sửa code. Nếu chưa cấu
   hình hoặc tải Sheet lỗi, tự dùng danh sách dự phòng trong
   chatbot-data.js (166 câu có sẵn) để chatbot vẫn hoạt động bình thường.

   Cấu trúc cột Sheet (đúng theo file website/data/chatbot_faq_import.csv):
   STT | Nhom | Cau hoi chinh | Bien the (cach nhau bang ; ) | Cau tra loi | Tag
══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── CẤU HÌNH: dán link CSV Google Sheet vào đây sau khi "Xuất bản lên web" ── */
  var SHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpj_lQeSqkmyV9AE81T3-H905KhMV7Hl0hNziZfNbTk9vTy85ChSXp7CylLX8XN25gXKZNQbkdnEtW/pub?gid=109661417&single=true&output=csv";

  /* ── CSS ── */
  var css = `
  .tnChatBtn{position:fixed;right:20px;bottom:20px;z-index:70;width:60px;height:60px;border-radius:50%;
    background:linear-gradient(145deg,#1e8f47,#0f5a2c);color:#fff;border:none;cursor:pointer;
    display:grid;place-items:center;font-size:26px;box-shadow:0 4px 0 #063d1a,0 10px 24px rgba(15,90,44,.45);
    transition:transform .15s,box-shadow .15s}
  .tnChatBtn:hover{transform:translateY(2px);box-shadow:0 2px 0 #063d1a,0 6px 16px rgba(15,90,44,.4)}
  .tnChatBtn .tnBadge{position:absolute;top:-2px;right:-2px;width:16px;height:16px;border-radius:50%;
    background:#f1cf73;border:2px solid #fff}
  .tnChatPanel{position:fixed;right:20px;bottom:92px;z-index:70;width:min(360px,calc(100vw - 32px));
    height:min(520px,calc(100vh - 140px));background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.28);
    display:none;flex-direction:column;overflow:hidden;font-family:'Inter','Segoe UI',Arial,sans-serif}
  .tnChatPanel.open{display:flex}
  .tnChatHead{background:linear-gradient(135deg,#0f5a2c,#174b35);color:#fff;padding:14px 16px;
    display:flex;align-items:center;gap:10px}
  .tnChatHead .tnAvatar{width:36px;height:36px;border-radius:50%;background:#fff;color:#0f5a2c;
    display:grid;place-items:center;font-weight:900;font-family:Georgia,serif;font-size:15px;flex-shrink:0}
  .tnChatHead .tnTitle{flex:1;min-width:0}
  .tnChatHead .tnTitle b{display:block;font-size:14.5px}
  .tnChatHead .tnTitle span{display:block;font-size:11.5px;color:#bfe3cc}
  .tnChatHead button{background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;
    border-radius:50%;cursor:pointer;font-size:16px;line-height:1;flex-shrink:0}
  .tnChatHead button:hover{background:rgba(255,255,255,.28)}
  .tnChatBody{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f7f5ef}
  .tnMsg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:13.5px;line-height:1.5;white-space:pre-wrap}
  .tnMsg.bot{align-self:flex-start;background:#fff;color:#173322;border-bottom-left-radius:3px;
    box-shadow:0 2px 6px rgba(15,90,44,.08)}
  .tnMsg.user{align-self:flex-end;background:#0f5a2c;color:#fff;border-bottom-right-radius:3px}
  .tnMsg.bot a{color:#0f5a2c;font-weight:700;text-decoration:underline}
  .tnQuick{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}
  .tnQuick button{border:1.5px solid #d9e4eb;background:#fff;color:#0b3f26;font-size:12px;font-weight:700;
    padding:7px 11px;border-radius:99px;cursor:pointer;font-family:inherit;transition:all .15s}
  .tnQuick button:hover{border-color:#5d8f47;background:#edf6ee}
  .tnChatFoot{border-top:1px solid #eee;padding:10px;display:flex;gap:8px;align-items:center;background:#fff}
  .tnChatFoot input{flex:1;border:2px solid #d9e4eb;border-radius:20px;padding:9px 14px;font-size:13.5px;
    font-family:inherit;outline:none}
  .tnChatFoot input:focus{border-color:#5d8f47}
  .tnChatFoot button{width:38px;height:38px;border-radius:50%;border:none;background:#0f5a2c;color:#fff;
    cursor:pointer;font-size:16px;flex-shrink:0}
  .tnChatFoot button:hover{background:#174b35}
  .tnEscRow{display:flex;gap:8px;padding:8px 10px 0}
  .tnEscRow a{flex:1;text-align:center;padding:7px 8px;border-radius:8px;font-size:11.5px;font-weight:800;
    text-decoration:none}
  .tnEscRow a.tnCall{background:var(--blue,#0f5a2c);color:#fff}
  .tnEscRow a.tnZalo{background:#e8f4ff;color:#0068ff;border:1.5px solid #b6dcff}
  .tnTyping{align-self:flex-start;display:flex;gap:4px;padding:10px 12px;background:#fff;border-radius:12px;
    box-shadow:0 2px 6px rgba(15,90,44,.08)}
  .tnTyping span{width:6px;height:6px;border-radius:50%;background:#9db3a6;animation:tnBlink 1.2s infinite}
  .tnTyping span:nth-child(2){animation-delay:.2s}
  .tnTyping span:nth-child(3){animation-delay:.4s}
  @keyframes tnBlink{0%,80%,100%{opacity:.3}40%{opacity:1}}
  @media(max-width:640px){
    .tnChatBtn{right:14px;bottom:76px}
    /* Mobile: chat mở toàn màn hình để bàn phím ảo không đẩy vỡ layout, nút gửi luôn bấm được */
    .tnChatPanel{
      left:0;right:0;top:0;bottom:0;
      width:100%;height:100%;height:100dvh;
      border-radius:0;
    }
    .tnChatHead{padding-top:calc(14px + env(safe-area-inset-top,0px))}
    .tnChatFoot{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
    .tnChatFoot input{font-size:16px}
    body.tnChatOpenMobile{overflow:hidden}
    body.tnChatOpenMobile .floatContact,body.tnChatOpenMobile .floatC{display:none !important}
  }
  `;
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── HTML ── */
  var wrap = document.createElement("div");
  wrap.innerHTML = `
    <button class="tnChatBtn" id="tnChatBtn" aria-label="Chat với Thiện Nga">💬<span class="tnBadge"></span></button>
    <div class="tnChatPanel" id="tnChatPanel" role="dialog" aria-label="Trợ lý tư vấn Thiện Nga">
      <div class="tnChatHead">
        <div class="tnAvatar">TN</div>
        <div class="tnTitle"><b>Trợ lý Thiện Nga</b><span>Thường trả lời ngay</span></div>
        <button id="tnChatClose" aria-label="Đóng">×</button>
      </div>
      <div class="tnChatBody" id="tnChatBody"></div>
      <div class="tnQuick" id="tnChatQuick"></div>
      <div class="tnEscRow">
        <a class="tnCall" href="tel:0965626128">☎ Gọi ngay</a>
        <a class="tnZalo" href="https://zalo.me/0965626128" target="_blank" rel="noopener">💬 Nhắn Zalo</a>
      </div>
      <div class="tnChatFoot">
        <input type="text" id="tnChatInput" placeholder="Nhập câu hỏi của bạn..." autocomplete="off">
        <button id="tnChatSend" aria-label="Gửi">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  /* ── Chuẩn hóa tiếng Việt (không dấu, thường) — cùng quy ước với thuc-don.html ── */
  function normKey(s) {
    return String(s || "").normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase().trim();
  }

  function escH(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Chuyển URL trong text thành link bấm được (Zalo, hotline...) */
  function linkify(text) {
    var safe = escH(text);
    safe = safe.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    safe = safe.replace(/(0\d{9,10})(?![\d])/g, '<a href="tel:$1">$1</a>');
    return safe;
  }

  var FAQ = (typeof CHATBOT_FAQ !== "undefined") ? CHATBOT_FAQ : [];
  var QUICK = (typeof CHATBOT_QUICK_REPLIES !== "undefined") ? CHATBOT_QUICK_REPLIES : [];

  /* Tiền xử lý: token hoá q+variants+tag cho từng FAQ để so khớp nhanh */
  function indexFaq(list) {
    list.forEach(function (item) {
      var bag = [item.q].concat(item.v || []).join(" ") + " " + (item.tag || "").replace(/_/g, " ");
      item._norm = normKey(bag);
    });
    return list;
  }
  indexFaq(FAQ);

  /* ── PARSE CSV (giống thuc-don.html/goc-bep.html) ── */
  function parseCSV(text) {
    var rows = [], i = 0;
    while (i < text.length) {
      var row = [];
      while (i < text.length && text[i] !== "\n") {
        if (text[i] === '"') {
          var cell = ""; i++;
          while (i < text.length) {
            if (text[i] === '"' && text[i + 1] === '"') { cell += '"'; i += 2; }
            else if (text[i] === '"') { i++; break; }
            else { cell += text[i++]; }
          }
          row.push(cell);
        } else {
          var c = "";
          while (i < text.length && text[i] !== "," && text[i] !== "\n") c += text[i++];
          row.push(c.trim());
        }
        if (i < text.length && text[i] === ",") i++;
      }
      if (i < text.length && text[i] === "\n") i++;
      if (row.some(function (c) { return c !== ""; })) rows.push(row);
    }
    return rows;
  }

  /* Cột: STT, Nhom, Cau hoi chinh, Bien the (ngăn bởi ;), Cau tra loi, Tag */
  function buildFaqFromCsv(csvText) {
    var rows = parseCSV(csvText);
    var list = [];
    rows.forEach(function (row) {
      var stt = row[0], cat = (row[1] || "").trim(), q = (row[2] || "").trim();
      var variants = (row[3] || "").split(";").map(function (s) { return s.trim(); }).filter(Boolean);
      var a = (row[4] || "").trim(), tag = (row[5] || "").trim();
      if (!q || !a || isNaN(parseInt(stt))) return; // bỏ dòng tiêu đề / dòng trống
      list.push({ cat: cat, q: q, v: variants, a: a, tag: tag });
    });
    return indexFaq(list);
  }

  /* Tải câu hỏi từ Google Sheet nếu đã cấu hình SHEET_CSV; lỗi thì giữ nguyên danh sách dự phòng */
  function tryLoadFromSheet() {
    var url = SHEET_CSV || (window.localStorage && localStorage.getItem("tn_chatbot_sheet_url")) || "";
    if (!url) return;
    fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    }).then(function (text) {
      var fresh = buildFaqFromCsv(text);
      if (fresh.length) { FAQ = fresh; }
    }).catch(function (err) {
      console.error("Không tải được câu hỏi từ Google Sheet, dùng danh sách dự phòng:", err);
    });
  }
  tryLoadFromSheet();

  var STOPWORDS = normKey("là gì vậy ạ không có được của và cho em anh chị mình bao nhiêu the a").split(" ");

  function tokenize(s) {
    return normKey(s).split(/[^a-z0-9]+/).filter(function (w) {
      return w.length > 1 && STOPWORDS.indexOf(w) === -1;
    });
  }

  function findBestMatch(userText) {
    var tokens = tokenize(userText);
    if (!tokens.length) return null;
    var best = null, bestScore = 0;
    FAQ.forEach(function (item) {
      var score = 0;
      tokens.forEach(function (t) {
        if (item._norm.indexOf(t) !== -1) score++;
      });
      // thưởng điểm nếu khớp nguyên câu hỏi ngắn (chào hỏi, cảm ơn...)
      if (item._norm.indexOf(normKey(userText)) !== -1 && userText.trim().length > 0) score += 2;
      if (score > bestScore) { bestScore = score; best = item; }
    });
    var minScore = Math.max(1, Math.ceil(tokens.length * 0.34));
    return (best && bestScore >= minScore) ? best : null;
  }

  function findByTag(tag) {
    for (var i = 0; i < FAQ.length; i++) if (FAQ[i].tag === tag) return FAQ[i];
    return null;
  }

  /* ── UI helpers ── */
  var body = document.getElementById("tnChatBody");
  var quickWrap = document.getElementById("tnChatQuick");

  function scrollBottom() { body.scrollTop = body.scrollHeight; }

  function addMsg(text, who) {
    var div = document.createElement("div");
    div.className = "tnMsg " + (who === "user" ? "user" : "bot");
    div.innerHTML = who === "user" ? escH(text) : linkify(text);
    body.appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    var t = document.createElement("div");
    t.className = "tnTyping";
    t.id = "tnTypingNow";
    t.innerHTML = "<span></span><span></span><span></span>";
    body.appendChild(t);
    scrollBottom();
  }
  function hideTyping() {
    var t = document.getElementById("tnTypingNow");
    if (t) t.remove();
  }

  function botReply(text, delay) {
    showTyping();
    setTimeout(function () {
      hideTyping();
      addMsg(text, "bot");
    }, delay || 550 + Math.random() * 400);
  }

  function renderQuickReplies() {
    quickWrap.innerHTML = "";
    QUICK.forEach(function (q) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = q.label;
      btn.addEventListener("click", function () {
        var item = findByTag(q.tag);
        addMsg(q.label, "user");
        botReply(item ? item.a : "Dạ để em kiểm tra lại giúp mình ạ.");
      });
      quickWrap.appendChild(btn);
    });
  }

  var greeted = false;
  function isMobile() { return window.matchMedia && window.matchMedia("(max-width:640px)").matches; }
  function openPanel() {
    document.getElementById("tnChatPanel").classList.add("open");
    if (isMobile()) document.body.classList.add("tnChatOpenMobile");
    if (!greeted) {
      greeted = true;
      var greet = findByTag("greeting");
      botReply(greet ? greet.a : "Dạ em chào anh/chị, em là trợ lý tư vấn của Thiện Nga ạ!", 350);
      renderQuickReplies();
    }
  }
  function closePanel() {
    document.getElementById("tnChatPanel").classList.remove("open");
    document.body.classList.remove("tnChatOpenMobile");
  }

  document.getElementById("tnChatBtn").addEventListener("click", function () {
    var panel = document.getElementById("tnChatPanel");
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  document.getElementById("tnChatClose").addEventListener("click", closePanel);

  var input = document.getElementById("tnChatInput");
  var sendBtn = document.getElementById("tnChatSend");

  function handleSend() {
    var text = input.value.trim();
    if (!text) return;
    addMsg(text, "user");
    input.value = "";

    var match = findBestMatch(text);
    if (match) {
      botReply(match.a);
    } else {
      var oos = findByTag("out_of_scope");
      var clarify = findByTag("hoi_lai_lam_ro");
      botReply((clarify ? clarify.a : (oos ? oos.a : "Dạ anh/chị cho em xin thêm thông tin để em tư vấn chính xác hơn ạ.")));
    }
  }

  sendBtn.addEventListener("click", handleSend);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleSend();
  });
})();

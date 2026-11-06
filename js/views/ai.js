import { I } from "../icons.js";
import { caps, chatLog } from "../store.js";
import { esc } from "../utils.js";

export function viewAI() {
  const avail = !!caps.sample;
  return `
  <div class="sec-head"><div><h2>Trò chuyện</h2><p class="sub">Trợ lý đọc dữ liệu của bạn để trả lời</p></div>${chatLog.length ? `<button class="btn ghost sm" data-act="clear-chat">Xóa hội thoại</button>` : ""}</div>
  ${
    avail
? `<div class="quick">${["Phân tích ngay", "Gói nào nên cắt trước?", "Tháng này mình cần chuẩn bị bao nhiêu tiền?", "Có cách nào dùng chung để rẻ hơn không?"].map((q) => `<button class="btn sm" data-act="ask" data-q="${esc(q)}">${esc(q)}</button>`).join("")}</div>
  <div class="chat" id="chat">${chatLog.length ? chatLog.map((m) => `<div class="msg ${m.role === "user" ? "u" : "a"}">${esc(m.content)}</div>`).join("") : `<div class="empty">Hỏi bất cứ điều gì về chi tiêu của bạn, ví dụ “Có nên giữ Canva Pro không?”</div>`}</div>
  <div class="chat-in"><textarea id="chat-text" rows="1" placeholder="Nhập câu hỏi…" aria-label="Câu hỏi cho OptiSub"></textarea><button class="btn primary" data-act="send" aria-label="Gửi">${I.send}</button></div>`
: `<div class="empty">Trợ lý AI đang được hoàn thiện. Nút “Phân tích ngay” ở Tổng quan vẫn phân tích bằng bộ quy tắc của OptiSub.</div>`
  }`;
}

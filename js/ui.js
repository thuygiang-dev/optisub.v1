import { I } from "./icons.js";
import { $, NF, esc, isWide } from "./utils.js";

export const dlg = $("#dlg");

export function openDlg(title, body, foot) {
  dlg.innerHTML = `<div class="dlg-head"><h3 id="dlg-title">${title}</h3><button class="dlg-x" data-act="close" aria-label="Đóng">${I.x}</button></div><div class="dlg-body" tabindex="-1">${body}</div><div class="dlg-foot">${foot}</div>`;
  dlg.setAttribute("aria-labelledby", "dlg-title");
  if (!dlg.open) dlg.showModal();
  const f = dlg.querySelector("input,select,textarea");
  if (f) f.focus();
  else dlg.querySelector(".dlg-body").focus({ preventScroll: true });
}

export const val = (id) => dlg.querySelector("#" + id)?.value ?? "";

export const numv = (id) =>
  Math.max(0, Number(String(val(id)).replace(/\D/g, "")) || 0);

/* Ô nhập tiền: tự thêm dấu chấm phân cách hàng nghìn (59.000 — 1.250.000) */
export const fmtIn = (v) => {
  const n = Number(String(v ?? "").replace(/\D/g, ""));
  return v === "" || v === undefined || v === null || isNaN(n)
    ? ""
    : NF.format(n);
};

let toastT;
const EMOJI =
  /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*/gu;

/* Toast: chạm để tắt, tự ẩn sau `ms`. Emoji đầu câu được thay bằng icon. */
export function toast(msg, ms = 3500) {
  const t = $("#toast");
  /* Hộp thoại mở bằng showModal() nằm ở lớp trên cùng, che mọi thứ bên ngoài:
     đưa toast vào trong hộp thoại để thông báo (vd. lỗi nhập liệu) luôn nhìn thấy */
  const host = dlg.open ? dlg : document.body;
  if (t.parentElement !== host) host.append(t);
  const ok = /^\s*\p{Extended_Pictographic}/u.test(msg);
  const text = msg.replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();
  t.innerHTML = `<span class="toast-ic ${ok ? "ok" : "info"}">${ok ? I.okCircle : I.info}</span><span class="toast-msg">${esc(text)}</span><button class="toast-x" data-act="toast-close" aria-label="Đóng thông báo">${I.x}</button>`;
  t.classList.add("show");
  t.dataset.ms = ms;
  clearTimeout(toastT);
  toastT = setTimeout(hideToast, ms);
}

export function hideToast() {
  clearTimeout(toastT);
  $("#toast").classList.remove("show");
}

dlg.addEventListener("close", () => {
  const t = $("#toast");
  if (t.parentElement === dlg) document.body.append(t);
});

/* Rê chuột lên toast thì dừng đếm giờ để kịp đọc */
$("#toast").addEventListener("mouseenter", () => clearTimeout(toastT));
$("#toast").addEventListener("mouseleave", (e) => {
  if (e.currentTarget.classList.contains("show"))
    toastT = setTimeout(hideToast, 1500);
});

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Đã sao chép 📋");
  } catch (e) {
    const ta = dlg.querySelector("#m-body");
    if (ta) {
      ta.select();
    }
    toast("Đã chọn sẵn nội dung — nhấn Ctrl/⌘+C để sao chép.");
  }
}

/* Cuộn xuống cuối (tin nhắn mới). Màn hình lớn: chỉ khung chat tự cuộn, trang giữ nguyên */
export function scrollToEnd() {
  if (!isWide()) window.scrollTo(0, document.body.scrollHeight);
}

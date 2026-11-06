import { I } from "./icons.js";
import { accounts, current, hideAmt } from "./store.js";
import { openDlg } from "./ui.js";

/* Cài đặt: giao diện sáng/tối, ẩn số tiền, khôi phục dữ liệu, đặt lại ứng dụng */
const THEME_KEY = "optisub.theme";
const THEME_COLOR = { light: "#f0284d", dark: "#111114" };

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "system";
  } catch (e) {
    return "system";
  }
}

export function applyTheme(t) {
  const root = document.documentElement;
  if (t === "light" || t === "dark") root.dataset.theme = t;
  else delete root.dataset.theme;
  /* Màu thanh trạng thái trình duyệt theo giao diện đang dùng */
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    const sys = (m.media || "").includes("dark") ? "dark" : "light";
    m.content = THEME_COLOR[t === "system" ? sys : t];
  });
}

export function setTheme(t) {
  try {
    if (t === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, t);
  } catch (e) {}
  applyTheme(t);
}

export function settingsSheet() {
  const theme = getTheme();
  const opt = (v, icon, label) =>
    `<button class="theme-opt" data-act="set-theme" data-v="${v}" aria-pressed="${theme === v}">${I[icon]}<span>${label}</span></button>`;
  openDlg(
    "Cài đặt",
    `
    <section class="set-group">
      <div class="list-label">Giao diện</div>
      <div class="theme-pick" role="group" aria-label="Giao diện">${opt("system", "system", "Theo máy")}${opt("light", "sun", "Sáng")}${opt("dark", "moon", "Tối")}</div>
    </section>
    <section class="set-group">
      <div class="list-label">Hiển thị</div>
      <button class="set-row" role="switch" aria-checked="${hideAmt}" data-act="set-hide"><span class="set-txt"><b>Ẩn số tiền ở Tổng quan</b><small>Che số tiền khi dùng app ở nơi đông người</small></span><span class="switch" aria-hidden="true"></span></button>
    </section>
    <section class="set-group">
      <div class="list-label">Dữ liệu</div>
      <div class="menu">
        ${current ? `<button data-act="reset-data">${I.reset} Khôi phục dữ liệu ban đầu</button>` : ""}
        <button class="danger" data-act="factory-reset">${I.trash} Đặt lại ứng dụng (cài đặt gốc)</button>
      </div>
      <p class="hint m-0">Dữ liệu của mọi tài khoản được lưu trên trình duyệt của thiết bị này.</p>
    </section>
  `,
    `<button class="btn primary" data-act="close">Xong</button>`,
  );
}

export function factoryResetConfirm() {
  openDlg(
    "Đặt lại ứng dụng?",
    `<div class="warn-box">${I.alert}<span>Toàn bộ dữ liệu trên thiết bị này sẽ bị xóa: gói đăng ký, học phí, khoản chia, sổ nợ, tin nhắn của cả ${accounts.length} tài khoản và mọi cài đặt. Thao tác này không thể hoàn tác.</span></div>`,
    `<button class="btn" data-act="settings">Quay lại</button><button class="btn danger solid" data-act="factory-reset-go">Đặt lại ứng dụng</button>`,
  );
}

/* Xóa mọi khóa của OptiSub rồi tải lại trang về màn chọn tài khoản */
export function factoryReset() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      Object.keys(store)
        .filter((k) => k.startsWith("optisub."))
        .forEach((k) => store.removeItem(k));
    } catch (e) {}
  }
  try {
    sessionStorage.setItem("optisub.justReset", "1");
  } catch (e) {}
  location.reload();
}

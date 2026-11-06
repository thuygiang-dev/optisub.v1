import { chatPeer, current, sub, tab } from "./store.js";

/* Định tuyến bằng đường dẫn thật: mỗi màn một URL (app/goi/, app/lich/…).
   Mỗi đường dẫn là một thư mục có sẵn index.html (tạo bởi scripts/build-pages.py)
   nên tải lại trang hay mở link trực tiếp đều vào đúng màn — kể cả trên GitHub Pages. */

/* Thư mục gốc của site (nơi có trang giới thiệu) và của ứng dụng */
export const ROOT = new URL("../", import.meta.url);
export const APP = new URL("app/", ROOT);

const TAB_PATH = {
  overview: "tong-quan",
  subs: "goi",
  calendar: "lich",
  chat: "ban-be",
};
const SUB_PATH = {
  tuition: "sinh-vien/hoc-phi",
  bills: "sinh-vien/chia-tien",
  debts: "sinh-vien/muon-tra",
};
const TITLE = {
  overview: "Tổng quan",
  subs: "Gói đăng ký",
  calendar: "Lịch thanh toán",
  chat: "Bạn bè",
  ai: "Hỏi OptiSub",
  tuition: "Học phí",
  bills: "Khoản dùng chung",
  debts: "Mượn & Trả",
};

/* URL → màn: { picker } hoặc { tab, sub?, peer? } */
export function parseRoute(href = location.href) {
  const u = new URL(href);
  if (!u.pathname.startsWith(APP.pathname)) return { picker: true };
  const rel = u.pathname
    .slice(APP.pathname.length)
    .replace(/index\.html$/, "")
    .replace(/\/+$/, "");
  if (!rel) return { picker: true };
  const t = Object.keys(TAB_PATH).find((k) => TAB_PATH[k] === rel);
  if (t) return { tab: t, peer: t === "chat" ? u.searchParams.get("u") : null };
  const s = Object.keys(SUB_PATH).find((k) => SUB_PATH[k] === rel);
  if (s || rel === "sinh-vien") return { tab: "student", sub: s || "tuition" };
  return { tab: "overview" };
}

/* Màn hiện tại → URL */
export function currentUrl() {
  if (!current) return APP.href;
  const path =
    tab === "student" ? SUB_PATH[sub] : TAB_PATH[tab] || TAB_PATH.overview;
  const u = new URL(path + "/", APP);
  if (tab === "chat" && chatPeer) u.searchParams.set("u", chatPeer);
  return u.href;
}

/* Lần vẽ kế tiếp thay URL hiện tại thay vì thêm mục lịch sử (khi mở trang, khi bấm Back) */
let replaceNext = true;
export const replaceUrlNext = () => (replaceNext = true);

/* Gọi sau mỗi lần vẽ: thanh địa chỉ và tiêu đề tab khớp với màn đang hiển thị */
export function syncUrl() {
  const want = currentUrl();
  if (want !== location.href)
    history[replaceNext ? "replaceState" : "pushState"](null, "", want);
  replaceNext = false;
  const name = current ? TITLE[tab === "student" ? sub : tab] : "Chọn tài khoản";
  document.title = `${name} · OptiSub`;
}

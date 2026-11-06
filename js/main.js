import { AI_ENDPOINT, aiSample } from "./ai.js";
import { browserDownloads } from "./ics.js";
import { render } from "./render.js";
import { parseRoute, replaceUrlNext } from "./router.js";
import { applyTheme, getTheme } from "./settings.js";
import { refreshFromStore } from "./social.js";
import { caps, current, enterAccount, liveAccounts, logout, readSession, setChatPeer, setSub, setTab, tab } from "./store.js";
import { dlg, toast } from "./ui.js";
import { WIDE_QUERY } from "./utils.js";
import "./actions.js";

/* Đổi URL bằng pushState làm trình duyệt tính lại đường dẫn tương đối của favicon/manifest:
   chốt chúng thành đường dẫn tuyệt đối ngay từ đầu */
document
  .querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
  .forEach((l) => l.setAttribute("href", l.href));

applyTheme(getTheme());
caps.downloads = browserDownloads;
if (AI_ENDPOINT) caps.sample = aiSample;

setInterval(() => {
  if (current && tab === "chat" && !document.hidden) refreshFromStore();
}, 12000);

/* Đổi giữa giao diện điện thoại và màn hình lớn thì vẽ lại (vd. chat 1 cột ↔ 2 cột) */
matchMedia(WIDE_QUERY).addEventListener("change", () => {
  if (current) render();
});

/* Mở trang: vào đúng màn theo URL. Màn chọn tài khoản (app/) luôn hiện danh sách tài khoản;
   các màn khác dùng tài khoản đã nhớ, chưa có thì quay về màn chọn. */
function openRoute(r) {
  const ses = readSession();
  const acc = !r.picker && ses && liveAccounts().find((a) => a.id === ses.accountId);
  if (acc) enterAccount(acc, r);
  else render();
}

/* Nút Back/Forward của trình duyệt */
addEventListener("popstate", () => {
  const r = parseRoute();
  replaceUrlNext();
  if (r.picker) {
    if (current) logout({ quiet: true });
    else render();
    return;
  }
  if (!current) return openRoute(r);
  if (dlg.open) dlg.close();
  setTab(r.tab);
  if (r.sub) setSub(r.sub);
  setChatPeer(r.peer || null);
  render();
  window.scrollTo(0, 0);
});

replaceUrlNext();
openRoute(parseRoute());

/* Vừa đặt lại ứng dụng (trang đã tải lại): báo cho người dùng */
try {
  if (sessionStorage.getItem("optisub.justReset")) {
    sessionStorage.removeItem("optisub.justReset");
    toast("✅ Đã đặt lại ứng dụng về cài đặt gốc.");
  }
} catch (e) {}

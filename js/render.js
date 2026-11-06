import { NAV, PAGE } from "./content.js";
import { alertsList, chatUnreadTotal, savings, subStatus } from "./domain.js";
import { DECO, I, LOGO } from "./icons.js";
import { hidePush } from "./notify.js";
import { ROOT, syncUrl } from "./router.js";
import { refreshFromStore } from "./social.js";
import { chatPeer, current, liveAccounts, setChatPeer, setSub, setTab, state, sub, tab } from "./store.js";
import { $, esc, initials, isWide, money } from "./utils.js";
import { viewAI } from "./views/ai.js";
import { viewCalendar } from "./views/calendar.js";
import { viewChat } from "./views/chat.js";
import { viewOverview } from "./views/overview.js";
import { viewBills, viewDebts, viewTuition } from "./views/student.js";
import { viewSubs } from "./views/subs.js";

export function renderHeader() {
  const hdr = $("#hdr");
  const left =
    tab === "overview"
      ? `<h1 class="hdr-title">${esc(current?.displayName || "Xin chào bạn")}</h1>${(() => {
          const sv = savings();
          return `<button class="badge" data-act="savings"><span class="em">${I.piggy}</span>${sv.total > 0 ? `Đã tiết kiệm ${money(sv.total)}/tháng${sv.pct ? ` · −${sv.pct}%` : ""}` : "Chưa có khoản tiết kiệm"}${I.chev}</button>`;
        })()}`
      : `<h1 class="hdr-title page">${PAGE[tab][0]}</h1><p class="hdr-sub">${PAGE[tab][1]}</p>`;
  const strip =
    tab === "student"
      ? `<div class="strip" role="tablist">${[
          ["tuition", "Học phí", "cap"],
          ["bills", "Khoản dùng chung", "split"],
          ["debts", "Mượn &amp; Trả", "cash"],
        ]
          .map(
            ([k, l, ic]) =>
              `<button role="tab" aria-selected="${sub === k}" data-act="sub" data-s="${k}">${I[ic]}${l}</button>`,
          )
          .join("")}</div>`
      : "";
  hdr.className = "hdr" + (strip ? " has-strip" : "");
  const nN = alertsList().filter((a) => !a.quiet).length;
  hdr.innerHTML =
    DECO +
    `<div class="hdr-inner"><div>${left}</div><div class="hdr-actions"><button class="round av-btn" data-act="account" aria-label="Tài khoản">${esc(initials(current?.displayName))}</button><button class="round" data-act="notifs" aria-label="Thông báo${nN ? `, ${nN} mới` : ""}">${I.bell}${nN ? `<span class="dot">${nN}</span>` : ""}</button></div></div>` +
    strip;
}

export function renderNav() {
  const nAlerts = alertsList().filter((a) => !a.quiet).length;
  const nKill = state.subs.filter((s) => subStatus(s) === "kill").length;
  $("#nav").innerHTML =
    `<a class="nav-brand" href="${ROOT.href}" title="Trang giới thiệu OptiSub"><span class="nav-logo">${LOGO}</span>OptiSub</a>` +
    NAV.map(([k, l, ic]) => {
    const n =
      k === "calendar"
        ? nAlerts
        : k === "subs"
          ? nKill
          : k === "chat"
            ? chatUnreadTotal()
            : 0;
    return `<button data-tab="${k}" ${tab === k ? 'aria-current="page"' : ""}><span class="ni">${I[ic]}${n ? `<span class="dot">${n}</span>` : ""}</span><span class="nl">${l}</span></button>`;
    }).join("") +
    `<button class="nav-settings" data-act="settings"><span class="ni">${I.settings}</span><span class="nl">Cài đặt</span></button>`;
}

export function goTab(t) {
  hidePush();
  if (["tuition", "bills", "debts"].includes(t)) {
    setSub(t);
    setTab("student");
  } else setTab(t);
  if (tab !== "chat") setChatPeer(null);
  render();
  window.scrollTo(0, 0);
  if (tab === "chat") refreshFromStore();
}

/* Chạy hiệu ứng vào trang khi đổi màn (tab, mục con, cuộc chat, tài khoản) */
let lastView = "";
function animateView(key) {
  if (key === lastView) return;
  lastView = key;
  const v = $("#view");
  v.classList.remove("view-in");
  void v.offsetWidth;
  v.classList.add("view-in");
}

export function render() {
  document.body.classList.toggle("auth", !current);
  if (!current) {
    renderAuth();
    animateView("auth");
    syncUrl();
    return;
  }
  renderHeader();
  renderNav();
  const v = $("#view");
  v.innerHTML = {
    overview: viewOverview,
    subs: viewSubs,
    calendar: viewCalendar,
    student: viewStudent,
    ai: viewAI,
    chat: viewChat,
  }[tab]();
  animateView(
    [current.id, tab, tab === "student" ? sub : "", chatPeer || ""].join(":"),
  );
  syncUrl();
  if (tab === "chat" && chatPeer) {
    const t = $("#thread");
    if (t && isWide()) t.scrollTop = t.scrollHeight;
    else if (t) t.lastElementChild?.scrollIntoView({ block: "end" });
  }
}

export function viewStudent() {
  return { tuition: viewTuition, bills: viewBills, debts: viewDebts }[
    sub
  ]();
}

/* Màn chọn tài khoản khi chưa đăng nhập */
export function renderAuth() {
  const hdr = $("#hdr");
  hdr.className = "hdr auth-hdr";
  hdr.innerHTML =
    DECO +
    `<div class="hdr-inner"><div class="logo">${LOGO}</div><h1 class="auth-title">OptiSub</h1><p class="auth-sub">Bịt lỗ rò rỉ tiền, sống khỏe ví sinh viên</p></div>`;
  $("#nav").innerHTML = "";
  $("#view").innerHTML = `
  <section class="auth-card" aria-labelledby="pick-title">
    <h2 id="pick-title" class="auth-card-title">Đăng nhập với tư cách…</h2>
    <p class="sub">Chọn tài khoản để tiếp tục</p>
    <div class="dev-list">${liveAccounts()
      .map(
        (a) =>
          `<button class="dev" data-act="switch-acc" data-u="${esc(a.id)}"><span class="av">${esc(initials(a.displayName))}</span><span class="dev-txt"><span class="who">${esc(a.displayName)}</span><span class="u">@${esc(a.username)}</span></span>${I.chev}</button>`,
      )
      .join("")}</div>
  </section>
  <p class="auth-foot">Mỗi tài khoản có dữ liệu riêng, được lưu ngay trên thiết bị này.</p>
  <div class="auth-links"><button class="link" data-act="settings">${I.settings} Cài đặt</button><a class="link" href="${ROOT.href}">${I.info} Giới thiệu OptiSub</a></div>`;
}

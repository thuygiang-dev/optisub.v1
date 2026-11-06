import { alertsList } from "./domain.js";
import { I, LOGO } from "./icons.js";
import { current } from "./store.js";
import { $, esc, iso, today, whenText } from "./utils.js";

export let pushT;

export function hidePush() {
  const p = $("#push");
  if (p) p.classList.remove("show");
  clearTimeout(pushT);
}

export function showPush() {
  if (!current) return;
  const list = alertsList().filter((a) => !a.quiet);
  if (!list.length) return;
  const key = "optisub.pushed." + current.id + "." + iso(today());
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch (e) {}
  const a = list[0];
  $("#push").innerHTML =
    `<button class="push-main" data-act="notifs"><span class="pi">${LOGO.replace(/var\(--brand\)/g, "#fff")}</span><span class="push-body"><span class="pm"><span>OptiSub</span><span>bây giờ</span></span><div class="pt">${esc(a.title)}${a.n !== undefined ? ` — ${whenText(a.n)}` : ""}</div><div class="pb">${esc(a.desc)}${list.length > 1 ? ` · và ${list.length - 1} thông báo khác` : ""}</div></span></button><button class="push-x" data-act="push-close" aria-label="Đóng thông báo">${I.x}</button>`;
  requestAnimationFrame(() => $("#push").classList.add("show"));
  clearTimeout(pushT);
  pushT = setTimeout(hidePush, 7000);
}

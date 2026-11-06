import { ACCOUNTS } from "./content.js";
import { rollForward } from "./domain.js";
import { hidePush, showPush } from "./notify.js";
import { render } from "./render.js";
import { seedState } from "./seed.js";
import { loadPeers } from "./social.js";
import { dlg, toast } from "./ui.js";
import { readJSON, writeJSON } from "./utils.js";

// Trạng thái dùng chung của app. Module khác chỉ đọc các biến export (live binding)
// và gọi hàm set…() khi cần gán lại.

export const emptyState = () => ({
  v: 1,
  updatedAt: 0,
  subs: [],
  tuition: [],
  bills: [],
  debts: [],
  savedFromCancels: 0,
  cancelled: [],
  seenWelcome: false,
});

export let state = emptyState();
export const accounts = ACCOUNTS.map((a) => ({ ...a }));
export let current = null;
export let tab = "overview";
export let sub = "tuition";
export let ovSeg = "alerts";
export let hideAmt = (() => {
  try {
    return localStorage.getItem("optisub.hide") === "1";
  } catch (e) {
    return false;
  }
})();
export let chatLog = [];
export let analysis = null; // {text, src}
export let peers = {};
export let smartIdx = 0;
export let chatPeer = null;
/* Tính năng tuỳ môi trường: sample = gọi AI, downloads = lưu tệp */
export const caps = { sample: null, downloads: null };

export const setState = (v) => (state = v);
export const setCurrent = (v) => (current = v);
export const setTab = (v) => (tab = v);
export const setSub = (v) => (sub = v);
export const setOvSeg = (v) => (ovSeg = v);
export const setHideAmt = (v) => (hideAmt = v);
export const setChatLog = (v) => (chatLog = v);
export const setAnalysis = (v) => (analysis = v);
export const setPeers = (v) => (peers = v);
export const setSmartIdx = (v) => (smartIdx = v);
export const setChatPeer = (v) => (chatPeer = v);

export const liveAccounts = () => accounts.filter((a) => !a.deleted);
const keyOf = (acc) => "optisub.v1." + acc.id;
export const stateKey = () => keyOf(current);

export function saveLocal() {
  if (!current) return;
  writeJSON(localStorage, stateKey(), state);
}

export function commit(rerender = true) {
  if (!current) return;
  state.updatedAt = Date.now();
  saveLocal();
  if (rerender) render();
}

export async function loadState(acc) {
  const st = readJSON(localStorage, keyOf(acc));
  return st && st.v
    ? Object.assign(emptyState(), st)
    : Object.assign(seedState(acc.kind), { updatedAt: 1 });
}

export async function saveState(acc, st) {
  st.updatedAt = Date.now();
  writeJSON(localStorage, keyOf(acc), st);
}

/* Nhớ tài khoản đang dùng để tải lại trang (hoặc mở link một màn) không bị đẩy về màn chọn tài khoản */
const SES_KEY = "optisub.session";
export const readSession = () => readJSON(localStorage, SES_KEY);
const saveSession = (acc) => writeJSON(localStorage, SES_KEY, { accountId: acc.id });
function clearSession() {
  try {
    localStorage.removeItem(SES_KEY);
  } catch (e) {}
}

/* route (không bắt buộc): màn mở ra ngay, vd. { tab: "subs" } khi vào thẳng app/goi/ */
export async function enterAccount(acc, route = {}) {
  current = acc;
  tab = route.tab || "overview";
  if (route.sub) sub = route.sub;
  chatPeer = route.peer || null;
  saveSession(acc);
  chatLog = [];
  analysis = null;
  const local = readJSON(localStorage, stateKey());
  state =
    local && local.v
      ? Object.assign(emptyState(), local)
      : Object.assign(seedState(acc.kind), { updatedAt: 1 });
  if (!local) saveLocal();
  rollForward();
  render();
  window.scrollTo(0, 0);
  setTimeout(showPush, 900);
  peers = {};
  smartIdx = 0;
  loadPeers();
}

export function logout({ quiet = false } = {}) {
  clearSession();
  hidePush();
  current = null;
  chatPeer = null;
  state = emptyState();
  chatLog = [];
  analysis = null;
  if (dlg.open) dlg.close();
  render();
  window.scrollTo(0, 0);
  if (!quiet) toast("👋 Đã đăng xuất. Hẹn gặp lại!");
}

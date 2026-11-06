export const $ = (s, r = document) => r.querySelector(s);

export const NF = new Intl.NumberFormat("vi-VN");

/* Khoảng trắng không ngắt dòng để "260.000 ₫" luôn nằm trên một dòng */
export const money = (n) => NF.format(Math.round(n || 0)) + "\u00a0₫";

export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

export const uid = () => Math.random().toString(36).slice(2, 10);

export const pad = (n) => String(n).padStart(2, "0");

export const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseD = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const addMonths = (d, n) => {
  const x = new Date(d);
  const day = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(day, last));
  return x;
};

export const daysUntil = (s) => {
  const d = parseD(s);
  return d ? Math.round((d - today()) / 864e5) : null;
};

export const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const monthKey = (back) =>
  ym(
    addMonths(
      new Date(today().getFullYear(), today().getMonth(), 1),
      -back,
    ),
  );

export const fmtDate = (s) => {
  const d = parseD(s);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : "—";
};

export const weekday = (s) =>
  ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][parseD(s).getDay()];

export const whenText = (n) =>
  n === 0
    ? "hôm nay"
    : n === 1
      ? "ngày mai"
      : n > 1
        ? `còn ${n} ngày`
        : `quá ${-n} ngày`;

export const readJSON = (store, k) => {
  try {
    return JSON.parse(store.getItem(k));
  } catch (e) {
    return null;
  }
};

export const writeJSON = (store, k, v) => {
  try {
    store.setItem(k, JSON.stringify(v));
  } catch (e) {}
};

export function timeTxt(t) {
  const d = new Date(t);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function initials(n) {
  const w = String(n || "?")
    .trim()
    .split(/\s+/);
  return (
    (w.length > 1 ? w[w.length - 1][0] : w[0][0]) || "?"
  ).toUpperCase();
}

export const normUser = (u) =>
  String(u || "")
    .trim()
    .toLowerCase();

/* Màn hình lớn (desktop): thanh điều hướng dọc, bố cục nhiều cột */
export const WIDE_QUERY = "(min-width: 1100px)";
export const isWide = () => matchMedia(WIDE_QUERY).matches;

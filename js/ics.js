import { events } from "./domain.js";
import { state } from "./store.js";
import { addDays, iso, money, parseD } from "./utils.js";

export function buildICS() {
  const stamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const escI = (s) =>
    String(s)
      .replace(/[,;\\]/g, (m) => "\\" + m)
      .replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OptiSub//VI",
    "CALSCALE:GREGORIAN",
  ];
  for (const e of events(370)) {
    if (e.n < 0) continue;
    const d = e.date.replace(/-/g, "");
    const end = iso(addDays(parseD(e.date), 1)).replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.kind}-${e.ref}-${d}@optisub`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escI(e.title + " — " + money(e.amount))}`,
      `DESCRIPTION:${escI(e.desc)}`,
      ...(() => {
        const s = state.subs.find((x) => x.id === e.ref);
        const r = s ? (s.remind ?? 3) : 3;
        return r > 0
          ? [
              "BEGIN:VALARM",
              "ACTION:DISPLAY",
              `DESCRIPTION:${escI("Còn " + r + " ngày: " + e.title)}`,
              `TRIGGER:-P${r}D`,
              "END:VALARM",
            ]
          : [];
      })(),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escI("Ngày mai: " + e.title)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/* Lưu tệp bằng cơ chế tải xuống của trình duyệt (dùng cho caps.downloads) */
export const browserDownloads = {
  async save({ filename, data }) {
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/calendar;charset=utf-8" }),
    );
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: filename,
    });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

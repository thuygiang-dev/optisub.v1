import { alertsList, events } from "../domain.js";
import { I } from "../icons.js";
import { caps } from "../store.js";
import { esc, money, parseD, weekday, whenText } from "../utils.js";
import { alertHTML } from "./shared.js";

export function viewCalendar() {
  const ev = events(35);
  const alerts = alertsList();
  return `<div class="cal-grid"><section class="cal-alerts">
  <div class="sec-head"><h2>Cảnh báo</h2>${caps.downloads ? `<button class="btn soft sm" data-act="ics">${I.bell} Nhắc trên điện thoại</button>` : ""}</div>
  ${alerts.length ? `<div class="alerts">${alerts.map(alertHTML).join("")}</div>` : `<div class="empty">Không có khoản nào cần chú ý trong 3 ngày tới.</div>`}
  </section><section class="cal-list">
  <div class="sec-head"><div><h2>Lịch thanh toán 5 tuần tới</h2></div></div>
  ${
    ev.length
? `<div class="cal">${ev
    .map(
      (
        e,
      ) => `<div class="cal-row ${e.n < 0 ? "late" : e.n <= 3 ? "soon" : ""}">
    <div class="cal-date num">${parseD(e.date).getDate()}<small>Th${parseD(e.date).getMonth() + 1}</small></div>
    <div><div class="cal-main"><div class="cal-title"><span class="cal-ic ${e.kind}">${I[e.icon]}</span>${esc(e.title)}</div><div class="cal-amt num">${money(e.amount)}</div></div><div class="sub cal-desc">${weekday(e.date)} · ${whenText(e.n)} · ${esc(e.desc)}</div></div></div>`,
    )
    .join("")}</div>`
: `<div class="empty">Lịch trống. Thêm gói đăng ký, hóa đơn hoặc học phí để thấy các mốc thanh toán.</div>`
  }
  ${caps.downloads ? `<p class="sub cal-note">Tệp lịch (.ics) chứa nhắc nhở trước 3 ngày và 1 ngày cho từng mốc — mở bằng Google Calendar hoặc Lịch iPhone để nhận thông báo ngay cả khi không mở OptiSub.</p>` : ""}</section></div>`;
}

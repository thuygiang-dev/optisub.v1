import { MINDSET } from "../content.js";
import { myMonthly, subStatus } from "../domain.js";
import { I } from "../icons.js";
import { state } from "../store.js";
import { esc, fmtDate, money } from "../utils.js";
import { subHTML } from "./shared.js";

export function viewSubs() {
  const subs = [...state.subs].sort((a, b) => {
    const o = { kill: 0, trial: 1, warn: 2, unknown: 3, ok: 4 };
    return (
      o[subStatus(a)] - o[subStatus(b)] || myMonthly(b) - myMonthly(a)
    );
  });
  const kills = subs.filter((s) => subStatus(s) === "kill");
  return `
  <div class="sec-head"><div><h2>Tất cả gói</h2><p class="sub">Chọn mức dùng tháng này — mỗi gói chỉ cần 1 chạm/tháng</p></div><button class="btn primary sm" data-act="add-sub">${I.plus} Thêm gói</button></div>
  ${
    kills.length
? `<div class="kill-zone"><h3 class="h-ic">${I.scissors}Nên cân nhắc cắt (${kills.length})</h3>
    <p class="sub kill-sub">Không sử dụng 3 tháng liên tiếp — tổng ${money(kills.reduce((a, s) => a + myMonthly(s), 0))}/tháng đang chảy đi mà không đổi lại gì.</p>
    ${kills.map((s) => `<div class="kill-card"><div><div class="n">${esc(s.name)}</div><div class="m">${money(myMonthly(s))}/tháng · gia hạn ${s.nextBill ? fmtDate(s.nextBill) : "—"}</div></div><button class="btn primary sm" data-act="cancel" data-id="${s.id}">${I.scissors} Xem cách hủy</button></div>`).join("")}
    <p class="mind">${I.bulb}<span>${MINDSET[0]}</span></p></div>`
: ""
  }
  <div class="list${kills.length ? " mt-md" : ""}">
    ${subs.length ? subs.map(subHTML).join("") : `<div class="empty">Chưa có gói nào. Thêm Netflix, Spotify, ChatGPT Plus, Canva… để bắt đầu theo dõi.</div>`}
  </div>`;
}

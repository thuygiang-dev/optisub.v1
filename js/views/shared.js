import { FREQ } from "../content.js";
import { cpu, subStatus, tipFor, uses3 } from "../domain.js";
import { I } from "../icons.js";
import { liveAccounts, state } from "../store.js";
import { daysUntil, esc, fmtDate, money, whenText } from "../utils.js";

export function syncHTML() {
  return `<p class="sync" id="sync"><i></i><span>Dữ liệu được lưu trên thiết bị này</span></p>`;
}

export function alertHTML(a) {
  let act = "";
  if (a.kind === "invite")
    act = `<div class="act act-stack"><button class="btn sm primary" data-act="invite-accept" data-id="${a.ref}">Đồng ý ghép</button><button class="btn sm" data-act="invite-decline" data-id="${a.ref}">Từ chối</button></div>`;
  else if (a.kind === "msg")
    act = `<div class="act act-stack">${a.amount ? `<button class="btn sm primary" data-act="msg-debt" data-id="${a.ref}">Ghi cần trả</button>` : ""}<button class="btn sm" data-act="chat-open" data-u="${a.from}">Mở chat</button></div>`;
  else if (a.kind === "todo")
    act = `<button class="btn sm act primary" data-act="cancel" data-id="${a.ref}">Xem cách hủy</button>`;
  else if (
    a.kind === "trial" ||
    a.kind === "trial-ended" ||
    (a.kind === "renew" &&
      state.subs.find((s) => s.id === a.ref && subStatus(s) === "kill"))
  )
    act = `<button class="btn sm act" data-act="cancel" data-id="${a.ref}">Hủy ngay</button>`;
  else if (a.kind === "bill")
    act = `<button class="btn sm act" data-act="pay-bill" data-id="${a.ref}">Đã trả</button>`;
  else if (a.kind === "tuition")
    act = `<button class="btn sm act" data-act="go" data-tab="tuition">Xem kế hoạch</button>`;
  else if (a.kind === "price")
    act = `<button class="btn sm act" data-act="edit-sub" data-id="${a.ref}">Xem lại</button>`;
  /* Thông báo có 2 nút (lời mời, tin nhắn): đặt nút thành hàng dưới nội dung để chữ không bị ép */
  const stack = a.kind === "invite" || a.kind === "msg";
  return `<div class="alert${stack ? " stack" : ""}" style="--c:${a.c}"><span class="ic">${I[a.icon] || ""}</span><div><div class="t">${esc(a.title)}${a.n !== undefined ? ` <span class="chip ${a.n < 0 ? "kill" : "warn"}">${whenText(a.n)}</span>` : ""}</div><div class="d">${esc(a.desc)}</div></div>${act}</div>`;
}

export function subHTML(s) {
  const st = subStatus(s);
  const c = cpu(s);
  const u = uses3(s);
  const lvl =
    typeof u[0] === "number"
      ? FREQ.map((f) => f[0]).reduce(
          (b, v) => (Math.abs(v - u[0]) < Math.abs(b - u[0]) ? v : b),
          0,
        )
      : null;
  const maxU = Math.max(1, ...u.filter((x) => typeof x === "number"));
  const tip = tipFor(s);
  const nextTxt = s.trialEnd
    ? `Hết dùng thử ${fmtDate(s.trialEnd)} (${whenText(daysUntil(s.trialEnd))})`
    : s.nextBill
      ? `Gia hạn ${fmtDate(s.nextBill)} (${whenText(daysUntil(s.nextBill))})`
      : "Chưa có ngày gia hạn";
  const CORNER = {
    ok: "Đáng tiền",
    warn: "Cân nhắc",
    kill: "Nên cắt",
    trial: "Dùng thử",
    unknown: "Chưa đo",
  };
  return `<div class="item has-corner">
    <span class="corner ${st}">${CORNER[st]}</span>
    <div>
<div class="item-name">${esc(s.name)}${s.price > s.prevPrice && s.prevPrice ? `<span class="chip warn">${I.trend} vừa tăng giá</span>` : ""}</div>
<div class="item-meta">${nextTxt}${s.sharedBy ? ` · chia sẻ bởi ${esc(s.sharedBy)}` : ""}${(s.shareWith || []).length || (s.guests || []).length ? ` · dùng chung với ${[...(s.shareWith || []).map((u) => esc((liveAccounts().find((a) => a.username === u)?.displayName || u).split(" ").slice(-1)[0])), ...(s.guests || []).map(esc)].join(", ")}` : (s.payers || 1) > 1 ? ` · chia ${s.payers} người trả` : ""}</div>
    </div>
    <div class="item-right">
<div class="item-price num">${money(s.price)}<span class="item-cpu">/${s.cycle === "year" ? "năm" : "tháng"}</span></div>
<div class="item-cpu num">${c === null ? "Chưa đo chi phí/lần" : c === Infinity ? "Không dùng lần nào" : `≈ ${money(c)} / lần dùng`}</div>
    </div>
    <div class="item-foot">
<div class="freq" role="group" aria-label="Mức dùng tháng này">${FREQ.map(([v, l]) => `<button data-act="freq" data-id="${s.id}" data-v="${v}" aria-pressed="${lvl === v}">${l}</button>`).join("")}</div>
<div class="spark" title="3 tháng gần nhất (cũ → mới)">${[...u]
  .reverse()
  .map(
    (x) =>
      `<i class="${typeof x === "number" && x > 0 ? "has" : ""}" style="height:${typeof x === "number" ? Math.max(3, (x / maxU) * 22) : 3}px"></i>`,
  )
  .join("")}</div>
<span class="spacer"></span>
<button class="btn icon ghost" data-act="edit-sub" data-id="${s.id}" aria-label="Sửa" title="Sửa">${I.pen}</button>
<button class="btn sm ${st === "kill" ? "danger" : ""}" data-act="cancel" data-id="${s.id}">Hủy gói</button>
    </div>
    ${tip ? `<div class="tip">${I.bulb}<span>${esc(tip)}</span></div>` : ""}
  </div>`;
}

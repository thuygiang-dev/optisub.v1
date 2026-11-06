import { FAMILY_SVC, STATUS } from "../content.js";
import { alertsList, myMonthly, smartMatches, subStatus, tuitionPlan } from "../domain.js";
import { I } from "../icons.js";
import { analysis, caps, current, hideAmt, ovSeg, smartIdx, state } from "../store.js";
import { esc, initials, money } from "../utils.js";
import { alertHTML, subHTML, syncHTML } from "./shared.js";

export function smartCardHTML() {
  const list = smartMatches();
  if (!list.length) return "";
  const m = list[smartIdx % list.length];
  const s = m.s;
  const names = m.friends.map((f) =>
    esc(f.acc.displayName.split(" ").slice(-1)[0]),
  );
  const msg = m.friends.length
    ? `Bạn và ${m.friends.length} người dùng OptiSub khác (${names.join(", ")}) đang trả riêng gói ${esc(s.name)} cá nhân. Ghép thành gói nhóm để giảm ${m.pct}% chi phí!`
    : `Bạn đang trả riêng ${esc(s.name)}. Rủ thêm 3 người dùng OptiSub ghép thành ${esc(FAMILY_SVC[m.k])} để giảm ${m.pct}% chi phí!`;
  const avs =
    [
      `<span class="av">${esc(initials(current.displayName))}</span>`,
      ...m.friends
        .slice(0, 4)
        .map(
          (f) =>
            `<span class="av">${esc(initials(f.acc.displayName))}</span>`,
        ),
    ].join("") +
    (m.friends.length
      ? ""
      : `<span class="av ghost">+</span><span class="av ghost">+</span><span class="av ghost">+</span>`);
  const sent = s.invited || [];
  return `<section class="smart" aria-label="Gợi ý ghép nhóm">
    <div class="smart-top"><span class="tag2">${I.handshake}Gợi ý ghép nhóm</span>${list.length > 1 ? `<span class="cnt">${(smartIdx % list.length) + 1}/${list.length}</span>` : ""}</div>
    <p class="smart-msg">${msg}</p>
    <div class="avs">${avs}<span class="more">${m.n} người · ${esc(s.name)}</span></div>
    <div class="cmp"><span class="pct">−${m.pct}%</span>
<div><small>Gói cá nhân</small><s class="num">${money(m.P)}/tháng</s></div>
<span class="arr" aria-hidden="true">${I.arrow}</span>
<div><small>Giá ghép nhóm</small><b class="num">${money(m.per)}</b><small>/người/tháng</small></div>
    </div>
    ${sent.length ? `<div class="sent">${I.send}<span>Đã gửi lời mời tới ${sent.map((u) => "@" + esc(u)).join(", ")} · đang chờ phản hồi</span></div>` : ""}
    <div class="row">
<button class="btn cta" data-act="${m.friends.length ? "smart-invite" : "smart-find"}" data-id="${s.id}">${m.friends.length ? (sent.length ? `${I.send} Gửi lại lời mời` : `${I.send} Gửi lời mời`) : `${I.search} Tìm bạn ghép nhóm`}</button>
${m.friends.length ? `<button class="btn ghost2" data-act="smart-find" data-id="${s.id}">Tìm thêm bạn</button>` : ""}
    </div>
    <p class="fine">Ước tính chia đều giá gói hiện tại cho ${m.n} người; giá gói nhóm thực tế có thể khác.${m.k === "netflix" ? " Netflix chỉ cho dùng chung trong cùng hộ gia đình." : ""}</p>
    ${list.length > 1 ? `<button class="nxt" data-act="smart-next">Gợi ý tiếp theo ›</button>` : ""}
  </section>`;
}

export function viewOverview() {
  const subs = [...state.subs].sort(
    (a, b) => myMonthly(b) - myMonthly(a),
  );
  const total = subs.reduce((a, s) => a + myMonthly(s), 0);
  const leak = subs
    .filter((s) => ["kill", "warn"].includes(subStatus(s)))
    .reduce((a, s) => a + myMonthly(s), 0);
  const killAmt = subs
    .filter((s) => subStatus(s) === "kill")
    .reduce((a, s) => a + myMonthly(s), 0);
  const billsMine = state.bills.reduce(
    (a, b) => a + b.amount / Math.max(1, b.people),
    0,
  );
  const tuitionMonthly = state.tuition.reduce(
    (a, x) => a + tuitionPlan(x).perMonth,
    0,
  );
  const owe = state.debts
    .filter((d) => !d.settled && d.dir === "owe")
    .reduce((a, d) => a + d.amount, 0);
  const owed = state.debts
    .filter((d) => !d.settled && d.dir === "owed")
    .reduce((a, d) => a + d.amount, 0);
  const alerts = alertsList();
  const nSoon = alerts.filter((a) => !a.quiet).length;
  const isEmpty =
    !state.subs.length &&
    !state.bills.length &&
    !state.tuition.length &&
    !state.debts.length;
  const mask = (s) => (hideAmt ? "*********₫" : s);

  const flow = subs.length
    ? subs
        .map((s) => {
          const st = subStatus(s);
          const w = total ? (myMonthly(s) / total) * 100 : 0;
          return `<button class="flow-seg ${st}" style="flex:${Math.max(w, 2)} 1 0" data-act="edit-sub" data-id="${s.id}" title="${esc(s.name)} — ${money(myMonthly(s))}/tháng · ${STATUS[st].label}">${esc(s.name)}</button>`;
        })
        .join("")
    : `<div class="flow-empty">Chưa có gói đăng ký nào</div>`;

  const utils = [
    ["add-sub", "", "Thêm gói<br>đăng ký", I.card, true],
    caps.downloads
      ? ["ics", "", "Nhắc lịch<br>điện thoại", I.bell, false]
      : ["go", "calendar", "Lịch<br>thanh toán", I.cal, false],
    ["go", "tuition", "Quỹ<br>học phí", I.cap, false],
    ["go", "bills", "Khoản<br>dùng chung", I.split, false],
    ["go", "debts", "Mượn &amp;<br>Trả", I.cash, false],
  ]
    .map(
      ([act, t, l, ic, acc]) =>
        `<button class="util" data-act="${act}" ${t ? `data-tab="${t}"` : ""}><span class="ico">${ic}${acc ? I.accPlus : ""}</span><span>${l}</span></button>`,
    )
    .join("");

  const duty = `<div class="grid g2">
    <div class="panel stat span-all"><div class="k">Tổng cần chuẩn bị tháng này</div><div class="v num">${mask(money(total + billsMine + tuitionMonthly))}</div><div class="x">Gói đăng ký + hóa đơn + để dành học phí</div></div>
    <div class="panel stat"><div class="k">Hóa đơn</div><div class="v num">${mask(money(billsMine))}</div><div class="x">${state.bills.length} khoản cố định</div></div>
    <div class="panel stat"><div class="k">Để dành học phí</div><div class="v num">${mask(money(tuitionMonthly))}</div><div class="x">mỗi tháng</div></div>
    <div class="panel stat span-all"><div class="k">Nợ bạn bè</div><div class="v num ${owed - owe >= 0 ? "owed" : "owe"}">${owed - owe >= 0 ? "+" : "−"}${money(Math.abs(owed - owe))}</div><div class="x">Bạn nợ ${money(owe)} · được nợ ${money(owed)}</div></div>
  </div>`;

  const topSubs = [...state.subs]
    .sort((a, b) => {
      const o = { kill: 0, trial: 1, warn: 2, unknown: 3, ok: 4 };
      return (
        o[subStatus(a)] - o[subStatus(b)] || myMonthly(b) - myMonthly(a)
      );
    })
    .slice(0, 3);

  return `<div class="ov-grid"><div class="ov-main">
  ${
    isEmpty
? `<div class="panel welcome">
<h3>Chào bạn, mình là OptiSub</h3>
<p class="sub welcome-sub">Thêm gói đăng ký, hóa đơn, học phí và khoản nợ — mình sẽ chỉ ra tiền đang rò rỉ ở đâu và nhắc trước khi bị trừ tiền.</p>
<div class="row"><button class="btn primary" data-act="add-sub">${I.plus} Thêm gói</button><button class="btn soft" data-act="seed">Dùng dữ liệu mẫu</button></div>
    </div>`
: ""
  }
  <section class="acct">
    <div class="acct-head"><span class="tag">Định kỳ</span><span class="meta num">${subs.length} gói${nSoon ? ` · ${nSoon} cần chú ý` : ""}</span></div>
    <div class="acct-cols">
<div><label>Mỗi tháng trả</label><div class="v num">${mask(money(total))}<button class="eye" data-act="eye" aria-label="${hideAmt ? "Hiện số tiền" : "Ẩn số tiền"}">${hideAmt ? I.eyeOff : I.eye}</button></div></div>
<div class="sep" aria-hidden="true"></div>
<div><label>Đang rò rỉ</label><div class="v num ${leak > 0 ? "leak" : ""}">${mask(money(leak))}</div></div>
    </div>
    <div class="flow" aria-label="Cơ cấu chi phí theo từng gói">${flow}</div>
    ${subs.length ? `<div class="legend"><span class="ok">Đáng tiền</span><span class="warn">Cân nhắc</span><span class="kill">Nên cắt</span><span class="trial">Dùng thử</span></div>` : ""}
    ${killAmt > 0 ? `<div class="leak-line">${I.scissors}<span>Cắt nhóm “Nên cắt” ngay: tiết kiệm ${money(killAmt * 12)}/năm.</span></div>` : ""}
    ${state.savedFromCancels > 0 ? `<div class="saved-note">${I.okCircle}<span>Đã cắt được ${money(state.savedFromCancels)}/tháng nhờ OptiSub.</span></div>` : ""}
    <div class="acct-btns"><button class="btn soft" data-act="go" data-tab="subs">Xem chi tiết</button><button class="btn primary${analysis?.loading ? " is-busy" : ""}" data-act="analyze" ${isEmpty || analysis?.loading ? "disabled" : ""}>Phân tích ngay</button></div>
    ${aiBoxHTML()}
  </section>
  ${smartCardHTML()}

  <div class="center"><button class="btn outline lg" data-act="add-sub">${I.plus} Thêm gói đăng ký</button></div>

  <div class="sec-head"><h2>Tiện ích</h2></div>
  <div class="utils">${utils}</div>

  </div><div class="ov-side">
  <div class="sec-head"><h2>Tình hình tháng này</h2></div>
  <div class="segc" role="group"><button data-act="ovseg" data-s="alerts" aria-pressed="${ovSeg === "alerts"}">Cần chú ý${nSoon ? ` (${nSoon})` : ""}</button><button data-act="ovseg" data-s="duty" aria-pressed="${ovSeg === "duty"}">Nghĩa vụ tháng</button></div>
  ${ovSeg === "alerts" ? (alerts.length ? `<div class="alerts">${alerts.map(alertHTML).join("")}</div>` : `<div class="empty">Không có gì sắp bị trừ tiền trong 3 ngày tới. Yên tâm học bài nhé.</div>`) : duty}

  ${topSubs.length ? `<div class="sec-head"><h2>Gói đang sử dụng</h2><button class="link" data-act="go" data-tab="subs">Xem tất cả</button></div><div class="list">${topSubs.map(subHTML).join("")}</div>` : ""}
  </div></div>
  ${syncHTML()}`;
}

/* Khung kết quả "Phân tích ngay", nằm ngay dưới nút trong thẻ Định kỳ */
function aiBoxHTML() {
  if (!analysis) return "";
  const body = analysis.loading
    ? `<div class="ai-load" role="status" aria-label="Đang phân tích"><i></i><i></i><i class="short"></i></div>`
    : `<ul class="ai-list">${analysis.text
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => `<li>${esc(l.replace(/^\s*[•\-*]\s*/, ""))}</li>`)
        .join("")}</ul>${analysis.src ? `<p class="src">${esc(analysis.src)}</p>` : ""}`;
  return `<div class="ai-box" id="ai-box" aria-live="polite"><div class="ai-head">${I.spark}<b>${analysis.loading ? "Đang phân tích…" : "Kết quả phân tích"}</b>${analysis.loading ? "" : `<button class="ai-x" data-act="analysis-close" aria-label="Đóng kết quả phân tích">${I.x}</button>`}</div>${body}</div>`;
}

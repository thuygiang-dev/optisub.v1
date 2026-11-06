import { billDue, monthly, myMonthly, pendingInvites, tuitionPlan } from "../domain.js";
import { I } from "../icons.js";
import { liveAccounts, state } from "../store.js";
import { daysUntil, esc, fmtDate, money, parseD, today, whenText, ym } from "../utils.js";

export function viewTuition() {
  return `
  <div class="sec-head"><div><h2>Học phí theo kỳ</h2><p class="sub">Nhập tổng học phí và hạn đóng — mình tính ngược số cần để dành mỗi tháng</p></div><button class="btn primary sm" data-act="add-tuition">${I.plus} Thêm kỳ</button></div>
  <div class="grid">
  ${
    state.tuition.length
? state.tuition
    .map((x) => {
      const p = tuitionPlan(x);
      return `<div class="panel">
    <div class="row between"><h3 class="h-ic">${I.cap}${esc(x.name)}</h3><span class="chip ${p.left <= 0 ? "ok" : p.days !== null && p.days < 30 ? "kill" : "warn"}">${p.left <= 0 ? "Đã đủ tiền" : `Hạn ${fmtDate(x.due)}/${parseD(x.due).getFullYear()} · ${whenText(p.days)}`}</span></div>
    <div class="bar"><i style="width:${p.pct}%"></i></div>
    <div class="row between tuition-meta"><span class="num">Đã để dành ${money(x.saved || 0)}</span><span class="num">Tổng ${money(x.total)}</span></div>
    ${p.left > 0 ? `<div class="tuition-plan"><div class="sub m-0">Cần để dành mỗi tháng</div><div class="tuition-amt num">${money(p.perMonth)}</div><div class="sub tuition-note">trong ${p.months} tháng còn lại · ≈ ${money(Math.ceil(p.perMonth / 4.3 / 1000) * 1000)}/tuần</div></div>` : ""}
    <div class="row mt-md"><button class="btn sm primary" data-act="save-tuition" data-id="${x.id}">＋ Ghi nhận đã để dành</button><button class="btn icon ghost" data-act="edit-tuition" data-id="${x.id}" aria-label="Sửa" title="Sửa">${I.pen}</button></div>
  </div>`;
    })
    .join("")
: `<div class="empty span-all">Chưa có kỳ học nào. Thêm học phí kỳ tới để không bị “vỡ trận” dòng tiền cuối kỳ.</div>`
  }
  </div>`;
}

export function viewBills() {
  const key = ym(today());
  const sharedSubs = state.subs.filter(
    (s) =>
      s.owner || (s.shareWith || []).length || (s.guests || []).length,
  );
  const mine =
    state.bills.reduce(
      (a, b) => a + b.amount / Math.max(1, b.people),
      0,
    ) + sharedSubs.reduce((a, s) => a + myMonthly(s), 0);
  const inv = pendingInvites();
  const nm = (u) =>
    esc(
      (liveAccounts().find((a) => a.username === u)?.displayName || u)
        .split(" ")
        .slice(-1)[0],
    );
  return `
  ${inv.length ? `<div class="inv-banner">${I.handshake}<span>Bạn có ${inv.length} lời mời ghép nhóm</span><button class="btn primary sm" data-act="go" data-tab="chat">Xem & đồng ý</button></div>` : ""}
  <div class="sec-head"><div><h2>Khoản dùng chung</h2><p class="sub">Khoản chi chung với 1 người hay cả nhóm · phần của bạn mỗi tháng: <b class="num">${money(mine)}</b></p></div><button class="btn primary sm" data-act="add-bill">${I.plus} Thêm khoản</button></div>
  ${
    sharedSubs.length
? `<h3 class="group-title h-ic">${I.link}Gói đăng ký dùng chung</h3><div class="list group-gap">${sharedSubs
    .map((s) => {
      const others = [...new Set(s.shareWith || [])].filter(
        (u) => u !== s.owner,
      );
      const names = [...others.map(nm), ...(s.guests || []).map(esc)];
      const peer = s.owner || (s.shareWith || [])[0];
      return `<div class="item">
<div><div class="item-name">${esc(s.name)} <span class="chip ok">${s.payers || names.length + 1} người</span></div>
<div class="item-meta">${s.owner ? `Chủ gói: ${nm(s.owner)}` : "Bạn giữ gói"}${names.length ? ` · cùng ${names.join(", ")}` : ""}${s.nextBill ? ` · gia hạn ${fmtDate(s.nextBill)}` : ""}</div></div>
<div class="item-right"><div class="item-price num">${money(myMonthly(s))}</div><div class="item-cpu num">trên tổng ${money(monthly(s))}/tháng</div></div>
<div class="item-foot">${peer && liveAccounts().some((a) => a.username === peer) ? `<button class="btn sm soft" data-act="chat-open" data-u="${esc(peer)}">${I.msg} Nhắn ${s.owner ? "chủ gói" : nm(peer)}</button>` : ""}<span class="spacer"></span><button class="btn ghost sm" data-act="go" data-tab="subs">Xem gói</button></div></div>`;
    })
    .join(
      "",
    )}</div><h3 class="group-title h-ic">${I.house}Khoản chi khác</h3>`
: ""
  }
  <div class="list">
  ${
    state.bills.length
? state.bills
    .map((b) => {
      const d = billDue(b);
      const n = daysUntil(d.date);
      const share = b.amount / Math.max(1, b.people);
      return `<div class="item">
    <div><div class="item-name">${esc(b.name)} ${b.paid?.[key] ? `<span class="chip ok">${I.check} Đã trả tháng này</span>` : n < 0 ? '<span class="chip kill">Quá hạn</span>' : n <= 3 ? `<span class="chip warn">${whenText(n)}</span>` : ""}</div>
    <div class="item-meta">Hạn ngày ${b.dueDay} hằng tháng${b.people > 1 ? ` · chia ${b.people} người${b.roommates ? ` (${esc(b.roommates)})` : ""}` : ""}</div></div>
    <div class="item-right"><div class="item-price num">${money(share)}</div><div class="item-cpu num">${b.people > 1 ? `trên tổng ${money(b.amount)}` : "trả một mình"}</div></div>
    <div class="item-foot">
<button class="btn sm ${b.paid?.[key] ? "" : "primary"}" data-act="pay-bill" data-id="${b.id}">${b.paid?.[key] ? "Bỏ đánh dấu" : "Đánh dấu đã trả"}</button>
${b.people > 1 ? `<button class="btn sm" data-act="split-msg" data-id="${b.id}">${I.msg} Nhắc tiền</button>` : ""}
<span class="spacer"></span><button class="btn icon ghost" data-act="edit-bill" data-id="${b.id}" aria-label="Sửa" title="Sửa">${I.pen}</button>
    </div></div>`;
    })
    .join("")
: `<div class="empty">Thêm khoản chi chung: tiền nhà, điện nước, wifi, ăn uống, quỹ lớp, du lịch… Nhập số người cùng chia, mình tự tính phần của mỗi người.</div>`
  }
  </div>`;
}

export function viewDebts() {
  const open = state.debts.filter((d) => !d.settled);
  const closed = state.debts.filter((d) => d.settled);
  const owe = open
    .filter((d) => d.dir === "owe")
    .reduce((a, d) => a + d.amount, 0);
  const owed = open
    .filter((d) => d.dir === "owed")
    .reduce((a, d) => a + d.amount, 0);
  const people = {};
  open.forEach((d) => {
    people[d.person] =
      (people[d.person] || 0) + (d.dir === "owed" ? d.amount : -d.amount);
  });
  const dRow = (d) => `<div class="item ${d.settled ? "done" : ""}">
    <div><div class="item-name"><span class="dir ${d.dir}">${d.dir === "owe" ? I.owe : I.owed}</span>${esc(d.person)}</div><div class="item-meta">${esc(d.note || "")}${d.note ? " · " : ""}${fmtDate(d.date)}</div></div>
    <div class="item-right"><div class="item-price num ${d.dir === "owe" ? "owe" : "owed"}">${d.dir === "owe" ? "−" : "+"}${money(d.amount)}</div><div class="item-cpu">${d.dir === "owe" ? "Cần trả" : "Cần thu"}</div></div>
    <div class="item-foot">${d.settled ? `<button class="btn sm" data-act="settle" data-id="${d.id}">Mở lại</button>` : `<button class="btn sm primary" data-act="settle" data-id="${d.id}">Đã thanh toán</button>${d.dir === "owed" ? `<button class="btn sm" data-act="remind" data-id="${d.id}">${I.bellRing} Nhắc khéo</button>` : ""}`}<span class="spacer"></span><button class="btn icon ghost" data-act="del-debt" data-id="${d.id}" aria-label="Xóa" title="Xóa">${I.trash}</button></div></div>`;
  return `
  <div class="sec-head"><div><h2>Mượn &amp; Trả</h2><p class="sub">Tiền nhỏ hay quên — ghi lại để giữ tình bạn</p></div><button class="btn primary sm" data-act="add-debt">${I.plus} Ghi khoản</button></div>
  <div class="debt-tot"><div class="panel stat"><div class="sub m-0">Cần trả</div><div class="v num owe">${money(owe)}</div></div><div class="panel stat"><div class="sub m-0">Cần thu</div><div class="v num owed">${money(owed)}</div></div></div>
  ${
    Object.keys(people).length > 1
? `<p class="sub debt-sum">Tính gộp theo người: ${Object.entries(
    people,
  )
    .map(
      ([p, v]) =>
        `${esc(p)} ${v >= 0 ? "nợ bạn" : "bạn nợ"} ${money(Math.abs(v))}`,
    )
    .join("; ")}.</p>`
: ""
  }
  <div class="list mt-md">${open.length ? open.map(dRow).join("") : `<div class="empty">Không còn khoản nợ nào.</div>`}</div>
  ${closed.length ? `<div class="sec-head"><h3>Đã thanh toán</h3></div><div class="list">${closed.slice(-10).reverse().map(dRow).join("")}</div>` : ""}`;
}

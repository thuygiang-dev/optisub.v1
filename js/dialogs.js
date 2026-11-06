import { CANCEL, GENERIC_CANCEL, MINDSET } from "./content.js";
import { alertsList, monthly, myMonthly, savings, svcKey } from "./domain.js";
import { I } from "./icons.js";
import { caps, current, liveAccounts, peers, state } from "./store.js";
import { dlg, fmtIn, openDlg } from "./ui.js";
import { esc, fmtDate, initials, iso, money, today } from "./utils.js";
import { alertHTML } from "./views/shared.js";

export function savingsSheet() {
  const sv = savings();
  const row = (l, r, sub) =>
    `<div class="alert ok-row"><div class="grow"><div class="t">${l}</div>${sub ? `<div class="d">${sub}</div>` : ""}</div><div class="num save-amt">${r}</div></div>`;
  openDlg(
    "Khoản đã tiết kiệm",
    `
    <div class="acc-top"><span class="av lg av-ok">${I.piggy}</span><h3 class="savings-total num">${money(sv.total)}<span class="sub per">/tháng</span></h3><span class="sub m-0">≈ ${money(sv.total * 12)}/năm${sv.pct ? ` · giảm ${sv.pct}% chi phí gói đăng ký` : ""}</span></div>
    ${sv.total ? "" : `<div class="empty">Chưa có khoản nào. Hủy các gói không sử dụng hoặc chia sẻ chi phí gói với người dùng chung để bắt đầu tiết kiệm.</div>`}
    ${sv.cut.length || sv.legacy ? `<h3 class="sheet-h h-ic">${I.scissors}Cắt gói dư thừa</h3><div class="alerts">${sv.cut.map((c) => row(esc(c.name), "+" + money(c.amt), "Đã hủy, không còn bị trừ tiền")).join("")}${sv.legacy ? row("Các gói đã cắt trước đây", "+" + money(sv.legacy)) : ""}</div>` : ""}
    ${sv.shared.length ? `<h3 class="sheet-h h-ic">${I.link}Ghép nhóm dùng chung</h3><div class="alerts">${sv.shared.map((x) => row(esc(x.name), "+" + money(x.amt), `${money(x.full)} → ${money(x.mine)} (chia ${x.n} người) · giảm ${Math.round((1 - 1 / x.n) * 100)}%`)).join("")}</div>` : ""}
    <p class="hint m-0 text-center">% giảm = khoản đã tiết kiệm ÷ (chi phí hiện tại ${money(sv.spend)} + khoản đã tiết kiệm)</p>
  `,
    `<button class="btn primary" data-act="close">Đóng</button>`,
  );
}

export function smartFind(id) {
  const s = state.subs.find((x) => x.id === id);
  if (!s) return;
  const k = svcKey(s.name);
  const rows = liveAccounts()
    .filter((a) => a.id !== current.id)
    .map((a) => {
      const st = peers[a.username];
      const ps = st && st.subs.find((x) => svcKey(x.name) === k);
      const solo =
        ps &&
        !ps.owner &&
        (ps.payers || 1) <= 1 &&
        !(ps.shareWith || []).length;
      return { a, ps, solo };
    })
    .sort(
      (x, y) => (y.solo ? 2 : y.ps ? 1 : 0) - (x.solo ? 2 : x.ps ? 1 : 0),
    );
  openDlg(
    `Tìm bạn ghép nhóm · ${esc(s.name)}`,
    `
    <p class="sub m-0">Chọn người muốn mời. Người đang trả riêng ${esc(s.name)} được chọn sẵn vì ghép với họ tiết kiệm nhiều nhất.</p>
    <div id="sf-list">${rows.map((r) => `<button class="dev" data-act="sf-toggle" data-u="${esc(r.a.username)}" aria-pressed="${r.solo}"><span class="av">${esc(initials(r.a.displayName))}</span><span class="dev-txt"><span class="who">${esc(r.a.displayName)}</span><span class="u">@${esc(r.a.username)} · ${r.solo ? `đang trả riêng ${money(monthly(r.ps))}/tháng` : r.ps ? "đã ở trong một nhóm" : `chưa dùng ${esc(s.name)}`}</span></span><span class="tick">${I.check}</span></button>`).join("")}</div>
    <div class="pick-sum" id="sf-sum"></div>
    <div class="notif-tip">${I.userPlus}<span>Mời người chưa dùng OptiSub: sao chép lời mời và gửi qua Zalo/Messenger.</span></div>
  `,
    `<button class="btn" data-act="sf-copy" data-id="${s.id}">${I.copy} Sao chép lời mời</button><button class="btn primary" data-act="sf-send" data-id="${s.id}">${I.send} Gửi lời mời</button>`,
  );
  sfSum(s);
}

export function sfSel() {
  return [
    ...dlg.querySelectorAll('#sf-list .dev[aria-pressed="true"]'),
  ].map((b) => b.dataset.u);
}

export function sfSum(s) {
  const el = dlg.querySelector("#sf-sum");
  if (!el) return;
  const n = sfSel().length + 1;
  el.textContent =
    n === 1
      ? "Chọn ít nhất 1 người."
      : `Nhóm ${n} người · mỗi người ${money(monthly(s) / n)}/tháng (giảm ${Math.round((1 - 1 / n) * 100)}%)`;
}

export function accountSheet() {
  const a = current;
  openDlg(
    "Tài khoản",
    `
    <div class="acc-top"><span class="av lg">${esc(initials(a.displayName))}</span><h3 class="acc-name">${esc(a.displayName)}</h3><span class="sub">@${esc(a.username)} · đã tiết kiệm ${money(savings().total)}/tháng</span></div>
    <div class="list-label">Đăng nhập với tư cách…</div>
    <div class="dev-list">${liveAccounts()
      .map(
        (x) =>
          `<button class="dev" data-act="switch-acc" data-u="${esc(x.id)}" aria-pressed="${x.id === a.id}"><span class="av">${esc(initials(x.displayName))}</span><span class="dev-txt"><span class="who">${esc(x.displayName)}</span><span class="u">@${esc(x.username)}</span></span>${x.id === a.id ? `<span class="tick">${I.check}</span>` : ""}</button>`,
      )
      .join("")}</div>
    <div class="menu">
      <button data-act="settings">${I.settings} Cài đặt</button>
      <button data-act="reset-data">${I.reset} Khôi phục dữ liệu ban đầu</button>
      <button class="danger" data-act="logout">${I.logout} Đăng xuất</button>
    </div>
    <p class="hint text-center">Dữ liệu được lưu trên thiết bị này.</p>
  `,
    `<button class="btn" data-act="close">Đóng</button>`,
  );
}

export function cancelDlg(id) {
  const s = state.subs.find((x) => x.id === id);
  if (!s) return;
  const n = s.name.toLowerCase();
  const key = Object.keys(CANCEL).find((k) => n.includes(k));
  const steps = key ? CANCEL[key] : GENERIC_CANCEL;
  const deadline = s.trialEnd || s.nextBill;
  openDlg(
    `Hủy ${esc(s.name)}`,
    `
    <div class="tip tip-leak">Tiết kiệm ${money(myMonthly(s))}/tháng · ${money(myMonthly(s) * 12)}/năm.${deadline ? ` Hủy trước <b>${fmtDate(deadline)}</b> để không bị trừ kỳ tới.` : ""}</div>
    <div><h3 class="sheet-h">Cách hủy</h3><ol class="steps">${steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>${key ? `<p class="hint mt-xs">Nếu đã đăng ký qua App Store hoặc Google Play, hãy hủy trong phần Gói đăng ký của cửa hàng đó.</p>` : ""}</div>
    <p class="mind m-0">${I.bulb}<span>${MINDSET[s.name.length % 3]}</span></p>
  `,
    `<button class="btn ${s.cancelTodo ? "" : "soft"}" data-act="remind-cancel" data-id="${s.id}">${s.cancelTodo ? `${I.bellOff} Bỏ nhắc hủy` : `${I.bellRing} Nhắc tôi hủy`}</button><button class="btn primary" data-act="mark-cancelled" data-id="${s.id}">Tôi đã hủy xong</button>`,
  );
}

export function tuitionForm(x) {
  const isNew = !x;
  x = x || { name: "", total: "", saved: 0, due: "" };
  openDlg(
    isNew ? "Thêm kỳ học" : "Sửa " + esc(x.name),
    `
    <label class="f">Tên kỳ<input id="t-name" value="${esc(x.name)}" placeholder="VD: Học kỳ 2, 2026–2027"></label>
    <div class="f2"><label class="f">Tổng học phí (₫)<input id="t-total" class="money" type="text" inputmode="numeric" autocomplete="off" value="${fmtIn(x.total)}" placeholder="12.500.000"></label>
    <label class="f">Hạn đóng<input id="t-due" type="date" value="${esc(x.due)}"></label></div>
    <label class="f">Đã để dành được (₫)<input id="t-saved" class="money" type="text" inputmode="numeric" autocomplete="off" value="${fmtIn(x.saved || 0)}" placeholder="0"></label>
  `,
    `${isNew ? "" : `<button class="btn danger mr-auto" data-act="del-tuition" data-id="${x.id}">Xóa</button>`}<button class="btn" data-act="close">Huỷ</button><button class="btn primary" data-act="save-tuition-form" data-id="${x.id || ""}">${isNew ? "Thêm kỳ học" : "Lưu"}</button>`,
  );
}

export function billForm(b) {
  const isNew = !b;
  b = b || { name: "", amount: "", dueDay: 5, people: 1, roommates: "" };
  openDlg(
    isNew ? "Thêm khoản chia tiền" : "Sửa " + esc(b.name),
    `
    <label class="f">Tên khoản<input id="b-name" list="bl" value="${esc(b.name)}" placeholder="Tiền nhà, ăn chung, quỹ lớp, du lịch…"></label>
    <datalist id="bl">${["Tiền nhà", "Điện", "Nước", "Wifi", "Ăn uống chung", "Quỹ lớp", "Quỹ nhóm", "Du lịch", "Gửi xe"].map((x) => `<option value="${x}">`).join("")}</datalist>
    <div class="f2"><label class="f">Tổng tiền (₫)<input id="b-amount" class="money" type="text" inputmode="numeric" autocomplete="off" value="${fmtIn(b.amount)}" placeholder="4.500.000"></label>
    <label class="f">Hạn đóng (ngày trong tháng)<input id="b-day" type="number" min="1" max="31" value="${esc(b.dueDay)}"></label></div>
    <div class="f2"><label class="f">Số người chia (tính cả bạn)<input id="b-people" type="number" min="1" value="${esc(b.people)}"></label>
    <label class="f">Tên người cùng chia <span class="hint">không bắt buộc</span><input id="b-room" value="${esc(b.roommates || "")}" placeholder="Minh, Lan"></label></div>
  `,
    `${isNew ? "" : `<button class="btn danger mr-auto" data-act="del-bill" data-id="${b.id}">Xóa</button>`}<button class="btn" data-act="close">Huỷ</button><button class="btn primary" data-act="save-bill" data-id="${b.id || ""}">${isNew ? "Thêm hóa đơn" : "Lưu"}</button>`,
  );
}

export function debtForm() {
  openDlg(
    "Ghi khoản nợ",
    `
    <div class="f2"><label class="f">Loại<select id="d-dir"><option value="owed">Cần thu</option><option value="owe">Cần trả</option></select></label>
    <label class="f">Tên bạn<input id="d-person" placeholder="VD: Minh"></label></div>
    <div class="f2"><label class="f">Số tiền (₫)<input id="d-amount" class="money" type="text" inputmode="numeric" autocomplete="off" placeholder="50.000"></label>
    <label class="f">Ngày<input id="d-date" type="date" value="${iso(today())}"></label></div>
    <label class="f">Ghi chú<input id="d-note" placeholder="Trà sữa, vé xem phim, đổ xăng…"></label>
  `,
    `<button class="btn" data-act="close">Huỷ</button><button class="btn primary" data-act="save-debt">Ghi lại</button>`,
  );
}

export function notifCenter() {
  const list = alertsList();
  openDlg(
    "Thông báo",
    `
    ${list.length ? `<div class="alerts">${list.map(alertHTML).join("")}</div>` : `<div class="empty">Chưa có thông báo nào. OptiSub sẽ báo ở đây trước khi bị trừ tiền.</div>`}
    <div class="notif-tip">${I.phone}<span><b>Nhận thông báo trên màn hình điện thoại</b>, kể cả khi không mở OptiSub: thêm lịch nhắc vào ứng dụng Lịch của điện thoại. Điện thoại sẽ tự hiện thông báo trước mỗi lần gia hạn, hết dùng thử và hạn đóng tiền.</span></div>
  `,
    `${caps.downloads ? `<button class="btn primary" data-act="ics">${I.bell} Bật nhắc trên điện thoại</button>` : ""}<button class="btn" data-act="close">Đóng</button>`,
  );
}

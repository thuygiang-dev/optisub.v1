import { monthly, tipFor } from "./domain.js";
import { commit, current, liveAccounts, loadState, saveState, state } from "./store.js";
import { dlg, fmtIn, numv, openDlg, toast, val } from "./ui.js";
import { esc, initials, iso, money, normUser, today, uid } from "./utils.js";

export function subForm(s) {
  const isNew = !s;
  s = s || {
    name: "",
    price: "",
    cycle: "month",
    nextBill: "",
    trialEnd: "",
    sharedWith: 1,
    payers: 1,
    email: "",
    usage: {},
  };
  openDlg(
    isNew ? "Thêm gói đăng ký" : "Sửa " + esc(s.name),
    `
    <label class="f">Tên dịch vụ<input id="f-name" list="svc" value="${esc(s.name)}" placeholder="VD: Spotify Premium" required></label>
    <datalist id="svc">${["Netflix", "Spotify Premium", "YouTube Premium", "ChatGPT Plus", "Canva Pro", "iCloud+", "Google One", "Microsoft 365", "Notion Plus", "Apple Music", "Duolingo Super", "CapCut Pro"].map((x) => `<option value="${x}">`).join("")}</datalist>
    <div class="f2"><label class="f">Giá (₫)<input id="f-price" class="money" type="text" inputmode="numeric" autocomplete="off" value="${fmtIn(s.price)}" placeholder="59.000"></label>
    <label class="f">Chu kỳ<select id="f-cycle"><option value="month" ${s.cycle === "month" ? "selected" : ""}>Hằng tháng</option><option value="year" ${s.cycle === "year" ? "selected" : ""}>Hằng năm</option></select></label></div>
    <div class="f2"><label class="f">Ngày gia hạn kế tiếp<input id="f-next" type="date" value="${esc(s.nextBill)}"></label>
    <label class="f">Hết dùng thử (nếu có)<input id="f-trial" type="date" value="${esc(s.trialEnd)}"></label></div>
    <div class="f"><span>Dùng chung với <span class="hint">Nhập tên đăng nhập (VD: @vy.tran) để ghép nối tài khoản, hoặc gõ tên người không dùng app</span></span>
<div class="share-in"><input id="f-share-in" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="@tên_đăng_nhập hoặc tên người"><button type="button" class="btn soft sm" data-act="share-add">Thêm</button></div>
<div class="share-err" id="f-share-err" role="alert"></div>
<div class="sugs" id="f-share-sug"></div>
<div class="pick" id="f-share"></div>
<label class="check sm" id="f-share-debt-wrap" hidden><input type="checkbox" id="f-share-debt" checked> Ghi phần tiền của người không dùng app vào Sổ nợ bạn bè</label>
<div class="pick-sum" id="f-share-sum"></div>
    </div>
    <label class="f">Thông báo nhắc trước khi trừ tiền <span class="hint">OptiSub báo trên app và trên điện thoại (qua lịch nhắc)</span><select id="f-remind">${[
[3, "Trước 3 ngày"],
[2, "Trước 2 ngày"],
[1, "Trước 1 ngày"],
[0, "Đúng ngày trừ tiền"],
[-1, "Tắt thông báo"],
    ]
.map(
  ([v, l]) =>
    `<option value="${v}" ${(s.remind ?? 3) === v ? "selected" : ""}>${l}</option>`,
)
.join("")}</select></label>
  `,
    `${isNew ? "" : `<button class="btn danger mr-auto" data-act="del-sub" data-id="${s.id}">Xóa</button>`}<button class="btn" data-act="close">Huỷ</button><button class="btn primary" data-act="save-sub" data-id="${s.id || ""}">${isNew ? "Thêm gói" : "Lưu thay đổi"}</button>`,
  );
  shareDraft = {
    users: [...(s.shareWith || [])],
    guests: [...(s.guests || [])],
    locked: !!s.owner && s.owner !== current.username,
  };
  renderShare();
}

export let shareDraft = { users: [], guests: [], locked: false };

export function shareSel() {
  return shareDraft.users;
}

export function renderShare() {
  const box = dlg.querySelector("#f-share");
  if (!box) return;
  const acc = (u) => liveAccounts().find((a) => a.username === u);
  box.innerHTML =
    shareDraft.users
      .map((u) => {
        const a = acc(u);
        return `<span class="chip2"><span class="av">${esc(initials(a?.displayName || u))}</span>${esc((a?.displayName || u).split(" ").slice(-1)[0])} <small>@${esc(u)}</small>${shareDraft.locked ? "" : `<button type="button" class="x" data-act="share-rm" data-u="${esc(u)}" aria-label="Bỏ ${esc(u)}">×</button>`}</span>`;
      })
      .join("") +
    shareDraft.guests
      .map(
        (g, i) =>
          `<span class="chip2 guest"><span class="av">${esc(initials(g))}</span>${esc(g)} <small>không dùng app</small>${shareDraft.locked ? "" : `<button type="button" class="x" data-act="share-rm" data-g="${i}" aria-label="Bỏ ${esc(g)}">×</button>`}</span>`,
      )
      .join("");
  const q = normUser(val("f-share-in")).replace(/^@/, "");
  const sug = shareDraft.locked
    ? []
    : liveAccounts()
        .filter(
          (a) =>
            a.id !== current.id &&
            !shareDraft.users.includes(a.username) &&
            (!q ||
              a.username.includes(q) ||
              normUser(a.displayName).includes(q)),
        )
        .slice(0, 4);
  dlg.querySelector("#f-share-sug").innerHTML = sug.length
    ? `<span class="hint">Gợi ý:</span>${sug.map((a) => `<button type="button" data-act="share-pick" data-u="${esc(a.username)}">@${esc(a.username)}</button>`).join("")}`
    : "";
  const inWrap = dlg.querySelector(".share-in");
  if (inWrap) inWrap.hidden = shareDraft.locked;
  const dw = dlg.querySelector("#f-share-debt-wrap");
  if (dw) dw.hidden = !shareDraft.guests.length || shareDraft.locked;
  updateShareSum();
}

export function shareAdd(raw) {
  const err = dlg.querySelector("#f-share-err");
  err.textContent = "";
  const text = String(raw || "").trim();
  if (!text) return;
  const u = normUser(text).replace(/^@/, "");
  const a = liveAccounts().find((x) => x.username === u);
  if (a) {
    if (a.id === current.id) {
      err.textContent = "Đây là tài khoản của bạn rồi.";
      return;
    }
    if (!shareDraft.users.includes(u)) shareDraft.users.push(u);
  } else if (text.startsWith("@")) {
    err.textContent = `Không tìm thấy tài khoản @${u}. Bỏ dấu @ nếu người này không dùng app.`;
    return;
  } else {
    if (text.length > 40) {
      err.textContent = "Tên quá dài.";
      return;
    }
    if (
      !shareDraft.guests.some(
        (g) => g.toLowerCase() === text.toLowerCase(),
      )
    )
      shareDraft.guests.push(text);
  }
  const f = dlg.querySelector("#f-share-in");
  f.value = "";
  f.focus();
  renderShare();
}

export function updateShareSum() {
  const el = dlg.querySelector("#f-share-sum");
  if (!el) return;
  const n = shareDraft.users.length + shareDraft.guests.length + 1;
  const price = numv("f-price");
  const cyc = val("f-cycle");
  el.textContent =
    n === 1
      ? "Chỉ mình bạn dùng và trả tiền."
      : `${n} người dùng chung (tính cả bạn)${price ? ` · mỗi người trả ${money((cyc === "year" ? price / 12 : price) / n)}/tháng` : ""}`;
}

/* Ghép nối: đẩy gói dùng chung sang app của các tài khoản được chọn */
export async function syncShared(s, removed = []) {
  const me = current;
  const members = [me.username, ...(s.shareWith || [])];
  const targets = [
    ...(s.shareWith || []).map((u) => [u, true]),
    ...removed.map((u) => [u, false]),
  ];
  for (const [u, keep] of targets) {
    const acc = liveAccounts().find((a) => a.username === u);
    if (!acc || acc.id === me.id) continue;
    const st = await loadState(acc);
    const i = st.subs.findIndex((x) => x.id === s.id);
    if (keep) {
      const prev = i >= 0 ? st.subs[i] : null;
      const copy = {
        ...s,
        usage: prev ? prev.usage : {},
        remind: prev ? prev.remind : s.remind,
        cancelTodo: prev ? prev.cancelTodo : false,
        shareWith: members.filter((x) => x !== u),
        sharedBy: me.displayName,
        owner: me.username,
      };
      if (i >= 0) st.subs[i] = copy;
      else st.subs.push(copy);
    } else if (i >= 0 && st.subs[i].owner === me.username)
      st.subs.splice(i, 1);
    await saveState(acc, st);
  }
}

export function saveSub(id) {
  const name = val("f-name").trim();
  const price = numv("f-price");
  if (!name || !price) {
    toast("Nhập tên dịch vụ và giá để lưu.");
    return;
  }
  let s = state.subs.find((x) => x.id === id);
  const isNew = !s;
  if (isNew) {
    s = { id: uid(), usage: {}, createdAt: Date.now() };
    state.subs.push(s);
  } else if (price > s.price) {
    s.prevPrice = s.price;
    s.priceChangedAt = Date.now();
  } else if (price < s.price) {
    s.prevPrice = 0;
  }
  Object.assign(s, {
    name,
    price,
    cycle: val("f-cycle"),
    nextBill: val("f-next"),
    trialEnd: val("f-trial"),
    remind: Number(val("f-remind")),
  });
  const before = s.shareWith || [];
  const sel = shareSel();
  if (!s.owner || s.owner === current.username) {
    const pending = val("f-share-in").trim();
    if (pending) shareAdd(pending);
    const guestsBefore = s.guests || [];
    s.shareWith = sel;
    s.guests = [...shareDraft.guests];
    s.sharedWith = sel.length + s.guests.length + 1;
    s.payers = s.sharedWith;
    delete s.owner;
    delete s.sharedBy;
    const newGuests = s.guests.filter((g) => !guestsBefore.includes(g));
    if (newGuests.length && dlg.querySelector("#f-share-debt")?.checked) {
      const share =
        Math.round(monthly({ ...s, price }) / s.sharedWith / 1000) * 1000;
      newGuests.forEach((g) =>
        state.debts.push({
          id: uid(),
          person: g,
          amount: share,
          dir: "owed",
          note: `Phần ${name} tháng ${today().getMonth() + 1}`,
          date: iso(today()),
          settled: false,
        }),
      );
      setTimeout(
        () =>
          toast(
            `📒 Đã ghi ${newGuests.join(", ")} nợ ${money(share)} vào Sổ nợ bạn bè.`,
            4500,
          ),
        1200,
      );
    }
    const removed = before.filter((u) => !sel.includes(u));
    if (sel.length || removed.length)
      syncShared(s, removed).then(() => {
        if (sel.length)
          toast(
            `🔗 Đã ghép nối ${s.name} với ${sel.map((u) => "@" + u).join(", ")}.`,
            4500,
          );
      });
  }
  if (s.trialEnd) s.trialConverted = false;
  dlg.close();
  commit();
  if (isNew) {
    const t = tipFor(s);
    toast(
      `✅ Đã thêm ${s.name} (${money(s.price)}/${s.cycle === "year" ? "năm" : "tháng"}).${t ? " " + t : " Chọn mức dùng (Không dùng / Ít / Hằng tuần / Hằng ngày) trên thẻ gói để đo chi phí thật."}`,
      7000,
    );
  } else toast("Đã lưu thay đổi.");
}

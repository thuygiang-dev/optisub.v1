import { runAnalysis, sendChat } from "./ai.js";
import { accountSheet, billForm, cancelDlg, debtForm, notifCenter, savingsSheet, sfSel, sfSum, smartFind, tuitionForm } from "./dialogs.js";
import { monthly, myMonthly, smartMatches, tuitionPlan } from "./domain.js";
import { I } from "./icons.js";
import { buildICS } from "./ics.js";
import { hidePush } from "./notify.js";
import { goTab, render } from "./render.js";
import { seed, seedState } from "./seed.js";
import { factoryReset, factoryResetConfirm, setTheme, settingsSheet } from "./settings.js";
import { acceptInvite, chatSendText, declineInvite, inviteText, matchAcc, openChat, pushToAccount, sendInApp, sendInvites, textDlg } from "./social.js";
import { caps, chatPeer, commit, current, enterAccount, hideAmt, liveAccounts, logout, setAnalysis, setChatLog, setChatPeer, setHideAmt, setOvSeg, setSmartIdx, setState, setSub, setTab, smartIdx, state } from "./store.js";
import { renderShare, saveSub, shareAdd, shareDraft, subForm, syncShared, updateShareSum } from "./sub-form.js";
import { copy, dlg, hideToast, numv, openDlg, scrollToEnd, toast, val } from "./ui.js";
import { $, NF, esc, fmtDate, initials, iso, money, monthKey, today, uid, ym } from "./utils.js";

document.addEventListener("change", (e) => {
  if (e.target.id === "f-cycle") updateShareSum();
});

document.addEventListener("input", (e) => {
  if (e.target.id === "f-price") setTimeout(updateShareSum);
  if (e.target.id === "f-share-in") {
    const er = dlg.querySelector("#f-share-err");
    if (er) er.textContent = "";
    renderShare();
  }
  const f = e.target;
  if (!f.classList || !f.classList.contains("money")) return;
  const caret = f.selectionStart ?? f.value.length;
  const digitsBefore = f.value.slice(0, caret).replace(/\D/g, "").length;
  const digits = f.value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 13);
  f.value = digits ? NF.format(Number(digits)) : "";
  let pos = 0,
    seen = 0;
  while (pos < f.value.length && seen < digitsBefore) {
    if (/\d/.test(f.value[pos])) seen++;
    pos++;
  }
  try {
    f.setSelectionRange(pos, pos);
  } catch (err) {}
});

/* Thao tác phải chờ: hiện vòng xoay trên nút đã bấm và chặn bấm lặp */
const BUSY_ACTS = new Set([
  "switch-acc",
  "smart-invite",
  "sf-send",
  "invite-accept",
  "invite-decline",
  "chat-send",
  "chat-invite-go",
  "chat-remind-go",
  "msg-send",
  "ics",
  "send",
  "ask",
]);
function setBusy(el, on) {
  el.classList.toggle("is-busy", on);
  el.setAttribute("aria-busy", String(on));
  if ("disabled" in el) el.disabled = on;
}

document.addEventListener("click", async (ev) => {
  const el = ev.target.closest("[data-act],[data-tab]");
  if (!el) return;
  const act = el.dataset.act;
  if (!act && el.dataset.tab) {
    goTab(el.dataset.tab);
    return;
  }
  if (!BUSY_ACTS.has(act)) return handle(ev, el, act);
  if (el.getAttribute("aria-busy") === "true") return;
  setBusy(el, true);
  try {
    await handle(ev, el, act);
  } finally {
    setBusy(el, false);
  }
});

async function handle(ev, el, act) {
  const id = el.dataset.id;
  switch (act) {
    case "go":
      goTab(el.dataset.tab);
      break;
    case "sub":
      setSub(el.dataset.s);
      render();
      break;
    case "ovseg":
      setOvSeg(el.dataset.s);
      render();
      break;
    case "eye":
      setHideAmt(!hideAmt);
      try {
        localStorage.setItem("optisub.hide", hideAmt ? "1" : "0");
      } catch (e) {}
      render();
      break;
    case "tier":
    case "savings":
      savingsSheet();
      break;
    case "close":
      dlg.close();
      break;
    case "settings":
      settingsSheet();
      break;
    case "set-theme":
      setTheme(el.dataset.v);
      settingsSheet();
      break;
    case "set-hide":
      setHideAmt(!hideAmt);
      try {
        localStorage.setItem("optisub.hide", hideAmt ? "1" : "0");
      } catch (e) {}
      render();
      settingsSheet();
      break;
    case "factory-reset":
      factoryResetConfirm();
      break;
    case "factory-reset-go":
      factoryReset();
      break;
    case "toast-close":
      hideToast();
      break;
    case "push-close":
      hidePush();
      break;
    case "analysis-close":
      setAnalysis(null);
      render();
      break;
    case "account":
      accountSheet();
      break;
    case "logout":
      logout();
      break;
    case "switch-acc": {
      const acc = liveAccounts().find((x) => x.id === el.dataset.u);
      if (!acc || acc === current) {
        dlg.close();
        break;
      }
      dlg.close();
      hidePush();
      await enterAccount(acc);
      toast("👋 Đang dùng tài khoản " + acc.displayName);
      break;
    }
    case "reset-data":
      if (
        confirm(
          "Khôi phục dữ liệu ban đầu cho tài khoản này? Mọi thay đổi sẽ mất.",
        )
      ) {
        setState(seedState(current.kind));
        dlg.close();
        commit();
        toast("🔄 Đã khôi phục dữ liệu ban đầu.");
      }
      break;
    case "seed":
      seed();
      break;
    case "analyze":
      runAnalysis();
      break;
    case "add-sub":
      subForm();
      break;
    case "edit-sub":
      subForm(state.subs.find((s) => s.id === id));
      break;
    case "save-sub":
      saveSub(id);
      break;
    case "del-sub":
      if (confirm("Xóa gói này khỏi danh sách?")) {
        const s = state.subs.find((x) => x.id === id);
        if (s && !s.owner && (s.shareWith || []).length)
          syncShared({ ...s, shareWith: [] }, s.shareWith);
        state.subs = state.subs.filter((s) => s.id !== id);
        dlg.close();
        commit();
      }
      break;
    case "share-add":
      shareAdd(val("f-share-in"));
      break;
    case "share-pick":
      shareAdd("@" + el.dataset.u);
      break;
    case "share-rm":
      if (el.dataset.u)
        shareDraft.users = shareDraft.users.filter(
          (u) => u !== el.dataset.u,
        );
      else shareDraft.guests.splice(Number(el.dataset.g), 1);
      renderShare();
      break;
    case "freq": {
      const s = state.subs.find((x) => x.id === id);
      s.usage[monthKey(0)] = Number(el.dataset.v);
      commit();
      break;
    }
    case "use": {
      const s = state.subs.find((x) => x.id === id);
      const k = monthKey(0);
      s.usage[k] = Math.max(0, (s.usage[k] || 0) + Number(el.dataset.d));
      commit();
      break;
    }
    case "cancel":
      cancelDlg(id);
      break;
    case "remind-cancel": {
      const s = state.subs.find((x) => x.id === id);
      s.cancelTodo = !s.cancelTodo;
      commit();
      dlg.close();
      toast(
        s.cancelTodo
          ? `🔔 OptiSub sẽ nhắc bạn hủy ${s.name} mỗi lần mở app cho đến khi xong.`
          : "Đã bỏ nhắc hủy.",
        4500,
      );
      break;
    }
    case "notifs":
      hidePush();
      notifCenter();
      break;
    case "copy-mail":
      copy(`Tiêu đề: ${val("m-subj")}\n\n${val("m-body")}`);
      break;
    case "copy-text":
      copy(val("m-body"));
      break;
    case "mark-cancelled": {
      const s = state.subs.find((x) => x.id === id);
      state.savedFromCancels =
        (state.savedFromCancels || 0) + myMonthly(s);
      state.cancelled.push({
        name: s.name,
        monthly: myMonthly(s),
        at: Date.now(),
      });
      /* Chủ gói hủy gói nhóm: gỡ gói khỏi các thành viên (giống khi xóa gói) */
      if (!s.owner && (s.shareWith || []).length)
        syncShared({ ...s, shareWith: [] }, s.shareWith);
      state.subs = state.subs.filter((x) => x.id !== id);
      dlg.close();
      commit();
      toast(
        `🎉 Đã cắt ${s.name}. Bạn vừa giữ lại ${money(myMonthly(s) * 12)} mỗi năm.`,
        5000,
      );
      break;
    }
    case "add-tuition":
      tuitionForm();
      break;
    case "edit-tuition":
      tuitionForm(state.tuition.find((x) => x.id === id));
      break;
    case "save-tuition-form": {
      const name = val("t-name").trim();
      const total = numv("t-total");
      const due = val("t-due");
      if (!name || !total || !due) {
        toast("Nhập tên kỳ, tổng học phí và hạn đóng.");
        return;
      }
      let x = state.tuition.find((t) => t.id === id);
      if (!x) {
        x = { id: uid() };
        state.tuition.push(x);
      }
      Object.assign(x, { name, total, due, saved: numv("t-saved") });
      dlg.close();
      commit();
      const p = tuitionPlan(x);
      toast(
        `🎓 Cần để dành ${money(p.perMonth)}/tháng trong ${p.months} tháng.`,
        5000,
      );
      break;
    }
    case "del-tuition":
      if (!confirm("Xóa kỳ học phí này?")) break;
      state.tuition = state.tuition.filter((x) => x.id !== id);
      dlg.close();
      commit();
      break;
    case "save-tuition":
      openDlg(
        "Ghi nhận đã để dành",
        `<label class="f">Số tiền vừa để dành (₫)<input id="s-amt" class="money" type="text" inputmode="numeric" autocomplete="off" placeholder="500.000"></label>`,
        `<button class="btn" data-act="close">Huỷ</button><button class="btn primary" data-act="add-saving" data-id="${id}">Ghi nhận</button>`,
      );
      break;
    case "add-saving": {
      const x = state.tuition.find((t) => t.id === id);
      x.saved = (x.saved || 0) + numv("s-amt");
      dlg.close();
      commit();
      toast("💪 Đã cộng vào quỹ học phí.");
      break;
    }
    case "add-bill":
      billForm();
      break;
    case "edit-bill":
      billForm(state.bills.find((b) => b.id === id));
      break;
    case "save-bill": {
      const name = val("b-name").trim();
      const amount = numv("b-amount");
      if (!name || !amount) {
        toast("Nhập tên và số tiền hóa đơn.");
        return;
      }
      let b = state.bills.find((x) => x.id === id);
      if (!b) {
        b = { id: uid(), paid: {} };
        state.bills.push(b);
      }
      Object.assign(b, {
        name,
        amount,
        dueDay: Math.min(31, Math.max(1, numv("b-day") || 1)),
        people: Math.max(1, numv("b-people") || 1),
        roommates: val("b-room").trim(),
      });
      dlg.close();
      commit();
      if (b.people > 1)
        toast(`🏠 Mỗi người trả ${money(b.amount / b.people)}.`);
      break;
    }
    case "del-bill":
      if (!confirm("Xóa khoản chia này?")) break;
      state.bills = state.bills.filter((b) => b.id !== id);
      dlg.close();
      commit();
      break;
    case "pay-bill": {
      const b = state.bills.find((x) => x.id === id);
      const k = ym(today());
      b.paid = b.paid || {};
      if (b.paid[k]) delete b.paid[k];
      else b.paid[k] = true;
      commit();
      break;
    }
    case "split-msg": {
      const b = state.bills.find((x) => x.id === id);
      const share = money(b.amount / b.people);
      const tos = (b.roommates || "")
        .split(/[,;]+/)
        .map(matchAcc)
        .filter(Boolean)
        .map((a) => a.username);
      textDlg(
        "Tin nhắn chia tiền",
        `Hi ${b.roommates || "cả nhà"} 👋 ${b.name} tháng ${today().getMonth() + 1} hết ${money(b.amount)}, chia ${b.people} người là ${share}/người. Hạn đóng ngày ${b.dueDay} nha, mọi người chuyển cho mình trước hôm đó giúp mình nhé. Cảm ơn! 🙏`,
        {
          to: tos,
          amount: Math.round(b.amount / b.people),
          note: `${b.name} tháng ${today().getMonth() + 1}`,
        },
      );
      break;
    }
    case "add-debt":
      debtForm();
      break;
    case "save-debt": {
      const person = val("d-person").trim();
      const amount = numv("d-amount");
      if (!person || !amount) {
        toast("Nhập tên và số tiền.");
        return;
      }
      state.debts.push({
        id: uid(),
        person,
        amount,
        dir: val("d-dir"),
        date: val("d-date") || iso(today()),
        note: val("d-note").trim(),
        settled: false,
      });
      dlg.close();
      commit();
      break;
    }
    case "settle": {
      const d = state.debts.find((x) => x.id === id);
      d.settled = !d.settled;
      commit();
      if (d.settled) toast("✅ Đã gạch nợ.");
      break;
    }
    case "del-debt":
      if (!confirm("Xóa khoản nợ này?")) break;
      state.debts = state.debts.filter((x) => x.id !== id);
      commit();
      break;
    case "remind": {
      const d = state.debts.find((x) => x.id === id);
      const m = d.username
        ? liveAccounts().find((a) => a.username === d.username)
        : matchAcc(d.person);
      textDlg(
        "Nhắc khéo",
        `Ê ${d.person} ơi, khoản ${money(d.amount)}${d.note ? ` (${d.note})` : ""} hôm ${fmtDate(d.date)} nhớ chuyển mình khi tiện nha 😄 Cảm ơn bạn!`,
        {
          to: m ? [m.username] : [],
          amount: d.amount,
          note: d.note,
          debtId: d.id,
        },
      );
      break;
    }
    case "msg-pick": {
      const f = $("#m-to");
      const cur = f.value.split(/[\s,;]+/).filter(Boolean);
      const u = "@" + el.dataset.u;
      if (!cur.includes(u)) cur.push(u);
      f.value = cur.join(", ");
      break;
    }
    case "msg-send":
      await sendInApp();
      break;
    case "smart-next":
      setSmartIdx(smartIdx + 1);
      render();
      break;
    case "smart-find":
      smartFind(id);
      break;
    case "smart-invite": {
      const m = smartMatches().find((x) => x.s.id === id);
      if (m)
        await sendInvites(
          m.s,
          m.friends.map((f) => f.acc.username),
        );
      break;
    }
    case "sf-toggle": {
      el.setAttribute(
        "aria-pressed",
        String(el.getAttribute("aria-pressed") !== "true"),
      );
      const s = state.subs.find(
        (x) =>
          x.id === dlg.querySelector('[data-act="sf-send"]').dataset.id,
      );
      sfSum(s);
      break;
    }
    case "sf-send": {
      const s = state.subs.find((x) => x.id === id);
      await sendInvites(s, sfSel());
      break;
    }
    case "sf-copy": {
      const s = state.subs.find((x) => x.id === id);
      const t = inviteText(s, Math.max(2, sfSel().length + 1));
      try {
        await navigator.clipboard.writeText(t);
        toast("Đã sao chép lời mời 📋");
      } catch (e) {
        textDlg("Lời mời ghép nhóm", t);
      }
      break;
    }
    case "invite-accept": {
      const m =
        (state.inbox || []).find((x) => x.id === id) ||
        Object.values(state.chats || {})
          .flat()
          .find((x) => x.id === id);
      if (m) await acceptInvite(m);
      break;
    }
    case "invite-decline":
      await declineInvite(id);
      break;
    case "chat-open":
      if (dlg.open) dlg.close();
      openChat(el.dataset.u);
      break;
    case "chat-back":
      setChatPeer(null);
      render();
      window.scrollTo(0, 0);
      break;
    case "chat-send":
      await chatSendText();
      break;
    case "chat-invite": {
      const subs = state.subs.filter((s) => !s.owner);
      openDlg(
        "Mời ghép gói",
        subs.length
          ? `<p class="sub m-0">Chọn gói muốn rủ @${esc(chatPeer)} ghép nhóm:</p><div>${subs.map((s) => `<button class="dev" data-act="chat-invite-go" data-id="${s.id}"><span class="av">${esc(initials(s.name))}</span><span class="dev-txt"><span class="who">${esc(s.name)}</span><span class="u">${money(monthly(s))}/tháng · ${(s.shareWith || []).length + (s.guests || []).length + 1} người đang dùng</span></span>${I.chev}</button>`).join("")}</div>`
          : `<div class="empty">Bạn chưa có gói nào để mời.</div>`,
        `<button class="btn" data-act="close">Huỷ</button>`,
      );
      break;
    }
    case "chat-invite-go": {
      const s = state.subs.find((x) => x.id === id);
      dlg.close();
      await sendInvites(s, [chatPeer]);
      render();
      scrollToEnd();
      break;
    }
    case "chat-remind":
      openDlg(
        "Nhắc khoản cần thu",
        `<label class="f">Số tiền (₫)<input id="cr-amt" class="money" type="text" inputmode="numeric" autocomplete="off" placeholder="50.000"></label><label class="f">Ghi chú<input id="cr-note" placeholder="Trà sữa, tiền điện…"></label><label class="check sm"><input type="checkbox" id="cr-log" checked> Ghi vào Mượn & Trả (cần thu)</label>`,
        `<button class="btn" data-act="close">Huỷ</button><button class="btn primary" data-act="chat-remind-go">${I.send} Gửi nhắc</button>`,
      );
      break;
    case "chat-remind-go": {
      const amt = numv("cr-amt");
      if (!amt) {
        toast("Nhập số tiền.");
        return;
      }
      const note = val("cr-note").trim();
      const a = liveAccounts().find((x) => x.username === chatPeer);
      const nm = a.displayName.split(" ").slice(-1)[0];
      if ($("#cr-log").checked)
        state.debts.push({
          id: uid(),
          person: nm,
          username: a.username,
          amount: amt,
          dir: "owed",
          note,
          date: iso(today()),
          settled: false,
        });
      dlg.close();
      await pushToAccount(a, {
        from: current.username,
        fromName: current.displayName,
        amount: amt,
        note,
        type: "remind",
        text: `Ê ${nm} ơi, khoản ${money(amt)}${note ? ` (${note})` : ""} nhớ chuyển mình khi tiện nha 😄`,
      });
      render();
      scrollToEnd();
      break;
    }
    case "chat-debt": {
      const u = el.dataset.u;
      const m = (state.chats?.[u] || []).find((x) => x.id === id);
      if (!m) break;
      const a = liveAccounts().find((x) => x.username === u);
      state.debts.push({
        id: uid(),
        person: (a?.displayName || u).split(" ").slice(-1)[0],
        username: u,
        amount: m.amount,
        dir: "owe",
        note: m.note || "Theo nhắc trong chat",
        date: iso(today()),
        settled: false,
      });
      m.status = "recorded";
      const ib = (state.inbox || []).find((x) => x.id === id);
      if (ib) ib.read = true;
      commit();
      toast("📒 Đã ghi vào Mượn & Trả (cần trả).");
      break;
    }
    case "msg-read": {
      const m = (state.inbox || []).find((x) => x.id === id);
      if (m) {
        m.read = true;
        commit();
        if (dlg.open) notifCenter();
      }
      break;
    }
    case "msg-debt": {
      const m = (state.inbox || []).find((x) => x.id === id);
      if (m) {
        m.read = true;
        const cm = (state.chats?.[m.from] || []).find((x) => x.id === id);
        if (cm) cm.status = "recorded";
        state.debts.push({
          id: uid(),
          person: m.fromName.split(" ").slice(-1)[0],
          username: m.from,
          amount: m.amount,
          dir: "owe",
          note: m.note || "Theo nhắc trong app",
          date: iso(today()),
          settled: false,
        });
        commit();
        if (dlg.open) notifCenter();
        toast("📒 Đã ghi vào Mượn & Trả (cần trả).");
      }
      break;
    }
    case "ics": {
      try {
        await caps.downloads.save({
          filename: "optisub-nhac-thanh-toan.ics",
          data: buildICS(),
        });
      } catch (e) {
        if (e?.code !== "declined" && e?.code !== "cancelled")
          toast("Chưa lưu được tệp lịch.");
      }
      break;
    }
    case "ask":
      setTab("ai");
      await sendChat(el.dataset.q);
      scrollToEnd();
      break;
    case "send": {
      const t = $("#chat-text");
      const q = t.value;
      t.value = "";
      await sendChat(q);
      break;
    }
    case "clear-chat":
      setChatLog([]);
      render();
      break;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.target.id === "chat-in" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatSendText();
    return;
  }
  if (e.target.id === "f-share-in" && e.key === "Enter") {
    e.preventDefault();
    shareAdd(e.target.value);
    return;
  }
  /* Enter trong ô nhập của hộp thoại = bấm nút chính (Lưu, Thêm, Gửi…) */
  if (
    e.key === "Enter" &&
    dlg.open &&
    e.target.tagName === "INPUT" &&
    e.target.type !== "checkbox" &&
    dlg.contains(e.target)
  ) {
    const btn = dlg.querySelector(".dlg-foot .btn.primary");
    if (btn) {
      e.preventDefault();
      btn.click();
    }
    return;
  }
  if (e.target.id === "chat-text" && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const q = e.target.value;
    e.target.value = "";
    sendChat(q);
  }
});

dlg.addEventListener("click", (e) => {
  if (e.target === dlg) dlg.close();
});

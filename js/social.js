import { notifCenter } from "./dialogs.js";
import { chatPush, chatSetStatus, monthly, svcKey } from "./domain.js";
import { I } from "./icons.js";
import { render } from "./render.js";
import { chatPeer, commit, current, liveAccounts, loadState, saveState, setChatPeer, setPeers, setTab, state, tab } from "./store.js";
import { dlg, openDlg, scrollToEnd, toast, val } from "./ui.js";
import { $, esc, money, normUser, uid } from "./utils.js";

export async function loadPeers() {
  const me = current;
  if (!me) return;
  const out = {};
  for (const a of liveAccounts())
    if (a.id !== me.id) out[a.username] = await loadState(a);
  if (current !== me) return;
  setPeers(out);
  if (tab === "overview") render();
}

export function inviteText(s, n) {
  return `Mình đang trả ${s.name} ${money(monthly(s))}/tháng. Ghép nhóm ${n} người thì mỗi người chỉ còn ${money(monthly(s) / n)}/tháng (giảm ${Math.round((1 - 1 / n) * 100)}%). Vào nhóm với mình nhé? 🙌`;
}

export async function sendInvites(s, users) {
  if (!users.length) {
    toast("Chọn ít nhất 1 người để mời.");
    return;
  }
  const n = Math.min(6, users.length + 1 + (s.shareWith || []).length);
  for (const u of users) {
    const a = liveAccounts().find((x) => x.username === u);
    if (a)
      await pushToAccount(a, {
        type: "invite",
        from: current.username,
        fromName: current.displayName,
        subId: s.id,
        svc: s.name,
        text: inviteText(s, n),
        amount: 0,
      });
  }
  s.invited = [...new Set([...(s.invited || []), ...users])];
  if (dlg.open) dlg.close();
  commit();
  toast(
    `📨 Đã gửi lời mời share ${s.name} tới ${users.map((u) => "@" + u).join(", ")}.`,
    5000,
  );
}

export async function acceptInvite(m) {
  const sender = liveAccounts().find((a) => a.username === m.from);
  if (!sender) {
    m.read = true;
    commit();
    return;
  }
  const sst = await loadState(sender);
  const s = sst.subs.find((x) => x.id === m.subId);
  if (!s) {
    m.read = true;
    commit();
    toast("Gói này không còn tồn tại.");
    return;
  }
  s.shareWith = [...new Set([...(s.shareWith || []), current.username])];
  s.sharedWith = s.shareWith.length + (s.guests || []).length + 1;
  s.payers = s.sharedWith;
  s.invited = (s.invited || []).filter((u) => u !== current.username);
  const notice = {
    id: uid() + uid(),
    at: Date.now(),
    type: "system",
    from: current.username,
    fromName: current.displayName,
    text: `${current.displayName.split(" ").slice(-1)[0]} đã đồng ý ghép nhóm ${s.name} · ${s.sharedWith} người, mỗi người ${money(monthly(s) / s.sharedWith)}/tháng`,
  };
  sst.inbox = [{ ...notice, read: false }, ...(sst.inbox || [])];
  chatSetStatus(sst, current.username, m.id, "accepted");
  chatPush(sst, current.username, notice);
  await saveState(sender, sst);
  chatSetStatus(state, sender.username, m.id, "accepted");
  chatPush(state, sender.username, notice);
  const members = [sender.username, ...s.shareWith];
  const k = svcKey(s.name);
  for (const u of s.shareWith) {
    const copy = {
      ...s,
      shareWith: members.filter((x) => x !== u),
      sharedBy: sender.displayName,
      owner: sender.username,
      invited: [],
    };
    if (u === current.username) {
      state.subs = state.subs.filter(
        (x) =>
          !(
            svcKey(x.name) === k &&
            !x.owner &&
            x.id !== s.id &&
            (x.payers || 1) <= 1
          ),
      );
      const i = state.subs.findIndex((x) => x.id === s.id);
      const prev = i >= 0 ? state.subs[i] : null;
      const c = {
        ...copy,
        usage: prev ? prev.usage : {},
        remind: prev ? prev.remind : 3,
      };
      if (i >= 0) state.subs[i] = c;
      else state.subs.push(c);
    } else {
      const acc = liveAccounts().find((a) => a.username === u);
      if (!acc) continue;
      const st = await loadState(acc);
      const i = st.subs.findIndex((x) => x.id === s.id);
      const prev = i >= 0 ? st.subs[i] : null;
      const c = {
        ...copy,
        usage: prev ? prev.usage : {},
        remind: prev ? prev.remind : 3,
      };
      if (i >= 0) st.subs[i] = c;
      else st.subs.push(c);
      await saveState(acc, st);
    }
  }
  const ib = (state.inbox || []).find((x) => x.id === m.id);
  if (ib) ib.read = true;
  m.read = true;
  commit();
  if (dlg.open) notifCenter();
  toast(
    `🎉 Đã vào nhóm ${s.name} cùng ${sender.displayName.split(" ").slice(-1)[0]}. Phần của bạn: ${money(monthly(s) / s.sharedWith)}/tháng.`,
    5000,
  );
  loadPeers();
}

export function openChat(u) {
  setChatPeer(u);
  setTab("chat");
  state.chatRead = { ...(state.chatRead || {}), [u]: Date.now() };
  (state.inbox || []).forEach((m) => {
    if (m.from === u && m.type !== "invite") m.read = true;
  });
  commit(false);
  render();
  scrollToEnd();
  refreshFromStore();
}

export async function chatSendText() {
  const f = $("#chat-in");
  const text = (f?.value || "").trim();
  if (!text || !chatPeer) return;
  const a = liveAccounts().find((x) => x.username === chatPeer);
  if (!a) return;
  f.value = "";
  await pushToAccount(a, {
    from: current.username,
    fromName: current.displayName,
    text,
    type: "text",
  });
  render();
  scrollToEnd();
}

export async function declineInvite(id) {
  const m =
    (state.inbox || []).find((x) => x.id === id) ||
    Object.values(state.chats || {})
      .flat()
      .find((x) => x.id === id);
  if (!m) return;
  const sender = liveAccounts().find((a) => a.username === m.from);
  const notice = {
    id: uid() + uid(),
    at: Date.now(),
    type: "system",
    from: current.username,
    fromName: current.displayName,
    text: `${current.displayName.split(" ").slice(-1)[0]} chưa tham gia ghép nhóm ${m.svc}`,
  };
  if (sender) {
    const sst = await loadState(sender);
    chatSetStatus(sst, current.username, id, "declined");
    chatPush(sst, current.username, notice);
    sst.inbox = [{ ...notice, read: false }, ...(sst.inbox || [])];
    const s = sst.subs.find((x) => x.id === m.subId);
    if (s)
      s.invited = (s.invited || []).filter((u) => u !== current.username);
    await saveState(sender, sst);
    chatSetStatus(state, sender.username, id, "declined");
    chatPush(state, sender.username, notice);
  }
  const ib = (state.inbox || []).find((x) => x.id === id);
  if (ib) ib.read = true;
  commit();
  if (dlg.open) notifCenter();
  toast("Đã từ chối lời mời.");
}

export async function refreshFromStore() {
  if (!current) return;
  const me = current;
  const fresh = await loadState(me);
  if (current !== me) return;
  let changed = false;
  for (const [u, list] of Object.entries(fresh.chats || {})) {
    state.chats = state.chats || {};
    const mine = (state.chats[u] = state.chats[u] || []);
    for (const x of list) {
      const y = mine.find((z) => z.id === x.id);
      if (!y) {
        mine.push(x);
        changed = true;
      } else if (
        x.status &&
        y.status !== x.status &&
        y.status !== "recorded"
      ) {
        y.status = x.status;
        changed = true;
      }
    }
    mine.sort((a, b) => a.at - b.at);
  }
  const ids = new Set((state.inbox || []).map((x) => x.id));
  const add = (fresh.inbox || []).filter((x) => !ids.has(x.id));
  if (add.length) {
    state.inbox = [...add, ...(state.inbox || [])].slice(0, 50);
    changed = true;
  }
  for (const fs of fresh.subs || []) {
    const i = state.subs.findIndex((x) => x.id === fs.id);
    if (i < 0 && fs.owner) {
      state.subs.push(fs);
      changed = true;
    } else if (
      i >= 0 &&
      JSON.stringify(state.subs[i].shareWith || []) !==
        JSON.stringify(fs.shareWith || [])
    ) {
      Object.assign(state.subs[i], {
        shareWith: fs.shareWith,
        sharedWith: fs.sharedWith,
        payers: fs.payers,
        invited: fs.invited,
      });
      changed = true;
    }
  }
  if (chatPeer)
    state.chatRead = {
      ...(state.chatRead || {}),
      [chatPeer]: Date.now(),
    };
  if (changed) {
    commit(false);
    render();
    if (chatPeer) scrollToEnd();
  }
}

export function textDlg(title, text, send) {
  msgCtx = send || null;
  const to = send ? (send.to || []).map((u) => "@" + u).join(", ") : "";
  const sug = liveAccounts()
    .filter((a) => a.id !== current.id)
    .slice(0, 6);
  openDlg(
    title,
    `<label class="f">Nội dung<textarea id="m-body" class="msg-body">${esc(text)}</textarea></label>
    ${
send
  ? `<label class="f">Gửi nhắc qua OptiSub <span class="hint">Nhập @id người dùng app (nhiều người cách nhau bằng dấu phẩy) — họ sẽ nhận thông báo ngay trong app</span><input id="m-to" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(to)}" placeholder="@tên_đăng_nhập"></label>
    <div class="sugs"><span class="hint">Gợi ý:</span>${sug.map((a) => `<button type="button" data-act="msg-pick" data-u="${esc(a.username)}">@${esc(a.username)}</button>`).join("")}</div>`
  : ""
    }`,
    `<button class="btn" data-act="close">Đóng</button><button class="btn ${send ? "" : "primary"}" data-act="copy-text">${I.copy} Sao chép</button>${send ? `<button class="btn primary" data-act="msg-send">${I.send} Gửi trong app</button>` : ""}`,
  );
}

export let msgCtx = null;

export function matchAcc(name) {
  const n = normUser(name).replace(/^@/, "");
  if (!n) return null;
  return (
    liveAccounts().find(
      (a) =>
        a.id !== current.id &&
        (a.username === n ||
          normUser(a.displayName) === n ||
          normUser(a.displayName).split(" ").pop() === n),
    ) || null
  );
}

/* Gửi tin nhắn vào hộp thư trong app của tài khoản khác */
export async function pushToAccount(acc, msg) {
  const full = {
    ...msg,
    id: uid() + uid(),
    at: Date.now(),
    type: msg.type || (msg.amount ? "remind" : "text"),
    status:
      msg.type === "invite" ? "pending" : msg.amount ? "open" : undefined,
  };
  const st = await loadState(acc);
  st.inbox = [{ ...full, read: false }, ...(st.inbox || [])].slice(0, 50);
  chatPush(st, msg.from, full);
  await saveState(acc, st);
  chatPush(state, acc.username, full);
  state.chatRead = {
    ...(state.chatRead || {}),
    [acc.username]: Date.now(),
  };
  commit(false);
  return full;
}

export async function sendInApp() {
  const raw = val("m-to")
    .split(/[\s,;]+/)
    .map((x) => x.replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean);
  if (!raw.length) {
    toast("Nhập @id của người nhận.");
    return;
  }
  const accs = [],
    bad = [];
  raw.forEach((u) => {
    const a = liveAccounts().find((x) => x.username === u);
    if (a && a.id !== current.id) {
      if (!accs.includes(a)) accs.push(a);
    } else bad.push(u);
  });
  if (bad.length) {
    toast(
      `Không tìm thấy tài khoản: ${bad.map((u) => "@" + u).join(", ")}`,
    );
    return;
  }
  const text = val("m-body").trim();
  if (!text) {
    toast("Nội dung đang trống.");
    return;
  }
  const ctx = msgCtx || {};
  for (const a of accs)
    await pushToAccount(a, {
      from: current.username,
      fromName: current.displayName,
      text,
      amount: ctx.amount || 0,
      note: ctx.note || "",
    });
  if (ctx.debtId) {
    const d = state.debts.find((x) => x.id === ctx.debtId);
    if (d) {
      d.username = accs[0].username;
      d.remindedAt = Date.now();
      commit(false);
    }
  }
  dlg.close();
  toast(
    `📨 Đã gửi nhắc tới ${accs.map((a) => "@" + a.username).join(", ")}. Họ sẽ thấy thông báo khi mở OptiSub.`,
    5000,
  );
}

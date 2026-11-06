import { chatUnread, pendingInvites } from "../domain.js";
import { I } from "../icons.js";
import { chatPeer, current, liveAccounts, state } from "../store.js";
import { esc, initials, isWide, money, timeTxt } from "../utils.js";

export function inviteCard(m) {
  return `<div class="inv"><div><div class="t h-ic">${I.handshake}${esc(m.fromName)} mời bạn ghép nhóm ${esc(m.svc)}</div><div class="d">${esc(m.text)}</div></div>
    <div class="row"><button class="btn primary" data-act="invite-accept" data-id="${m.id}">Đồng ý ghép</button><button class="btn" data-act="invite-decline" data-id="${m.id}">Từ chối</button></div></div>`;
}

export function msgHTML(m, peer) {
  const mine = m.from === current.username;
  const side = mine ? "me" : "them";
  const tm = `<time>${timeTxt(m.at)}</time>`;
  if (m.type === "system")
    return `<div class="sysmsg">${esc(m.text)} · ${timeTxt(m.at)}</div>`;
  if (m.type === "invite") {
    const st = m.status || "pending";
    const act =
      !mine && st === "pending"
        ? `<div class="row"><button class="btn sm primary" data-act="invite-accept" data-id="${m.id}">Đồng ý ghép</button><button class="btn sm" data-act="invite-decline" data-id="${m.id}">Từ chối</button></div>`
        : `<div class="bub-status"><span class="chip ${st === "accepted" ? "ok" : st === "declined" ? "kill" : "warn"}">${st === "accepted" ? `${I.check} Đã đồng ý` : st === "declined" ? "Đã từ chối" : `${I.trial} Đang chờ phản hồi`}</span></div>`;
    return `<div class="bub card ${side}"><div class="ct h-ic">${I.handshake}Lời mời ghép nhóm ${esc(m.svc || "")}</div>${esc(m.text)}${act}${tm}</div>`;
  }
  if (m.type === "remind") {
    const act = !mine
      ? m.status === "recorded"
        ? `<div class="bub-status"><span class="chip ok">${I.check} Đã ghi cần trả</span></div>`
        : `<div class="row"><button class="btn sm primary" data-act="chat-debt" data-id="${m.id}" data-u="${esc(peer)}">Ghi cần trả ${money(m.amount)}</button></div>`
      : "";
    return `<div class="bub card ${side}"><div class="ct h-ic">${I.cash}Nhắc khoản ${money(m.amount)}</div>${esc(m.text)}${act}${tm}</div>`;
  }
  return `<div class="bub ${side}">${esc(m.text)}${tm}</div>`;
}

/* Màn hình lớn: danh sách bạn bè và cuộc chat hiển thị song song */
export function viewChat() {
  if (isWide())
    return `<div class="chat-split"><aside class="chat-list">${chatListHTML()}</aside><section class="chat-pane">${chatPeer ? threadHTML() : `<div class="chat-empty">${I.chat}<p>Chọn một người bạn để bắt đầu trò chuyện</p></div>`}</section></div>`;
  return chatPeer ? threadHTML() : chatListHTML();
}

function threadHTML() {
  const others = liveAccounts().filter((a) => a.id !== current.id);
    const a = others.find((x) => x.username === chatPeer);
    const L = state.chats?.[chatPeer] || [];
    return `<div class="chat-head"><button class="back" data-act="chat-back" aria-label="Quay lại">${I.back}</button><span class="av">${esc(initials(a?.displayName || chatPeer))}</span><div><div class="who">${esc(a?.displayName || chatPeer)}</div><div class="u">@${esc(chatPeer)}</div></div></div>
<div class="thread" id="thread">${L.length ? L.map((m) => msgHTML(m, chatPeer)).join("") : `<div class="empty">Chưa có tin nhắn. Gửi lời chào, mời ghép gói hoặc nhắc khoản cần thu nhé.</div>`}</div>
<div class="compose"><div class="qa"><button class="btn soft sm" data-act="chat-invite">${I.handshake} Mời ghép gói</button><button class="btn soft sm" data-act="chat-remind">${I.cash} Nhắc khoản cần thu</button></div>
<div class="in"><textarea id="chat-in" rows="1" placeholder="Nhắn cho ${esc((a?.displayName || chatPeer).split(" ").slice(-1)[0])}…" aria-label="Tin nhắn"></textarea><button class="btn primary" data-act="chat-send" aria-label="Gửi">${I.send}</button></div></div>`;
}

function chatListHTML() {
  const others = liveAccounts().filter((a) => a.id !== current.id);
  const inv = pendingInvites();
  const rows = others
    .map((a) => {
      const L = state.chats?.[a.username] || [];
      const last = L[L.length - 1];
      return { a, last, un: chatUnread(a.username) };
    })
    .sort((x, y) => (y.last?.at || 0) - (x.last?.at || 0));
  return `${inv.length ? `<div class="sec-head"><h2>Lời mời ghép nhóm</h2></div><div class="list">${inv.map(inviteCard).join("")}</div>` : ""}
    <div class="sec-head"><div><h2>Tin nhắn</h2><p class="sub">Bạn bè đang dùng OptiSub</p></div></div>
    <div class="convs">${rows.map((r) => `<button class="conv ${r.un ? "unread" : ""}${r.a.username === chatPeer ? " active" : ""}" data-act="chat-open" data-u="${esc(r.a.username)}"><span class="av">${esc(initials(r.a.displayName))}</span><span class="mid"><span class="who">${esc(r.a.displayName)}</span><span class="last">${r.last ? (r.last.from === current.username ? "Bạn: " : "") + esc(r.last.type === "invite" ? "Lời mời ghép nhóm " + (r.last.svc || "") : r.last.type === "remind" ? "Nhắc khoản " + money(r.last.amount) : r.last.text) : "@" + esc(r.a.username) + " · bắt đầu trò chuyện"}</span></span><span class="side">${r.last ? timeTxt(r.last.at) : ""}${r.un ? `<span class="un">${r.un}</span>` : ""}</span></button>`).join("")}</div>`;
}

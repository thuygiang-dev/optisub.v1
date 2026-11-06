import { FAMILY, FAMILY_SVC, STATUS, STUDENT, SVC_KEYS } from "./content.js";
import { commit, current, liveAccounts, peers, state } from "./store.js";
import { addMonths, daysUntil, fmtDate, iso, money, monthKey, parseD, today, whenText, ym } from "./utils.js";

export const monthly = (s) => (s.cycle === "year" ? s.price / 12 : s.price);

export const myMonthly = (s) => monthly(s) / Math.max(1, s.payers || 1);

export const uses3 = (s) => [0, 1, 2].map((i) => s.usage?.[monthKey(i)]);

export function subStatus(s) {
  const u = uses3(s);
  if (s.trialEnd && daysUntil(s.trialEnd) >= 0) return "trial";
  if (u.every((x) => x === 0)) return "kill";
  const known = u.filter((x) => typeof x === "number");
  if (!known.length) return "unknown";
  const avg = known.reduce((a, b) => a + b, 0) / known.length;
  if (avg === 0) return "warn";
  return myMonthly(s) / avg >= 20000 || avg < 3 ? "warn" : "ok";
}

export function cpu(s) {
  const known = uses3(s).filter((x) => typeof x === "number");
  if (!known.length) return null;
  const avg = known.reduce((a, b) => a + b, 0) / known.length;
  return avg > 0 ? myMonthly(s) / avg : Infinity;
}

/* Roll past billing dates forward; convert finished trials */
export function rollForward() {
  let changed = false;
  const t = today();
  for (const s of state.subs) {
    if (s.trialEnd && daysUntil(s.trialEnd) < 0 && !s.trialConverted) {
      s.trialConverted = true;
      s.trialEndedOn = s.trialEnd;
      if (!s.nextBill || parseD(s.nextBill) < parseD(s.trialEnd))
        s.nextBill = s.trialEnd;
      s.trialEnd = "";
      changed = true;
    }
    if (s.nextBill) {
      let d = parseD(s.nextBill);
      let guard = 0;
      while (d < t && guard++ < 60) {
        d = s.cycle === "year" ? addMonths(d, 12) : addMonths(d, 1);
        changed = true;
      }
      s.nextBill = iso(d);
    }
  }
  if (changed) commit(false);
}

export function billDue(b) {
  const t = today();
  const key = ym(t);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  const thisDue = new Date(
    t.getFullYear(),
    t.getMonth(),
    Math.min(b.dueDay, last),
  );
  if (b.paid?.[key]) {
    const n = addMonths(new Date(t.getFullYear(), t.getMonth(), 1), 1);
    const nl = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    return {
      date: iso(
        new Date(n.getFullYear(), n.getMonth(), Math.min(b.dueDay, nl)),
      ),
      paidNow: true,
    };
  }
  return { date: iso(thisDue), paidNow: false };
}

export function tuitionPlan(x) {
  const left = Math.max(0, x.total - (x.saved || 0));
  const days = daysUntil(x.due);
  const months = Math.max(1, Math.ceil((days ?? 30) / 30.44));
  const perMonth = left <= 0 ? 0 : Math.ceil(left / months / 1000) * 1000;
  return {
    left,
    days,
    months,
    perMonth,
    pct: x.total ? Math.min(100, ((x.saved || 0) / x.total) * 100) : 0,
  };
}

export function events(horizon = 35) {
  const ev = [];
  for (const s of state.subs) {
    if (s.trialEnd)
      ev.push({
        date: s.trialEnd,
        kind: "trial",
        icon: "trial",
        title: `${s.name}: hết dùng thử`,
        desc: `Sau ngày này sẽ bị trừ ${money(s.price)} nếu không hủy`,
        amount: s.price,
        ref: s.id,
      });
    else if (s.nextBill)
      ev.push({
        date: s.nextBill,
        kind: "renew",
        icon: "renew",
        title: `${s.name}: gia hạn tự động`,
        desc:
          subStatus(s) === "kill"
            ? "Bạn gần như không dùng dịch vụ này — hủy trước ngày này"
            : `Kỳ ${s.cycle === "year" ? "năm" : "tháng"} mới`,
        amount: s.price,
        ref: s.id,
      });
  }
  for (const b of state.bills) {
    const d = billDue(b);
    ev.push({
      date: d.date,
      kind: "bill",
      icon: "house",
      title: `${b.name}`,
      desc: `Phần của bạn ${money(b.amount / Math.max(1, b.people))}${b.people > 1 ? ` · tổng ${money(b.amount)} chia ${b.people} người` : ""}`,
      amount: b.amount / Math.max(1, b.people),
      ref: b.id,
      paid: d.paidNow,
    });
  }
  for (const x of state.tuition) {
    const p = tuitionPlan(x);
    if (p.left > 0)
      ev.push({
        date: x.due,
        kind: "tuition",
        icon: "cap",
        title: `Hạn đóng ${x.name}`,
        desc: `Còn thiếu ${money(p.left)}`,
        amount: p.left,
        ref: x.id,
      });
  }
  return ev
    .map((e) => ({ ...e, n: daysUntil(e.date) }))
    .filter(
      (e) =>
        e.n !== null &&
        e.n <= horizon &&
        (e.n >= 0 || (e.kind === "bill" && !e.paid)),
    )
    .sort((a, b) => a.n - b.n);
}

export function alertsList() {
  const out = events(3)
    .filter((e) => !e.paid)
    .filter((e) => {
      if (e.kind !== "trial" && e.kind !== "renew") return true;
      const s = state.subs.find((x) => x.id === e.ref);
      const r = s ? (s.remind ?? 3) : 3;
      return r >= 0 && e.n <= r;
    })
    .map((e) => ({
      ...e,
      c:
        e.n < 0
          ? "var(--leak)"
          : e.kind === "trial"
            ? "var(--trial)"
            : "var(--warn)",
    }));
  for (const m of (state.inbox || [])
    .filter((x) => !x.read)
    .slice(0, 10)
    .reverse())
    out.unshift(
      m.type === "invite"
        ? {
            icon: "handshake",
            title: `${m.fromName} mời bạn ghép nhóm ${m.svc}`,
            desc: m.text,
            c: "var(--ok)",
            kind: "invite",
            ref: m.id,
          }
        : {
            icon: "msg",
            title:
              m.type === "remind" || m.amount
                ? `${m.fromName} nhắc bạn · ${money(m.amount)}`
                : `${m.fromName} nhắn cho bạn`,
            desc: m.text,
            c: "var(--trial)",
            kind: "msg",
            ref: m.id,
            amount: m.type === "remind" || m.amount ? m.amount : 0,
            from: m.from,
          },
    );
  for (const s of state.subs) {
    if (s.cancelTodo) {
      const dl = s.trialEnd || s.nextBill;
      out.unshift({
        icon: "scissors",
        title: `Nhớ hủy ${s.name}`,
        desc: dl
          ? `Hủy trước ${fmtDate(dl)} (${whenText(daysUntil(dl))}) để không bị trừ ${money(s.price)}.`
          : `Bạn đã đặt nhắc hủy gói này.`,
        c: "var(--leak)",
        kind: "todo",
        ref: s.id,
      });
    }
    if (
      s.prevPrice &&
      s.priceChangedAt &&
      Date.now() - s.priceChangedAt < 60 * 864e5 &&
      s.price > s.prevPrice
    ) {
      out.push({
        icon: "trend",
        title: `${s.name} đã tăng giá`,
        desc: `${money(s.prevPrice)} → ${money(s.price)} (+${Math.round((s.price / s.prevPrice - 1) * 100)}%). Một lý do tốt để xem lại gói này.`,
        c: "var(--muted)",
        kind: "price",
        ref: s.id,
        quiet: true,
      });
    }
    if (s.trialEndedOn && daysUntil(s.trialEndedOn) >= -5) {
      out.push({
        icon: "alert",
        title: `${s.name} đã hết dùng thử`,
        desc: `Có thể bạn đã bị trừ ${money(s.price)} vào ${fmtDate(s.trialEndedOn)}. Kiểm tra sao kê và hủy nếu không cần.`,
        c: "var(--leak)",
        kind: "trial-ended",
        ref: s.id,
      });
    }
  }
  return out;
}

export const match = (map, name) => {
  const n = name.toLowerCase();
  const k = Object.keys(map).find((k) => n.includes(k));
  return k ? map[k] : null;
};

export function tipFor(s) {
  const st = subStatus(s);
  if ((s.sharedWith || 1) > 1 && (s.payers || 1) <= 1) {
    const fam = match(FAMILY, s.name);
    return `${s.sharedWith} người đang dùng chung nhưng chỉ mình bạn trả. ${fam ? fam + " — " : ""}chia đều ra mỗi người chỉ khoảng ${money(monthly(s) / s.sharedWith)}/tháng.`;
  }
  if (st === "kill")
    return `3 tháng liền không mở app. Số tiền đã trả là chi phí chìm — không lấy lại được bằng cách tiếp tục trả. Cắt ngay tiết kiệm ${money(myMonthly(s) * 12)}/năm.`;
  const stu = match(STUDENT, s.name);
  if (st === "warn") {
    const c = cpu(s);
    return `Mỗi lần dùng tốn ${c === Infinity ? "—" : money(c)}. ${stu ? "Gợi ý: " + stu + "." : "Hạ xuống gói rẻ hơn hoặc chỉ đăng ký lại vào tháng thật sự cần."}`;
  }
  if (st === "trial")
    return `Đặt lịch hủy trước ${fmtDate(s.trialEnd)}. Dùng thử là cửa vào của hiệu ứng khóa chặt — quyết định từ bây giờ, đừng để thẻ tự quyết.`;
  if (s.cycle === "month" && st === "ok")
    return `Dùng đều đặn — nếu chắc dùng cả năm, gói năm thường rẻ hơn khoảng 15–20%.${stu ? " Ngoài ra " + stu + "." : ""}`;
  if (stu) return `${stu.charAt(0).toUpperCase() + stu.slice(1)}.`;
  return null;
}

export function tier() {
  const s = state.savedFromCancels || 0;
  if (s >= 300000) return { em: "🌳", name: "Cây Tiết Kiệm", next: null };
  if (s >= 100000)
    return { em: "🌿", name: "Chồi Tiết Kiệm", next: 300000 };
  return { em: "🌱", name: "Mầm Tiết Kiệm", next: 100000 };
}

/* Khoản đã tiết kiệm: gói đã cắt + phần giảm nhờ ghép nhóm dùng chung */
export function savings() {
  const cut = (state.cancelled || []).map((c) => ({
    name: c.name,
    amt: c.monthly || 0,
  }));
  const cutSum = cut.reduce((a, c) => a + c.amt, 0);
  const legacy = Math.max(0, (state.savedFromCancels || 0) - cutSum);
  const shared = state.subs
    .filter((s) => (s.payers || 1) > 1)
    .map((s) => ({
      name: s.name,
      full: monthly(s),
      mine: myMonthly(s),
      n: s.payers,
      amt: monthly(s) - myMonthly(s),
    }));
  const total = cutSum + legacy + shared.reduce((a, x) => a + x.amt, 0);
  const spend = state.subs.reduce((a, s) => a + myMonthly(s), 0);
  const pct = total > 0 ? Math.round((total / (spend + total)) * 100) : 0;
  return { cut, legacy, shared, total, spend, pct };
}

export const svcKey = (name) => {
  const n = String(name || "").toLowerCase();
  return SVC_KEYS.find((k) => n.includes(k)) || n.trim();
};

export function smartMatches() {
  const res = [];
  for (const s of state.subs) {
    const k = svcKey(s.name);
    if (
      !FAMILY_SVC[k] ||
      s.owner ||
      (s.payers || 1) > 1 ||
      (s.shareWith || []).length ||
      subStatus(s) === "kill"
    )
      continue;
    const friends = [];
    for (const a of liveAccounts()) {
      if (a.id === current.id) continue;
      const st = peers[a.username];
      if (!st) continue;
      const ps = st.subs.find(
        (x) =>
          svcKey(x.name) === k &&
          !x.owner &&
          (x.payers || 1) <= 1 &&
          !(x.shareWith || []).length,
      );
      if (ps) friends.push({ acc: a, price: monthly(ps) });
    }
    const n = friends.length ? Math.min(6, friends.length + 1) : 4;
    const P = monthly(s),
      per = P / n;
    res.push({
      s,
      k,
      friends,
      n,
      P,
      per,
      pct: Math.round((1 - 1 / n) * 100),
      save: P - per,
    });
  }
  return res.sort(
    (a, b) =>
      (b.friends.length > 0) - (a.friends.length > 0) || b.save - a.save,
  );
}

export function chatPush(st, peer, msg) {
  st.chats = st.chats || {};
  const L = (st.chats[peer] = st.chats[peer] || []);
  if (!L.some((x) => x.id === msg.id)) L.push(msg);
  if (L.length > 200) L.splice(0, L.length - 200);
}

export function chatSetStatus(st, peer, id, status) {
  const x = (st.chats?.[peer] || []).find((m) => m.id === id);
  if (x) x.status = status;
  const y = (st.inbox || []).find((m) => m.id === id);
  if (y && status !== "pending")
    y.read = y.read || peer !== y.from ? y.read : y.read;
}

export function chatUnread(u) {
  const last = (state.chatRead || {})[u] || 0;
  return (state.chats?.[u] || []).filter(
    (m) => m.from !== current.username && m.at > last,
  ).length;
}

export function chatUnreadTotal() {
  return Object.keys(state.chats || {}).reduce(
    (a, u) => a + chatUnread(u),
    0,
  );
}

export function pendingInvites() {
  return (state.inbox || []).filter(
    (m) => m.type === "invite" && !m.read,
  );
}

export function snapshot() {
  return {
    homNay: iso(today()),
    goiDangKy: state.subs.map((s) => ({
      ten: s.name,
      gia: s.price,
      chuKy: s.cycle === "year" ? "năm" : "tháng",
      phanBanTraMoiThang: Math.round(myMonthly(s)),
      soNguoiDungChung: s.sharedWith || 1,
      soNguoiCungTra: s.payers || 1,
      solanMo_thangNay_thangTruoc_2thangTruoc: uses3(s).map(
        (x) => x ?? "chưa nhập",
      ),
      chiPhiMoiLanDung: (() => {
        const c = cpu(s);
        return c === null
          ? "chưa đo"
          : c === Infinity
            ? "không dùng"
            : Math.round(c);
      })(),
      trangThai: STATUS[subStatus(s)].label,
      ngayGiaHan: s.nextBill || null,
      hetDungThu: s.trialEnd || null,
      giaCu: s.prevPrice || null,
    })),
    hocPhi: state.tuition.map((x) => {
      const p = tuitionPlan(x);
      return {
        ky: x.name,
        tong: x.total,
        daDeDanh: x.saved || 0,
        han: x.due,
        canDeDanhMoiThang: p.perMonth,
      };
    }),
    hoaDon: state.bills.map((b) => ({
      ten: b.name,
      tong: b.amount,
      soNguoi: b.people,
      phanCuaBan: Math.round(b.amount / Math.max(1, b.people)),
      hanNgay: b.dueDay,
      daTraThangNay: !!b.paid?.[ym(today())],
    })),
    no: state.debts
      .filter((d) => !d.settled)
      .map((d) => ({
        nguoi: d.person,
        soTien: d.amount,
        chieu: d.dir === "owe" ? "mình nợ" : "nợ mình",
        ghiChu: d.note,
      })),
  };
}

export function localAnalysis() {
  const subs = state.subs;
  const waste = subs
    .filter((s) => ["kill", "warn"].includes(subStatus(s)))
    .sort(
      (a, b) =>
        (cpu(b) ?? 0) - (cpu(a) ?? 0) || myMonthly(b) - myMonthly(a),
    )[0];
  const ev = events(7).filter((e) => !e.paid)[0];
  const lines = [];
  if (waste) {
    const c = cpu(waste);
    lines.push(
      `• Lãng phí nhất: ${waste.name} — ${money(myMonthly(waste))}/tháng mà ${c === Infinity ? "gần như không dùng" : `mỗi lần mở tốn ${money(c)}`}. Tiền đã trả là chi phí chìm, đừng để nó giữ chân bạn.`,
    );
  } else
    lines.push(
      `• Chưa thấy gói nào lãng phí rõ rệt. Chọn mức dùng mỗi tháng để số liệu chính xác hơn.`,
    );
  if (ev)
    lines.push(
      `• Sắp tới hạn: ${ev.title} (${fmtDate(ev.date)}, ${whenText(ev.n)}) — ${money(ev.amount)}.`,
    );
  else lines.push(`• Không có khoản nào tới hạn trong 7 ngày tới.`);
  const shared = subs.find(
    (s) => (s.sharedWith || 1) > 1 && (s.payers || 1) <= 1,
  );
  if (waste && subStatus(waste) === "kill")
    lines.push(
      `• Hành động: hủy ${waste.name} ngay hôm nay theo hướng dẫn trong OptiSub — tiết kiệm ${money(myMonthly(waste) * 12)}/năm.`,
    );
  else if (shared)
    lines.push(
      `• Hành động: rủ ${shared.sharedWith - 1} người đang dùng chung ${shared.name} góp tiền — phần bạn còn ${money(monthly(shared) / shared.sharedWith)}/tháng.`,
    );
  else if (waste)
    lines.push(
      `• Hành động: hạ ${waste.name} xuống gói rẻ hơn hoặc tạm dừng 1 tháng xem có nhớ không.`,
    );
  else {
    const t = state.tuition.map(tuitionPlan).find((p) => p.perMonth > 0);
    lines.push(
      t
        ? `• Hành động: chuyển ${money(t.perMonth)} vào quỹ học phí ngay khi nhận tiền tháng này.`
        : `• Hành động: đặt nhắc nhở lịch cho các ngày gia hạn để không bị trừ tiền bất ngờ.`,
    );
  }
  return lines.join("\n");
}

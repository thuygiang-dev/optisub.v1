import { commit, emptyState, state } from "./store.js";
import { toast } from "./ui.js";
import { addDays, addMonths, iso, monthKey, today, uid, ym } from "./utils.js";

export function seedState(kind) {
  const t = today();
  const d = (n) => iso(addDays(t, n));
  const u = (a, b, c) => {
    const o = {};
    [a, b, c].forEach((v, i) => {
      if (v !== undefined) o[monthKey(i)] = v;
    });
    return o;
  };
  const S = (name, price, o = {}) =>
    Object.assign(
      {
        id: uid(),
        name,
        price,
        cycle: "month",
        nextBill: "",
        trialEnd: "",
        sharedWith: 1,
        payers: 1,
        email: "",
        usage: {},
      },
      o,
    );
  const B = (name, amount, dueDay, people, roommates, paid) => ({
    id: uid(),
    name,
    amount,
    dueDay,
    people,
    roommates,
    paid: paid ? { [ym(t)]: true } : {},
  });
  const D = (person, amount, dir, note, ago) => ({
    id: uid(),
    person,
    amount,
    dir,
    note,
    date: d(-ago),
    settled: false,
  });
  const T = (name, total, saved, months) => ({
    id: uid(),
    name,
    total,
    saved,
    due: iso(addMonths(t, months)),
  });
  const base = Object.assign(emptyState(), { updatedAt: Date.now() });
  if (kind === 1)
    return Object.assign(base, {
      subs: [
        S("Netflix", 260000, { nextBill: d(2), usage: u(0, 0, 0) }),
        S("Spotify Premium", 59000, {
          nextBill: d(11),
          usage: u(48, 51, 46),
        }),
        S("YouTube Premium", 79000, {
          nextBill: d(6),
          sharedWith: 3,
          usage: u(30, 35, 28),
        }),
        S("FPT Play", 100000, { nextBill: d(19), usage: u(1, 0, 0) }),
      ],
      tuition: [T("Học kỳ 2, 2026–2027", 11800000, 1500000, 4)],
      bills: [
        B(
          "Tiền nhà",
          3600000,
          Math.min(28, t.getDate() + 2),
          2,
          "Hùng",
          false,
        ),
        B("Điện", 480000, 10, 2, "Hùng", true),
        B("Wifi", 200000, 15, 2, "Hùng", true),
      ],
      debts: [D("Hùng", 150000, "owed", "Pizza cuối tuần", 4)],
    });
  if (kind === 2)
    return Object.assign(base, {
      subs: [
        S("Canva Pro", 130000, { nextBill: d(9), usage: u(22, 25, 30) }),
        S("CapCut Pro", 249000, { trialEnd: d(1), usage: u(4) }),
        S("Adobe Lightroom", 129000, {
          nextBill: d(15),
          usage: u(0, 0, 0),
        }),
        S("ChatGPT Plus", 520000, { nextBill: d(23), usage: u(2, 1, 3) }),
      ],
      tuition: [T("Học kỳ 2, 2026–2027", 16500000, 6000000, 4)],
      bills: [B("Tiền phòng KTX", 1200000, 5, 1, "", false)],
      debts: [
        D("Thảo", 90000, "owe", "In poster đồ án", 2),
        D("Khoa", 60000, "owed", "Cà phê", 8),
      ],
      savedFromCancels: 120000,
    });
  if (kind === 3)
    return Object.assign(base, {
      subs: [
        S("Google One 100GB", 45000, {
          nextBill: d(14),
          usage: u(12, 10, 15),
        }),
        S("Duolingo Super", 1150000, {
          cycle: "year",
          nextBill: d(40),
          usage: u(27, 29, 30),
        }),
      ],
      tuition: [
        T("Học kỳ 2, 2026–2027", 9800000, 7200000, 3),
        T("Học kỳ hè 2027", 3200000, 0, 8),
      ],
      bills: [
        B(
          "Tiền nhà",
          2700000,
          Math.min(28, t.getDate() + 1),
          3,
          "Vy, Ngân",
          false,
        ),
        B("Điện nước", 540000, 12, 3, "Vy, Ngân", true),
      ],
      debts: [],
      savedFromCancels: 320000,
    });
  if (kind === 4)
    return Object.assign(base, {
      subs: [
        S("ChatGPT Plus", 520000, {
          nextBill: d(8),
          usage: u(60, 55, 58),
        }),
        S("GitHub Copilot", 260000, {
          nextBill: d(3),
          usage: u(40, 38, 41),
        }),
        S("iCloud+", 25000, {
          nextBill: d(17),
          usage: u(20, 20, 20),
          prevPrice: 19000,
          priceChangedAt: Date.now() - 6 * 864e5,
        }),
        S("Xbox Game Pass", 229000, {
          nextBill: d(2),
          usage: u(0, 0, 0),
        }),
        S("YouTube Premium", 79000, {
          nextBill: d(25),
          sharedWith: 4,
          usage: u(45, 40, 42),
        }),
      ],
      tuition: [T("Học kỳ 2, 2026–2027", 14000000, 3000000, 5)],
      bills: [
        B(
          "Tiền nhà",
          4000000,
          Math.min(28, t.getDate() + 3),
          4,
          "Long, Quân, Tú",
          false,
        ),
        B("Wifi", 250000, 15, 4, "Long, Quân, Tú", true),
      ],
      debts: [
        D("Quân", 200000, "owed", "Tiền điện tháng trước", 10),
        D("Long", 75000, "owe", "Bún bò", 1),
      ],
    });
  if (kind === 6)
    return Object.assign(base, {
      subs: [
        S("Microsoft 365", 1599000, {
          cycle: "year",
          nextBill: d(30),
          usage: u(15, 18, 20),
        }),
        S("Notion Plus", 250000, { nextBill: d(3), usage: u(0, 0, 0) }),
        S("Apple Music", 65000, { trialEnd: d(2), usage: u(9) }),
        S("Grab Unlimited", 39000, { nextBill: d(7), usage: u(6, 8, 5) }),
        S("Netflix", 220000, {
          nextBill: d(16),
          sharedWith: 3,
          usage: u(14, 10, 12),
        }),
      ],
      tuition: [T("Học kỳ 2, 2026–2027", 13200000, 4500000, 4)],
      bills: [
        B(
          "Tiền nhà",
          3000000,
          Math.min(28, t.getDate() + 4),
          2,
          "Tâm",
          false,
        ),
        B("Điện nước", 500000, 10, 2, "Tâm", true),
        B("Wifi", 180000, 20, 2, "Tâm", false),
      ],
      debts: [
        D("Tâm", 110000, "owed", "Đi chợ chung", 5),
        D("Hà", 50000, "owe", "Photo tài liệu", 2),
      ],
    });
  return Object.assign(base, {
    subs: [
      S("Spotify Premium", 59000, {
        nextBill: d(5),
        usage: u(70, 66, 72),
      }),
      S("Netflix", 220000, {
        nextBill: d(12),
        sharedWith: 4,
        payers: 4,
        usage: u(9, 12, 10),
      }),
      S("Shopee VIP", 29000, { nextBill: d(1), usage: u(0, 0, 0) }),
    ],
    tuition: [T("Học kỳ 2, 2026–2027", 12500000, 2000000, 4)],
    bills: [
      B(
        "Tiền nhà",
        4500000,
        Math.min(28, t.getDate() + 1),
        3,
        "Mai, Phương",
        false,
      ),
      B("Điện", 620000, 10, 3, "Mai, Phương", true),
      B("Nước", 150000, 10, 3, "Mai, Phương", true),
      B("Wifi", 220000, 15, 3, "Mai, Phương", false),
    ],
    debts: [
      D("Mai", 85000, "owed", "Trà sữa", 6),
      D("Phương", 120000, "owe", "Vé xem phim", 3),
      D("Mai", 40000, "owed", "Gửi xe", 2),
      D("Tuấn", 300000, "owe", "Mượn tiền đóng quỹ lớp", 12),
    ],
  });
}

export function seed() {
  const t = today();
  const d = (n) => iso(addDays(t, n));
  const u = (a, b, c) => ({
    [monthKey(0)]: a,
    [monthKey(1)]: b,
    [monthKey(2)]: c,
  });
  state.subs = [
    {
      id: uid(),
      name: "Netflix",
      price: 260000,
      cycle: "month",
      nextBill: d(2),
      trialEnd: "",
      sharedWith: 1,
      payers: 1,
      usage: u(0, 0, 0),
      email: "",
    },
    {
      id: uid(),
      name: "ChatGPT Plus",
      price: 520000,
      cycle: "month",
      nextBill: d(12),
      trialEnd: "",
      sharedWith: 1,
      payers: 1,
      usage: u(38, 52, 47),
      email: "",
    },
    {
      id: uid(),
      name: "Canva Pro",
      price: 130000,
      cycle: "month",
      nextBill: d(18),
      trialEnd: "",
      sharedWith: 1,
      payers: 1,
      usage: u(1, 0, 2),
      email: "",
    },
    {
      id: uid(),
      name: "YouTube Premium",
      price: 79000,
      cycle: "month",
      nextBill: d(9),
      trialEnd: "",
      sharedWith: 3,
      payers: 1,
      usage: u(40, 44, 39),
      email: "",
    },
    {
      id: uid(),
      name: "Spotify Premium",
      price: 59000,
      cycle: "month",
      nextBill: "",
      trialEnd: d(2),
      sharedWith: 1,
      payers: 1,
      usage: u(6, undefined, undefined),
      email: "",
    },
    {
      id: uid(),
      name: "iCloud+",
      price: 25000,
      cycle: "month",
      nextBill: d(21),
      trialEnd: "",
      sharedWith: 1,
      payers: 1,
      usage: u(20, 22, 25),
      email: "",
      prevPrice: 19000,
      priceChangedAt: Date.now() - 5 * 864e5,
    },
  ];
  state.subs.forEach((s) =>
    Object.keys(s.usage).forEach(
      (k) => s.usage[k] === undefined && delete s.usage[k],
    ),
  );
  state.tuition = [
    {
      id: uid(),
      name: "Học kỳ 2, 2026–2027",
      total: 12500000,
      saved: 2000000,
      due: iso(addMonths(t, 4)),
    },
  ];
  state.bills = [
    {
      id: uid(),
      name: "Tiền nhà",
      amount: 4500000,
      dueDay: Math.min(28, t.getDate() + 1),
      people: 3,
      roommates: "Minh, Lan",
      paid: {},
    },
    {
      id: uid(),
      name: "Điện",
      amount: 620000,
      dueDay: 10,
      people: 3,
      roommates: "Minh, Lan",
      paid: { [ym(t)]: true },
    },
    {
      id: uid(),
      name: "Wifi",
      amount: 220000,
      dueDay: 15,
      people: 3,
      roommates: "Minh, Lan",
      paid: { [ym(t)]: true },
    },
  ];
  state.debts = [
    {
      id: uid(),
      person: "Minh",
      amount: 85000,
      dir: "owed",
      note: "Trà sữa",
      date: d(-6),
      settled: false,
    },
    {
      id: uid(),
      person: "Lan",
      amount: 120000,
      dir: "owe",
      note: "Vé xem phim",
      date: d(-3),
      settled: false,
    },
  ];
  commit();
  toast("Đã nạp dữ liệu mẫu — thử bấm “Phân tích ngay” nhé ⚡");
}

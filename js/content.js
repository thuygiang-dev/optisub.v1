/* Danh sách tài khoản có sẵn. `id` là khoá dữ liệu trong localStorage — đừng đổi. */
export const ACCOUNTS = [
  { id: "demo-1", username: "giang.nguyen", displayName: "Nguyễn Thị Thuỳ Giang", kind: 1 },
  { id: "demo-2", username: "vy.tran", displayName: "Trần Phan Tường Vy", kind: 2 },
  { id: "demo-3", username: "nhi.tran", displayName: "Trần Mai Nhi", kind: 3 },
  { id: "demo-4", username: "quang.le", displayName: "Lê Văn Quang", kind: 4 },
  { id: "demo-5", username: "nam.huynh", displayName: "Huỳnh Ngọc Nguyễn Hải Nam", kind: 5 },
  { id: "demo-6", username: "minh.nguyen", displayName: "Nguyễn Trường Minh", kind: 6 },
];

export const STATUS = {
  ok: { label: "✅ Đáng tiền", cls: "ok" },
  warn: { label: "🤔 Cân nhắc", cls: "warn" },
  kill: { label: "✂️ Nên cắt", cls: "kill" },
  trial: { label: "⏳ Dùng thử", cls: "trial" },
  unknown: { label: "Chưa có dữ liệu", cls: "" },
};

/* Tips */
export const FAMILY = {
  spotify: "Spotify có gói Family/Duo",
  youtube: "YouTube Premium có gói Gia đình (tối đa 6 người)",
  netflix: "Netflix cho phép nhiều màn hình trên gói cao hơn",
  "google one": "Google One chia sẻ được với nhóm gia đình",
  icloud: "iCloud+ chia sẻ qua Chia sẻ trong gia đình",
  "apple music": "Apple Music có gói Gia đình",
  "microsoft 365": "Microsoft 365 Family dùng được cho 6 người",
  chatgpt: "ChatGPT có gói Business cho nhóm",
  canva: "Canva có gói Teams chia nhiều thành viên",
};

export const STUDENT = {
  spotify: "kiểm tra xem có gói Student cho sinh viên không",
  notion: "Notion có gói Education miễn phí với email trường (.edu)",
  github:
    "GitHub Student Developer Pack có Copilot miễn phí cho sinh viên đã xác minh",
  "microsoft 365":
    "nhiều trường cấp Microsoft 365 miễn phí qua email sinh viên — hỏi phòng CNTT",
  canva:
    "bản Canva miễn phí đã đủ cho phần lớn bài thuyết trình; kiểm tra xem trường có chương trình Canva Education không",
  "apple music": "Apple Music có gói Sinh viên giá giảm ở nhiều quốc gia",
  chatgpt: "nếu chỉ hỏi bài thỉnh thoảng, bản miễn phí có thể đã đủ",
  youtube: "YouTube Premium có gói Sinh viên ở một số quốc gia",
};

export const CANCEL = {
  netflix: [
    "Mở netflix.com trên trình duyệt và đăng nhập.",
    "Vào Tài khoản → Gói thành viên.",
    "Chọn “Hủy gói thành viên” và xác nhận.",
  ],
  spotify: [
    "Vào spotify.com/account trên trình duyệt (không hủy được trong app).",
    "Chọn Gói của bạn → Thay đổi gói.",
    "Kéo xuống phần Spotify Free → Hủy Premium.",
  ],
  youtube: [
    "Mở youtube.com/paid_memberships.",
    "Chọn YouTube Premium → Hủy kích hoạt.",
    "Xác nhận lý do và hoàn tất.",
  ],
  chatgpt: [
    "Mở chatgpt.com → ảnh đại diện → Cài đặt.",
    "Vào mục Tài khoản/Gói → Quản lý.",
    "Chọn Hủy gói. Nếu mua qua App Store/Google Play, hủy ở đó.",
  ],
  canva: [
    "Mở canva.com → Cài đặt → Thanh toán và gói.",
    "Chọn gói đang dùng → Hủy gói.",
    "Canva có thể mời tạm dừng — chọn hủy hẳn nếu đã quyết.",
  ],
  apple: [
    "iPhone: Cài đặt → [Tên bạn] → Đăng ký.",
    "Chọn dịch vụ → Hủy đăng ký.",
  ],
  google: [
    "Mở Google Play → ảnh đại diện → Thanh toán và gói thuê bao → Gói thuê bao.",
    "Chọn dịch vụ → Hủy gói thuê bao.",
  ],
};

export const GENERIC_CANCEL = [
  "Kiểm tra bạn đã đăng ký qua đâu: website, App Store hay Google Play — phải hủy đúng nơi đã trả tiền.",
  "Vào phần Tài khoản / Thanh toán / Gói đăng ký và chọn Hủy hoặc Tắt tự động gia hạn.",
  "Chụp màn hình trang xác nhận hủy để làm bằng chứng.",
  "Nếu không tìm thấy nút hủy, liên hệ bộ phận hỗ trợ ngay trong app hoặc website của dịch vụ.",
];

export const MINDSET = [
  "Chi phí chìm: tiền đã trả các tháng trước không quay lại dù bạn có dùng tiếp hay không. Câu hỏi đúng chỉ là: tháng tới có đáng trả tiếp không?",
  "Hiệu ứng khóa chặt: playlist, lịch sử, thiết kế đã lưu khiến bạn ngại rời đi. Hầu hết dịch vụ giữ dữ liệu một thời gian sau khi hủy — bạn luôn có thể quay lại khi thật cần.",
  "Bẫy “để đó lỡ cần”: nếu cần thật, đăng ký lại mất 2 phút. Trả tiền cho khả năng “có thể” là khoản rò rỉ đắt nhất.",
];

export const NAV = [
  ["overview", "Tổng quan", "home"],
  ["subs", "Gói", "card"],
  ["calendar", "Lịch", "cal"],
  ["student", "Sinh viên", "cap"],
  ["chat", "Bạn bè", "chat"],
];

export const PAGE = {
  subs: [
    "Quản lý các gói đăng ký",
    "Theo dõi chi phí, tần suất sử dụng và mức độ đáng tiền của từng gói.",
  ],
  calendar: [
    "Lịch thanh toán",
    "Nhắc trước 1–3 ngày, không bị trừ tiền oan",
  ],
  student: ["Ví sinh viên", "Học phí, chia tiền nhóm, mượn & trả"],
  chat: ["Bạn bè", "Trò chuyện, mời ghép gói và nhắc nợ"],
  ai: ["Hỏi OptiSub", "Cố vấn chi tiêu số của riêng bạn"],
};

export const FAMILY_SVC = {
  spotify: "Spotify Family/Duo",
  youtube: "YouTube Premium Gia đình",
  "apple music": "Apple Music Gia đình",
  icloud: "iCloud+ Chia sẻ trong gia đình",
  "google one": "Google One nhóm gia đình",
  "microsoft 365": "Microsoft 365 Family",
  duolingo: "Duolingo Family",
  netflix: "Netflix",
  canva: "Canva Teams",
};

export const SVC_KEYS = [
  "apple music",
  "google one",
  "microsoft 365",
  "github copilot",
  "fpt play",
  "netflix",
  "spotify",
  "youtube",
  "chatgpt",
  "canva",
  "icloud",
  "notion",
  "duolingo",
  "capcut",
  "xbox",
  "grab",
  "shopee",
  "adobe",
];

export const FREQ = [
  [0, "Không dùng"],
  [3, "Ít"],
  [10, "Hằng tuần"],
  [30, "Hằng ngày"],
];

export const PERSONA = `Bạn là OptiSub — trợ lý tài chính cá nhân cho học sinh, sinh viên Việt Nam, chuyên về kinh tế học hành vi và tối ưu chi tiêu số. Giọng: thân thiện, thực tế, thẳng thắn nhưng thấu hiểu, như một cố vấn tài chính tận tâm. Khi phù hợp, nhắc đến chi phí chìm (sunk cost fallacy) và hiệu ứng khóa chặt (lock-in effect) để giúp người dùng quyết định cắt giảm dứt khoát. Luôn kèm gợi ý tối ưu chi phí cụ thể (gói gia đình/dùng chung, gói sinh viên, gói năm, bản miễn phí). Dùng emoji vừa phải. Tiền tệ là VND, viết dạng 59.000 ₫. Không bịa giá dịch vụ; chỉ dựa vào dữ liệu được cung cấp. Không dùng markdown đậm hay tiêu đề.`;

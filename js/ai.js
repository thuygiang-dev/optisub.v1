import { PERSONA } from "./content.js";
import { localAnalysis, snapshot } from "./domain.js";
import { render } from "./render.js";
import { analysis, caps, chatLog, current, setAnalysis } from "./store.js";
import { scrollToEnd } from "./ui.js";
import { $ } from "./utils.js";

/* Địa chỉ proxy AI (Vercel Function / Cloudflare Worker giữ API key Gemini).
   Để trống: "Phân tích ngay" chạy bằng bộ quy tắc có sẵn, trợ lý chat ẩn đi. */
export const AI_ENDPOINT = "";

/* Proxy nhận {messages:[{role, content}]} và trả {text} */
export async function aiSample(input) {
  const messages =
    typeof input === "string" ? [{ role: "user", content: input }] : input;
  const res = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok)
    throw {
      code:
        res.status === 429
          ? "rate_limited"
          : res.status === 401 || res.status === 403
            ? "not_granted"
            : "error",
    };
  const data = await res.json();
  if (!data.text) throw { code: "error" };
  return { text: data.text };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Cuộn tới khung kết quả để người dùng thấy ngay phản hồi */
function revealAnalysis() {
  requestAnimationFrame(() =>
    $("#ai-box")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    }),
  );
}

export async function runAnalysis() {
  if (analysis?.loading) return;
  const me = current;
  setAnalysis({ loading: true });
  render();
  revealAnalysis();
  if (!caps.sample) {
    await wait(600);
    if (current !== me) return;
    setAnalysis({
      text: localAnalysis(),
      src: "Phân tích nhanh bằng bộ quy tắc của OptiSub",
    });
    render();
    revealAnalysis();
    return;
  }
  const prompt = `${PERSONA}\n\nNhiệm vụ “Phân tích ngay”: quét nhanh dữ liệu dưới đây và trả lời ĐÚNG 3 dòng, mỗi dòng bắt đầu bằng “• ”, mỗi dòng tối đa 40 từ, không thêm lời mở đầu hay kết luận.\nDòng 1: khoản đang lãng phí nhất (nêu tên và số tiền, chi phí mỗi lần dùng).\nDòng 2: khoản sắp tới hạn gần nhất (ngày, số tiền).\nDòng 3: một hành động cụ thể nên làm ngay hôm nay.\n\nDỮ LIỆU (JSON):\n${JSON.stringify(snapshot())}`;
  try {
    const r = await Promise.race([
      caps.sample(prompt, { modelTier: "quick" }),
      new Promise((_, rej) =>
        setTimeout(() => rej({ code: "timeout" }), 15000),
      ),
    ]);
    setAnalysis({ text: r.text.trim(), src: "Phân tích bởi OptiSub" });
  } catch (e) {
    setAnalysis({
      text: localAnalysis(),
      src:
        e?.code === "not_granted"
          ? "Trợ lý AI chưa sẵn sàng — dùng bộ quy tắc của OptiSub"
          : "Chưa phân tích chi tiết được lúc này — dùng bộ quy tắc của OptiSub",
    });
  }
  if (current !== me) return;
  render();
  revealAnalysis();
}

export let chatBusy = false;

export async function sendChat(q) {
  if (!q.trim() || chatBusy || !caps.sample) return;
  chatBusy = true;
  chatLog.push({ role: "user", content: q.trim() });
  chatLog.push({ role: "assistant", content: "Đang suy nghĩ…" });
  render();
  scrollToEnd();
  const turns = chatLog.slice(0, -1).slice(-10);
  const ctx = `${PERSONA}\nNếu người dùng nói “Phân tích ngay”: chỉ ra khoản lãng phí nhất, khoản sắp tới hạn và lời khuyên hành động, đúng 3 gạch đầu dòng ngắn. Các câu khác: trả lời ngắn gọn, trực quan, tối đa ~150 từ.\n\nDỮ LIỆU HIỆN TẠI CỦA NGƯỜI DÙNG (JSON):\n${JSON.stringify(snapshot())}\n\nTin nhắn của người dùng: `;
  const input = turns.map((m, i) =>
    i === turns.length - 1
      ? { role: "user", content: ctx + m.content }
      : m,
  );
  if (input[0].role !== "user") input.shift();
  try {
    const r = await caps.sample(input, {
      cache: false,
      onText: ({ text }) => {
        chatLog[chatLog.length - 1].content = text;
        const msgs = document.querySelectorAll("#chat .msg.a");
        const last = msgs[msgs.length - 1];
        if (last) last.textContent = text;
      },
    });
    chatLog[chatLog.length - 1].content = r.text.trim();
  } catch (e) {
    chatLog[chatLog.length - 1].content =
      e?.code === "not_granted"
        ? "Trợ lý AI chưa sẵn sàng. Thử lại sau nhé."
        : e?.code === "rate_limited"
          ? "Hỏi hơi nhanh rồi — đợi một chút rồi thử lại nhé."
          : "Không kết nối được trợ lý. Thử lại sau ít phút.";
  }
  chatBusy = false;
  render();
  scrollToEnd();
}

# OptiSub

Cố vấn chi tiêu số cho sinh viên: theo dõi gói đăng ký, học phí, khoản chia chung và nợ bạn bè.

Trang chạy tại: https://thuygiang-dev.github.io/optisub.v1/

## Chạy trên máy

Không cần cài đặt hay build. Vì code dùng ES module nên phải mở qua một web server (mở file trực tiếp bằng `file://` sẽ không chạy):

```sh
python3 -m http.server 8000
# trang giới thiệu: http://localhost:8000 — ứng dụng: http://localhost:8000/app/
```

## Deploy

Push lên nhánh `main` là GitHub Pages tự cập nhật (Settings → Pages → Deploy from a branch, `main` / root). File `.nojekyll` giúp Pages phục vụ file nguyên trạng, không qua Jekyll.

## Cấu trúc & đường dẫn

```
index.html              trang giới thiệu (landing) — link chính thuygiang-dev.github.io/optisub.v1/
app/index.html          ứng dụng: màn chọn tài khoản            → …/app/
app/tong-quan/          Tổng quan                               → …/app/tong-quan/
app/goi/                Gói đăng ký                             → …/app/goi/
app/lich/               Lịch thanh toán                         → …/app/lich/
app/sinh-vien/hoc-phi/  Học phí (chia-tien/, muon-tra/ tương tự) → …/app/sinh-vien/hoc-phi/
app/ban-be/             Bạn bè (chat với một người: ?u=tên_đăng_nhập)
gioi-thieu/             chuyển hướng về trang chủ (giữ link cũ)
manifest.webmanifest    cài lên màn hình chính (mở thẳng app/)
css/                    tokens → base → header → components → overlays → features → responsive → utilities
                        responsive.css: tablet ≥ 768px, desktop ≥ 1100px
js/main.js              khởi động, mở đúng màn theo URL, xử lý Back/Forward
js/router.js            ánh xạ màn ↔ URL, cập nhật thanh địa chỉ và tiêu đề tab
js/store.js             trạng thái dùng chung + lưu localStorage (nhớ tài khoản đang dùng)
js/domain.js            tính toán: chi phí, trạng thái gói, lịch, cảnh báo, phân tích
js/content.js           dữ liệu tĩnh: tài khoản, mẹo, hướng dẫn hủy, menu
js/seed.js              dữ liệu ban đầu cho từng tài khoản
js/render.js            header, thanh điều hướng, màn chọn tài khoản
js/views/               các màn: tổng quan, gói, lịch, sinh viên, bạn bè, trợ lý
js/dialogs.js           hộp thoại (tài khoản, hủy gói, học phí, khoản chia, nợ…)
js/settings.js          Cài đặt: giao diện sáng/tối, ẩn số tiền, đặt lại ứng dụng
js/sub-form.js          form thêm/sửa gói và dùng chung
js/social.js            ghép nhóm, chat, nhắc nợ giữa các tài khoản
js/actions.js           xử lý click/phím (data-act)
js/ai.js, js/ics.js     trợ lý AI, xuất lịch nhắc .ics
assets/                 icon, poster (poster.html là nguồn của poster.png)
scripts/build-pages.py  tạo index.html cho từng đường dẫn của app
```

Mỗi đường dẫn của app là một thư mục có `index.html` thật (GitHub Pages là host tĩnh, cần tệp thật thì tải lại trang mới không bị 404). Các tệp đó được sinh từ `app/index.html`: **sửa `app/index.html` xong thì chạy `python3 scripts/build-pages.py`**. Thêm màn mới thì thêm đường dẫn vào cả `js/router.js` lẫn `scripts/build-pages.py`.

Dữ liệu mỗi tài khoản lưu trong `localStorage` của trình duyệt với khoá `optisub.v1.<id>`. Đừng đổi `id` trong `js/content.js` nếu không muốn mất dữ liệu đã lưu.

## Trợ lý AI (Gemini)

Hiện "Phân tích ngay" chạy bằng bộ quy tắc có sẵn. Để bật Gemini mà không lộ API key:

1. Dựng một proxy (Vercel Function hoặc Cloudflare Worker) giữ `GEMINI_API_KEY` trong biến môi trường. Proxy nhận `POST {messages:[{role, content}]}` và trả `{text}`.
2. Điền URL proxy vào `AI_ENDPOINT` trong `js/ai.js`.

Không đặt API key trực tiếp trong code — trang công khai trên GitHub nên ai cũng xem được.

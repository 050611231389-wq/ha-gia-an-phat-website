# Hà Gia An Phát Website V4

Website production-ready gồm frontend + API nhận lead.

## Chức năng
- Form đăng ký tư vấn/đối tác gửi `POST /api/leads`.
- Lead được lưu dự phòng tại `data/leads.jsonl` trên server.
- Gửi email lead về `manhhung208@gmail.com` qua Gmail SMTP khi cấu hình biến môi trường.
- Nút Zalo nổi trỏ tới số 0972 667 378.
- Có `CRM_WEBHOOK_URL` để kết nối CRM/Make/Zapier/n8n về sau mà không cần sửa frontend.
- Rate limit, honeypot chống bot cơ bản, validation phía server.

## Chạy thử
1. Cài Node.js 18+.
2. Trong thư mục dự án: `npm install`
3. Sao chép `.env.example` thành `.env`.
4. Điền `SMTP_USER` và `SMTP_PASS`.
5. Chạy `npm start` rồi mở `http://localhost:3000`.

## Gmail
Không dùng mật khẩu Gmail chính. Bật xác minh 2 bước cho tài khoản gửi, sau đó tạo **App Password** của Google và đặt giá trị đó vào `SMTP_PASS`. Không đưa `.env` lên GitHub.

## Triển khai
Có thể deploy Node.js project này lên Render, Railway, VPS hoặc dịch vụ tương đương. Domain trỏ về hosting và bật HTTPS.

## CRM sau này
Khi có CRM, đặt endpoint nhận lead vào `CRM_WEBHOOK_URL`. API hiện tại sẽ gửi JSON lead sang webhook đó sau khi lưu và gửi email.

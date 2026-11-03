# AI EDITOR

Landing page + trang thành viên + trang quản trị, chạy trên Cloudflare Pages.

- `src/` — React (Vite). `/` landing, `/account` trang thành viên, `/admin` quản trị.
- `functions/api/` — Pages Functions (API). Logic dùng chung ở `server/`.
- `shared/config.js` — giá bán, mã đơn; frontend và API cùng đọc.
- `migrations/` — schema D1.

## Luồng mua hàng

1. Khách bấm "Nhận Slot Beta" → đăng nhập Google → nhập tên + kênh liên hệ.
2. API tạo đơn `AExxxxxx` (giá do server quyết định) và một link thanh toán payOS riêng cho đơn → modal hiện QR, số tài khoản, nội dung chuyển khoản (chính là mã đơn).
3. payOS gọi `POST /api/webhooks/payos` (có chữ ký HMAC) → đủ tiền → đơn `paid`. Modal checkout tự chuyển sang "Thanh toán thành công". Khi khách bấm "Tôi đã chuyển khoản", server còn hỏi thẳng payOS phòng khi webhook bị lỡ.
4. Khách vào `/account`: tải file Skill, hướng dẫn cài đặt, changelog, link nhóm Zalo/Discord.
5. Thanh toán không khớp đơn (chuyển thiếu, đơn đã huỷ, link thử) nằm ở `/admin` → "Giao dịch chưa khớp" để gắn tay vào đơn.

## Chạy local

```bash
npm install
cp .dev.vars.example .dev.vars   # sửa ADMIN_EMAILS
npm run db:migrate:local
npm run dev:api                  # API trên :8788
npm run dev                      # Vite trên :5173, proxy /api → :8788
```

Với `DEV_LOGIN=1`, trang đăng nhập có ô "Dev login" để vào bằng email bất kỳ mà không cần Google (chỉ có trong bản dev, chỉ chạy trên localhost).

Với `PAYOS_MOCK=1`, link thanh toán payOS là giả (QR hiện được nhưng không quét trả tiền được). Giả lập payOS báo tiền về, với `<payosOrderCode>` là `order.payment.orderCode`:

```bash
node scripts/simulate-payos-webhook.mjs <payosOrderCode> 349000
```

## Deploy lần đầu

1. **D1 + R2**
   ```bash
   npx wrangler d1 create ai-editor               # chép database_id vào wrangler.toml
   npx wrangler r2 bucket create ai-editor-files
   npm run db:migrate:remote
   ```
2. **Google OAuth** — Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application).
   Authorized redirect URIs: `https://<domain>/api/auth/google/callback` và `http://localhost:5173/api/auth/google/callback`.
3. **payOS** — tại my.payos.vn tạo kênh thanh toán gắn tài khoản ngân hàng nhận tiền, lấy Client ID, API Key, Checksum Key.
4. **Biến môi trường** — sửa `[vars]` trong `wrangler.toml` (ADMIN_EMAILS, link nhóm), rồi đặt secret:
   ```bash
   npx wrangler pages secret put GOOGLE_CLIENT_ID
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET
   npx wrangler pages secret put PAYOS_CLIENT_ID
   npx wrangler pages secret put PAYOS_API_KEY
   npx wrangler pages secret put PAYOS_CHECKSUM_KEY
   ```
5. `npm run deploy`.
6. Vào `/admin` → "Thử payOS" → **Đăng ký webhook với payOS**, rồi tạo một link thử nhỏ để kiểm tra; sau đó "Phiên bản" để tải file Skill đầu tiên lên.

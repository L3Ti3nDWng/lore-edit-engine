# AI EDITOR

Landing page + trang thành viên + trang quản trị, chạy trên Cloudflare Pages.

- `src/` — React (Vite). `/` landing, `/account` trang thành viên, `/admin` quản trị.
- `functions/api/` — Pages Functions (API). Logic dùng chung ở `server/`.
- `shared/config.js` — giá bán, mã đơn; frontend và API cùng đọc.
- `migrations/` — schema D1.

## Luồng mua hàng

1. Khách bấm "Nhận Slot Beta" → đăng nhập Google → nhập tên + kênh liên hệ.
2. API tạo đơn `AExxxxxx` (giá do server quyết định) → khách chuyển khoản với nội dung `AIEDITOR BETA AExxxxxx`.
3. SePay gọi `POST /api/webhooks/sepay` → khớp mã đơn + đủ tiền → đơn `paid`. Modal checkout tự chuyển sang "Thanh toán thành công".
4. Khách vào `/account`: tải file Skill, hướng dẫn cài đặt, changelog, link nhóm Zalo/Discord.
5. Giao dịch không khớp (ghi sai nội dung, chuyển thiếu) nằm ở `/admin` → "Giao dịch chưa khớp" để gắn tay vào đơn.

## Chạy local

```bash
npm install
cp .dev.vars.example .dev.vars   # sửa ADMIN_EMAILS
npm run db:migrate:local
npm run dev:api                  # API trên :8788
npm run dev                      # Vite trên :5173, proxy /api → :8788
```

Với `DEV_LOGIN=1`, trang đăng nhập có ô "Dev login" để vào bằng email bất kỳ mà không cần Google (chỉ có trong bản dev, chỉ chạy trên localhost).

Giả lập SePay báo tiền về:

```bash
curl -H 'Content-Type: application/json' -H 'Authorization: Apikey local-sepay-key' \
  -d '{"id":1,"gateway":"MBBank","content":"AIEDITOR BETA AEXXXXXX","transferType":"in","transferAmount":349000}' \
  http://localhost:8788/api/webhooks/sepay
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
3. **SePay** — Tích hợp → Webhooks → URL `https://<domain>/api/webhooks/sepay`, kiểu chứng thực "API Key", chỉ nhận giao dịch tiền vào. Ghi lại API key.
4. **Biến môi trường** — sửa `[vars]` trong `wrangler.toml` (ADMIN_EMAILS, link nhóm), rồi đặt secret:
   ```bash
   npx wrangler pages secret put GOOGLE_CLIENT_ID
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET
   npx wrangler pages secret put SEPAY_API_KEY
   ```
5. **Tài khoản nhận tiền** — điền `PAYMENT_CONFIG` trong `src/App.jsx` để hiện mã VietQR.
6. `npm run deploy`, rồi vào `/admin` → "Phiên bản" để tải file Skill đầu tiên lên.

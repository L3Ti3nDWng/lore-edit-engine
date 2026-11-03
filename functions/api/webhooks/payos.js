import { HttpError, json } from '../../../server/http.js';
import { applyPayosPayment, verifyWebhookSignature } from '../../../server/payos.js';

// payOS calls this for every completed payment (https://payos.vn/docs/du-lieu-tra-ve/webhook/).
// Register it once from /admin → "Thử payOS" → "Đăng ký webhook" (or in my.payos.vn).
export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!(await verifyWebhookSignature(env, body))) throw new HttpError(401, 'invalid_signature', 'Chữ ký payOS không hợp lệ.');

  const { data } = body;
  // The sample payOS sends while confirming the webhook URL; acknowledge without storing it.
  if (Number(data.orderCode) === 123 && data.description === 'VQRIO123') return json({ success: true });
  if (body.success !== false && data.code === '00') await applyPayosPayment(env, data);
  return json({ success: true });
}

import { HttpError, json, readJson } from '../../../server/http.js';
import { siteOrigin } from '../../../server/orders.js';
import {
  PAYOS_GATEWAY,
  cancelPaymentLink,
  confirmWebhook,
  createPaymentLink,
  getPaymentLink,
  isMock,
  newPayosOrderCode,
} from '../../../server/payos.js';

// GET: which payOS credentials are set, and when the last payOS webhook arrived.
export async function onRequestGet({ env, request }) {
  const last = await env.DB.prepare('SELECT amount, content, created_at FROM transactions WHERE gateway = ? ORDER BY created_at DESC LIMIT 1')
    .bind(PAYOS_GATEWAY)
    .first();
  return json({
    mock: isMock(env),
    keys: { clientId: Boolean(env.PAYOS_CLIENT_ID), apiKey: Boolean(env.PAYOS_API_KEY), checksumKey: Boolean(env.PAYOS_CHECKSUM_KEY) },
    webhookUrl: `${siteOrigin(env, request)}/api/webhooks/payos`,
    lastWebhook: last ? { amount: last.amount, description: last.content, receivedAt: last.created_at } : null,
  });
}

// POST { action, ... }
//   confirm-webhook                 register this site's webhook URL with payOS
//   create-test { amount, description }  real payOS link not tied to any order
//   status { orderCode } / cancel { orderCode }
export async function onRequestPost({ env, request }) {
  const body = await readJson(request);
  const origin = siteOrigin(env, request);

  if (body.action === 'confirm-webhook') {
    return json({ result: await confirmWebhook(env, `${origin}/api/webhooks/payos`) });
  }
  if (body.action === 'create-test') {
    const amount = Math.round(Number(body.amount));
    const description = String(body.description || '').trim();
    if (!Number.isFinite(amount) || amount < 1000 || amount > 500000000) throw new HttpError(400, 'invalid_amount', 'Số tiền từ 1.000đ đến 500.000.000đ.');
    if (!description || description.length > 25) throw new HttpError(400, 'invalid_description', 'Nội dung từ 1 đến 25 ký tự.');
    const link = await createPaymentLink(env, {
      orderCode: newPayosOrderCode(),
      amount,
      description,
      returnUrl: `${origin}/admin?payos=done`,
      cancelUrl: `${origin}/admin?payos=cancelled`,
    });
    return json({ link });
  }
  const orderCode = Number(body.orderCode);
  if (!Number.isSafeInteger(orderCode) || orderCode <= 0) throw new HttpError(400, 'invalid_order_code', 'Mã payOS không hợp lệ.');
  if (body.action === 'status') return json({ info: await getPaymentLink(env, orderCode) });
  if (body.action === 'cancel') return json({ info: await cancelPaymentLink(env, orderCode, 'Huỷ link thử từ trang quản trị') });
  throw new HttpError(400, 'invalid_action');
}

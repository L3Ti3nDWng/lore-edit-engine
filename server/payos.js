import { HttpError, now } from './http.js';

// payOS merchant API (https://payos.vn/docs/api/). Credentials come from the payOS
// payment channel: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY.
// PAYOS_MOCK=1 (local only) fakes payment links so checkout works without real keys.

const BASE = 'https://api-merchant.payos.vn';
export const PAYOS_GATEWAY = 'payOS';
const LINK_TTL_SECONDS = 24 * 60 * 60;

// Common VietQR bank BINs, to name the bank next to the QR.
const BANK_NAMES = {
  970416: 'ACB',
  970422: 'MB Bank',
  970436: 'Vietcombank',
  970407: 'Techcombank',
  970415: 'VietinBank',
  970418: 'BIDV',
  970432: 'VPBank',
  970423: 'TPBank',
  970403: 'Sacombank',
  970448: 'OCB',
  970405: 'Agribank',
  970443: 'SHB',
  970437: 'HDBank',
  970426: 'MSB',
  970441: 'VIB',
  970452: 'KienlongBank',
};

export const isMock = (env) => env.PAYOS_MOCK === '1';
export const payosConfigured = (env) => isMock(env) || Boolean(env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && env.PAYOS_CHECKSUM_KEY);

async function hmacHex(key, message) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Webhook/response data signature, matching the official @payos/node SDK: top-level keys
// sorted, `key=value` joined with `&`, null-ish → "", arrays JSON-encoded, no URL encoding.
export function signatureString(data) {
  return Object.keys(data)
    .filter((k) => data[k] !== undefined)
    .sort()
    .map((k) => {
      let v = data[k];
      if (v === null || v === 'null' || v === 'undefined') v = '';
      else if (Array.isArray(v)) v = JSON.stringify(v.map((item) => Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]]))));
      return `${k}=${v}`;
    })
    .join('&');
}

export async function verifyWebhookSignature(env, body) {
  if (!body?.data || typeof body.signature !== 'string' || !env.PAYOS_CHECKSUM_KEY) return false;
  const expected = await hmacHex(env.PAYOS_CHECKSUM_KEY, signatureString(body.data));
  return expected === body.signature.toLowerCase();
}

export const signWebhookData = (env, data) => hmacHex(env.PAYOS_CHECKSUM_KEY, signatureString(data));

async function call(env, method, path, body) {
  if (!payosConfigured(env)) throw new HttpError(503, 'payos_not_configured', 'Chưa cấu hình payOS.');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'x-client-id': env.PAYOS_CLIENT_ID, 'x-api-key': env.PAYOS_API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.code !== '00') {
    console.error('payOS error', path, res.status, json);
    throw new HttpError(502, 'payos_error', `payOS: ${json.desc || `HTTP ${res.status}`}`);
  }
  return json.data;
}

// Positive integer, unique per link. payOS doesn't document a range, so stay inside Int32:
// tenths of a second since mid-2025 (fits until ~2030), retried on the rare collision.
const ORDER_CODE_EPOCH_DS = 17_500_000_000;
export const newPayosOrderCode = () => Math.floor(Date.now() / 100) - ORDER_CODE_EPOCH_DS + Math.floor(Math.random() * 10);

// Returns the checkout data stored on the order (orders.payos_link).
export async function createPaymentLink(env, { orderCode, amount, description, returnUrl, cancelUrl, buyerName, buyerEmail }) {
  const expiredAt = Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS;
  let data;
  if (isMock(env)) {
    data = {
      bin: '970416',
      accountNumber: '25332401',
      accountName: 'LE BUI TIEN DUNG',
      amount,
      description,
      orderCode,
      paymentLinkId: `mock-${orderCode}`,
      status: 'PENDING',
      checkoutUrl: `${new URL(returnUrl).origin}/?mock_payos=${orderCode}`,
      qrCode: `MOCK-PAYOS|${orderCode}|${amount}|${description}`,
    };
  } else {
    const signature = await hmacHex(
      env.PAYOS_CHECKSUM_KEY,
      `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`
    );
    const body = { orderCode, amount, description, returnUrl, cancelUrl, expiredAt, signature };
    if (buyerName) body.buyerName = buyerName;
    if (buyerEmail) body.buyerEmail = buyerEmail;
    data = await call(env, 'POST', '/v2/payment-requests', body);
  }
  return {
    orderCode: data.orderCode,
    paymentLinkId: data.paymentLinkId,
    checkoutUrl: data.checkoutUrl,
    qrCode: data.qrCode,
    bin: data.bin,
    bankName: BANK_NAMES[data.bin] || '',
    accountNumber: data.accountNumber,
    accountName: data.accountName,
    amount: data.amount,
    description: data.description,
    expiresAt: expiredAt * 1000,
  };
}

// status: PENDING | PROCESSING | PAID | CANCELLED | EXPIRED (payOS)
export async function getPaymentLink(env, orderCode) {
  if (isMock(env)) return { orderCode, status: 'PENDING', amountPaid: 0 };
  return call(env, 'GET', `/v2/payment-requests/${orderCode}`);
}

export async function cancelPaymentLink(env, orderCode, cancellationReason) {
  if (isMock(env)) return { orderCode, status: 'CANCELLED' };
  return call(env, 'POST', `/v2/payment-requests/${orderCode}/cancel`, { cancellationReason });
}

// payOS validates the URL by POSTing a signed sample webhook to it.
export async function confirmWebhook(env, webhookUrl) {
  if (isMock(env)) return { webhookUrl, accountName: 'MOCK', accountNumber: '', name: 'Mock channel', shortName: 'MOCK' };
  return call(env, 'POST', '/confirm-webhook', { webhookUrl });
}

// Marks a pending order paid. Returns true if this call changed it.
export async function markOrderPaid(env, order, transactionId) {
  const { meta } = await env.DB.prepare(
    "UPDATE orders SET status = 'paid', paid_via = 'payos', paid_at = ?, transaction_id = ? WHERE code = ? AND status = 'pending'"
  )
    .bind(now(), transactionId, order.code)
    .run();
  return meta.changes > 0;
}

// Applies a verified payOS webhook `data` object. Every payment is stored in
// transactions; ones that belong to a pending order with enough money mark it paid.
// outcome: duplicate | no_order | already_paid | cancelled | underpaid | paid
export async function applyPayosPayment(env, data) {
  const id = String(data.reference || `${data.paymentLinkId}-${data.transactionDateTime}`);
  const amount = Math.round(Number(data.amount) || 0);
  const { meta } = await env.DB.prepare(
    `INSERT OR IGNORE INTO transactions (id, gateway, amount, content, reference_code, transaction_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, PAYOS_GATEWAY, amount, String(data.description || ''), String(data.paymentLinkId || ''), String(data.transactionDateTime || ''), now())
    .run();
  if (!meta.changes) return { outcome: 'duplicate' };

  const setNote = (note) => env.DB.prepare('UPDATE transactions SET note = ? WHERE id = ?').bind(note, id).run();
  const order = await env.DB.prepare('SELECT * FROM orders WHERE payos_order_code = ?').bind(Number(data.orderCode)).first();
  if (!order) {
    await setNote(`Không có đơn nào mang mã payOS ${data.orderCode} (có thể là link thử)`);
    return { outcome: 'no_order' };
  }
  if (order.status !== 'pending') {
    await setNote(`Đơn ${order.code} đã ${order.status === 'paid' ? 'thanh toán' : 'bị huỷ'} trước đó`);
    return { outcome: order.status === 'paid' ? 'already_paid' : 'cancelled', order };
  }
  if (amount < order.amount) {
    await setNote(`Thiếu tiền cho đơn ${order.code} (cần ${order.amount})`);
    return { outcome: 'underpaid', order };
  }
  await markOrderPaid(env, order, id);
  await env.DB.prepare('UPDATE transactions SET order_code = ? WHERE id = ?').bind(order.code, id).run();
  return { outcome: 'paid', order };
}

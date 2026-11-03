import { HttpError, json, now, safeEqual } from '../../../server/http.js';
import { findOrderCodes } from '../../../server/orders.js';

// SePay calls this for every bank transaction (https://docs.sepay.vn/tich-hop-webhooks.html).
// Configure the webhook with "API Key" auth; SePay then sends `Authorization: Apikey <key>`.
// Every incoming transfer is stored; ones that match a pending order mark it paid.
export async function onRequestPost({ request, env }) {
  if (!env.SEPAY_API_KEY) throw new HttpError(503, 'sepay_not_configured');
  const auth = request.headers.get('Authorization') || '';
  if (!safeEqual(auth.replace(/^Apikey\s+/i, ''), env.SEPAY_API_KEY)) throw new HttpError(401, 'unauthorized');

  const tx = await request.json();
  if (tx.transferType !== 'in') return json({ success: true });

  const id = String(tx.id);
  const amount = Math.round(Number(tx.transferAmount) || 0);
  const content = String(tx.content || tx.description || '');
  const { meta } = await env.DB.prepare(
    `INSERT OR IGNORE INTO transactions (id, gateway, amount, content, reference_code, transaction_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, String(tx.gateway || ''), amount, content, String(tx.referenceCode || ''), String(tx.transactionDate || ''), now())
    .run();
  // SePay retries on failure; a transaction we already stored was already handled.
  if (!meta.changes) return json({ success: true });

  const codes = findOrderCodes(tx.code, content);
  if (!codes.length) return json({ success: true });
  const { results: orders } = await env.DB.prepare(`SELECT * FROM orders WHERE code IN (${codes.map(() => '?').join(',')})`)
    .bind(...codes)
    .all();

  const order = orders.find((o) => o.status === 'pending') || orders[0];
  if (!order) return json({ success: true });

  if (order.status !== 'pending') {
    await env.DB.prepare('UPDATE transactions SET note = ? WHERE id = ?').bind(`Đơn ${order.code} đã ${order.status === 'paid' ? 'thanh toán' : 'bị huỷ'} trước đó`, id).run();
  } else if (amount < order.amount) {
    await env.DB.prepare('UPDATE transactions SET note = ? WHERE id = ?').bind(`Thiếu tiền cho đơn ${order.code} (cần ${order.amount})`, id).run();
  } else {
    await env.DB.batch([
      env.DB.prepare("UPDATE orders SET status = 'paid', paid_via = 'sepay', paid_at = ?, transaction_id = ? WHERE code = ? AND status = 'pending'").bind(
        now(),
        id,
        order.code
      ),
      env.DB.prepare('UPDATE transactions SET order_code = ? WHERE id = ?').bind(order.code, id),
    ]);
  }
  return json({ success: true });
}

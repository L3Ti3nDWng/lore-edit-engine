import { HttpError, json, now, readJson } from '../../../../../server/http.js';
import { publicOrder } from '../../../../../server/orders.js';

// POST /api/admin/orders/:code/confirm  { transactionId? } — mark paid by hand,
//      optionally linking an unmatched bank transaction.
// POST /api/admin/orders/:code/cancel
export async function onRequestPost({ request, env, params }) {
  const code = String(params.code).toUpperCase();
  const order = await env.DB.prepare('SELECT * FROM orders WHERE code = ?').bind(code).first();
  if (!order) throw new HttpError(404, 'not_found', 'Không tìm thấy đơn.');
  const body = await readJson(request);

  if (params.action === 'confirm') {
    if (order.status === 'paid') throw new HttpError(409, 'already_paid', 'Đơn đã được thanh toán.');
    const transactionId = body.transactionId ? String(body.transactionId) : null;
    const statements = [
      env.DB.prepare("UPDATE orders SET status = 'paid', paid_via = 'manual', paid_at = ?, transaction_id = ? WHERE code = ?").bind(now(), transactionId, code),
    ];
    if (transactionId) {
      const tx = await env.DB.prepare('SELECT order_code FROM transactions WHERE id = ?').bind(transactionId).first();
      if (!tx) throw new HttpError(404, 'transaction_not_found', 'Không tìm thấy giao dịch.');
      if (tx.order_code) throw new HttpError(409, 'transaction_used', `Giao dịch đã gắn với đơn ${tx.order_code}.`);
      statements.push(env.DB.prepare('UPDATE transactions SET order_code = ? WHERE id = ?').bind(code, transactionId));
    }
    await env.DB.batch(statements);
  } else if (params.action === 'cancel') {
    if (order.status !== 'pending') throw new HttpError(409, 'not_pending', 'Chỉ huỷ được đơn đang chờ.');
    await env.DB.prepare("UPDATE orders SET status = 'cancelled' WHERE code = ?").bind(code).run();
  } else {
    throw new HttpError(404, 'not_found');
  }

  const updated = await env.DB.prepare('SELECT * FROM orders WHERE code = ?').bind(code).first();
  return json({ order: publicOrder(updated) });
}

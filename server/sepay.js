import { now } from './http.js';
import { findOrderCodes } from './orders.js';

// Applies one SePay transaction (webhook payload shape) to the orders table and
// reports what happened. With `dryRun`, nothing is written — the admin tester uses
// this to preview how a transfer would be matched.
//
// outcome: ignored | duplicate | no_code | no_order | already_paid | cancelled | underpaid | paid
export async function processTransaction(env, tx, { dryRun = false } = {}) {
  if (tx.transferType !== 'in') return { outcome: 'ignored' };

  const id = String(tx.id);
  const amount = Math.round(Number(tx.transferAmount) || 0);
  const content = String(tx.content || tx.description || '');

  if (dryRun) {
    if (await env.DB.prepare('SELECT 1 FROM transactions WHERE id = ?').bind(id).first()) return { outcome: 'duplicate' };
  } else {
    const { meta } = await env.DB.prepare(
      `INSERT OR IGNORE INTO transactions (id, gateway, amount, content, reference_code, transaction_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, String(tx.gateway || ''), amount, content, String(tx.referenceCode || ''), String(tx.transactionDate || ''), now())
      .run();
    // SePay retries on failure; a transaction we already stored was already handled.
    if (!meta.changes) return { outcome: 'duplicate' };
  }

  const codes = findOrderCodes(tx.code, content);
  if (!codes.length) return { outcome: 'no_code' };
  const { results: orders } = await env.DB.prepare(`SELECT * FROM orders WHERE code IN (${codes.map(() => '?').join(',')})`)
    .bind(...codes)
    .all();

  const order = orders.find((o) => o.status === 'pending') || orders[0];
  if (!order) return { outcome: 'no_order', codes };

  const setNote = (note) => (dryRun ? null : env.DB.prepare('UPDATE transactions SET note = ? WHERE id = ?').bind(note, id).run());
  if (order.status !== 'pending') {
    const note = `Đơn ${order.code} đã ${order.status === 'paid' ? 'thanh toán' : 'bị huỷ'} trước đó`;
    await setNote(note);
    return { outcome: order.status === 'paid' ? 'already_paid' : 'cancelled', order, note };
  }
  if (amount < order.amount) {
    const note = `Thiếu tiền cho đơn ${order.code} (cần ${order.amount})`;
    await setNote(note);
    return { outcome: 'underpaid', order, note };
  }
  if (!dryRun) {
    await env.DB.batch([
      env.DB.prepare("UPDATE orders SET status = 'paid', paid_via = 'sepay', paid_at = ?, transaction_id = ? WHERE code = ? AND status = 'pending'").bind(
        now(),
        id,
        order.code
      ),
      env.DB.prepare('UPDATE transactions SET order_code = ? WHERE id = ?').bind(order.code, id),
    ]);
  }
  return { outcome: 'paid', order };
}

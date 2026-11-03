import { json } from '../../../../server/http.js';
import { publicOrder } from '../../../../server/orders.js';

const STATUSES = ['pending', 'paid', 'cancelled'];

// ?status=pending|paid|cancelled|all & ?q= (order code, name, contact or Google email)
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';
  const q = (url.searchParams.get('q') || '').trim();
  const where = [];
  const binds = [];
  if (STATUSES.includes(status)) {
    where.push('o.status = ?');
    binds.push(status);
  }
  if (q) {
    where.push('(o.code LIKE ? OR o.name LIKE ? OR o.contact LIKE ? OR u.email LIKE ?)');
    binds.push(...Array(4).fill(`%${q}%`));
  }
  const { results } = await env.DB.prepare(
    `SELECT o.*, u.email AS user_email FROM orders o JOIN users u ON u.id = o.user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.created_at DESC LIMIT 200`
  )
    .bind(...binds)
    .all();
  const { results: counts } = await env.DB.prepare('SELECT status, COUNT(*) AS n, SUM(amount) AS total FROM orders GROUP BY status').all();
  return json({
    orders: results.map((o) => ({ ...publicOrder(o), userEmail: o.user_email, transactionId: o.transaction_id })),
    counts: Object.fromEntries(counts.map((c) => [c.status, { count: c.n, total: c.total }])),
  });
}

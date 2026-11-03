import { json } from '../../../server/http.js';

// ?filter=unmatched (default) | all
export async function onRequestGet({ request, env }) {
  const all = new URL(request.url).searchParams.get('filter') === 'all';
  const { results } = await env.DB.prepare(
    `SELECT * FROM transactions ${all ? '' : 'WHERE order_code IS NULL'} ORDER BY created_at DESC LIMIT 200`
  ).all();
  return json({
    transactions: results.map((t) => ({
      id: t.id,
      gateway: t.gateway,
      amount: t.amount,
      content: t.content,
      referenceCode: t.reference_code,
      transactionDate: t.transaction_date,
      orderCode: t.order_code,
      note: t.note,
      createdAt: t.created_at,
    })),
  });
}

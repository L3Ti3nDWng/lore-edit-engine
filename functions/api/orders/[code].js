import { isAdmin, requireUser } from '../../../server/auth.js';
import { HttpError, json } from '../../../server/http.js';
import { publicOrder } from '../../../server/orders.js';

// Polled by the checkout modal while it waits for the bank transfer to land.
export async function onRequestGet(context) {
  const { env, params } = context;
  const user = requireUser(context);
  const order = await env.DB.prepare('SELECT * FROM orders WHERE code = ?').bind(String(params.code).toUpperCase()).first();
  if (!order || (order.user_id !== user.id && !isAdmin(env, user))) throw new HttpError(404, 'not_found', 'Không tìm thấy đơn.');
  return json({ order: publicOrder(order) });
}

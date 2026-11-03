import { isAdmin, requireUser } from '../../../server/auth.js';
import { HttpError, json } from '../../../server/http.js';
import { publicOrder } from '../../../server/orders.js';
import { getPaymentLink, markOrderPaid } from '../../../server/payos.js';

// Polled by the checkout modal while it waits for payment. With ?sync=1 a pending
// order is also checked against payOS directly, in case the webhook was missed.
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const user = requireUser(context);
  let order = await env.DB.prepare('SELECT * FROM orders WHERE code = ?').bind(String(params.code).toUpperCase()).first();
  if (!order || (order.user_id !== user.id && !isAdmin(env, user))) throw new HttpError(404, 'not_found', 'Không tìm thấy đơn.');

  if (order.status === 'pending' && order.payos_order_code && new URL(request.url).searchParams.get('sync') === '1') {
    try {
      const info = await getPaymentLink(env, order.payos_order_code);
      if (info.status === 'PAID' && (await markOrderPaid(env, order, `payos-${order.payos_order_code}`))) {
        order = await env.DB.prepare('SELECT * FROM orders WHERE code = ?').bind(order.code).first();
      }
    } catch {
      // payOS unreachable: the webhook will still settle it.
    }
  }
  return json({ order: publicOrder(order) });
}

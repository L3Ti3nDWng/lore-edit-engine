import { ORDER_CODE_ALPHABET, ORDER_CODE_LENGTH, ORDER_PREFIX } from '../shared/config.js';
import { createPaymentLink, newPayosOrderCode } from './payos.js';

export function newOrderCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(ORDER_CODE_LENGTH));
  return ORDER_PREFIX + [...bytes].map((b) => ORDER_CODE_ALPHABET[b % ORDER_CODE_ALPHABET.length]).join('');
}

const parseLink = (o) => {
  try {
    return o.payos_link ? JSON.parse(o.payos_link) : null;
  } catch {
    return null;
  }
};

export const publicOrder = (o) => ({
  code: o.code,
  name: o.name,
  contactMethod: o.contact_method,
  contact: o.contact,
  amount: o.amount,
  status: o.status,
  paidVia: o.paid_via,
  paidAt: o.paid_at,
  createdAt: o.created_at,
  // Present while the order is pending: QR string, bank account and transfer note from payOS.
  payment: o.status === 'pending' ? parseLink(o) : null,
});

export const siteOrigin = (env, request) => env.PUBLIC_ORIGIN || new URL(request.url).origin;

// Gives a pending order a payOS payment link that is valid for at least another
// 10 minutes, creating a fresh one (new payOS orderCode) when needed.
export async function ensurePaymentLink(env, request, order, user) {
  const current = parseLink(order);
  if (current && current.amount === order.amount && current.expiresAt > Date.now() + 10 * 60 * 1000) return order;
  const origin = siteOrigin(env, request);
  for (let attempt = 0; ; attempt++) {
    const orderCode = newPayosOrderCode();
    if (attempt < 3 && (await env.DB.prepare('SELECT 1 FROM orders WHERE payos_order_code = ?').bind(orderCode).first())) continue;
    const link = await createPaymentLink(env, {
      orderCode,
      amount: order.amount,
      // Order code only: payOS caps descriptions at 9 characters for non-linked bank accounts.
      description: order.code,
      returnUrl: `${origin}/account?payment=done`,
      cancelUrl: `${origin}/?checkout=1`,
      buyerName: order.name,
      buyerEmail: user?.email,
    });
    const payosLink = JSON.stringify(link);
    await env.DB.prepare('UPDATE orders SET payos_order_code = ?, payos_link = ? WHERE code = ?').bind(link.orderCode, payosLink, order.code).run();
    return { ...order, payos_order_code: link.orderCode, payos_link: payosLink };
  }
}

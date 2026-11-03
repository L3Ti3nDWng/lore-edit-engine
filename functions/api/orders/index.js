import { BETA_PRICE, BETA_SLOTS_TOTAL, CONTACT_METHOD_IDS, CONTACT_VALIDATORS } from '../../../shared/config.js';
import { requireUser } from '../../../server/auth.js';
import { HttpError, json, now, readJson } from '../../../server/http.js';
import { ensurePaymentLink, newOrderCode, publicOrder } from '../../../server/orders.js';
import { slotsTaken } from '../../../server/slots.js';

// Creates the signed-in user's Beta order, or refreshes their open one so the
// transfer code they may already have copied stays valid.
export async function onRequestPost(context) {
  const { env, request } = context;
  const user = requireUser(context);
  const body = await readJson(request);
  const name = String(body.name || '').trim();
  const contactMethod = String(body.contactMethod || '');
  const contact = String(body.contact || '').trim();
  if (name.length < 2 || name.length > 80) throw new HttpError(400, 'invalid_name', 'Vui lòng nhập họ tên (2–80 ký tự).');
  if (!CONTACT_METHOD_IDS.includes(contactMethod) || !CONTACT_VALIDATORS[contactMethod](contact) || contact.length > 120) {
    throw new HttpError(400, 'invalid_contact', 'Thông tin liên hệ chưa đúng định dạng.');
  }

  const paid = await env.DB.prepare("SELECT 1 FROM orders WHERE user_id = ? AND status = 'paid' LIMIT 1").bind(user.id).first();
  if (paid) throw new HttpError(409, 'already_paid', 'Tài khoản này đã sở hữu Skill.');

  const open = await env.DB.prepare("SELECT * FROM orders WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1")
    .bind(user.id)
    .first();
  // Someone who already started an order may still finish it; new orders stop at the cap.
  if (!open && (await slotsTaken(env)) >= BETA_SLOTS_TOTAL) {
    throw new HttpError(409, 'sold_out', 'Đã hết slot Beta. Cảm ơn bạn đã quan tâm!');
  }
  if (open) {
    await env.DB.prepare('UPDATE orders SET name = ?, contact_method = ?, contact = ? WHERE code = ?').bind(name, contactMethod, contact, open.code).run();
    const withLink = await ensurePaymentLink(env, request, { ...open, name, contact_method: contactMethod, contact }, user);
    return json({ order: publicOrder(withLink) });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const order = { code: newOrderCode(), user_id: user.id, name, contact_method: contactMethod, contact, amount: BETA_PRICE, status: 'pending', created_at: now() };
    const { meta } = await env.DB.prepare(
      'INSERT OR IGNORE INTO orders (code, user_id, name, contact_method, contact, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(order.code, order.user_id, name, contactMethod, contact, order.amount, order.status, order.created_at)
      .run();
    if (meta.changes) return json({ order: publicOrder(await ensurePaymentLink(env, request, order, user)) }, { status: 201 });
  }
  throw new HttpError(500, 'code_collision');
}

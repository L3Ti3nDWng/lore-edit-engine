import { isAdmin, isEntitled } from '../../server/auth.js';
import { json } from '../../server/http.js';
import { publicOrder } from '../../server/orders.js';

export async function onRequestGet({ env, data }) {
  const { user } = data;
  if (!user) return json({ user: null });
  const entitled = await isEntitled(env, user);
  const { results } = await env.DB.prepare("SELECT * FROM orders WHERE user_id = ? AND status != 'cancelled' ORDER BY created_at DESC")
    .bind(user.id)
    .all();
  return json({
    user: { email: user.email, name: user.name, avatarUrl: user.avatar_url },
    isAdmin: isAdmin(env, user),
    entitled,
    orders: results.map(publicOrder),
    support: entitled ? { zalo: env.SUPPORT_ZALO_URL || '', discord: env.SUPPORT_DISCORD_URL || '' } : null,
  });
}

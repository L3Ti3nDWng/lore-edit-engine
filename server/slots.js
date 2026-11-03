import { BETA_SLOTS_RESERVED } from '../shared/config.js';

// A Beta slot is taken once its order is paid; pending orders don't hold one.
// BETA_SLOTS_RESERVED is added on top so the counter starts below the total.
export async function slotsTaken(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'paid'").first();
  return BETA_SLOTS_RESERVED + row.n;
}

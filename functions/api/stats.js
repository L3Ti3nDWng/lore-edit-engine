import { BETA_SLOTS_TOTAL } from '../../shared/config.js';
import { json } from '../../server/http.js';
import { slotsTaken } from '../../server/slots.js';

// Public slot counter for the pricing section. Cached briefly at the edge.
export async function onRequestGet({ env }) {
  return json({ slotsTaken: await slotsTaken(env), slotsTotal: BETA_SLOTS_TOTAL }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}

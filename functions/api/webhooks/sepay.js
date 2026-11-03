import { HttpError, json, safeEqual } from '../../../server/http.js';
import { processTransaction } from '../../../server/sepay.js';

// SePay calls this for every bank transaction (https://docs.sepay.vn/tich-hop-webhooks.html).
// Configure the webhook with "API Key" auth; SePay then sends `Authorization: Apikey <key>`.
// Every incoming transfer is stored; ones that match a pending order mark it paid.
export async function onRequestPost({ request, env }) {
  if (!env.SEPAY_API_KEY) throw new HttpError(503, 'sepay_not_configured');
  const auth = request.headers.get('Authorization') || '';
  if (!safeEqual(auth.replace(/^Apikey\s+/i, ''), env.SEPAY_API_KEY)) throw new HttpError(401, 'unauthorized');

  await processTransaction(env, await request.json());
  return json({ success: true });
}

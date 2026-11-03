import { requireEntitled } from '../../../server/auth.js';
import { json } from '../../../server/http.js';
import { publicRelease } from '../../../server/releases.js';

export async function onRequestGet(context) {
  await requireEntitled(context);
  const { results } = await context.env.DB.prepare('SELECT * FROM releases ORDER BY published_at DESC, id DESC').all();
  return json({ releases: results.map(publicRelease) });
}

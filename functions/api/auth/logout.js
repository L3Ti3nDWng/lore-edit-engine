import { destroySession } from '../../../server/auth.js';
import { json } from '../../../server/http.js';

export async function onRequestPost({ request, env }) {
  return json({ ok: true }, { headers: { 'Set-Cookie': await destroySession(env, request) } });
}

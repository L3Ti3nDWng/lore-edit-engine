import { createSession, upsertUser } from '../../../server/auth.js';
import { HttpError, isLocalHost, json, readJson } from '../../../server/http.js';

// Local-only sign-in without Google, for testing checkout and /account.
// Requires DEV_LOGIN=1 in .dev.vars and a localhost request.
export async function onRequestPost({ request, env }) {
  if (env.DEV_LOGIN !== '1' || !isLocalHost(request)) throw new HttpError(404, 'not_found');
  const { email, name = '' } = await readJson(request);
  if (!/^[^\s@]+@[^\s@]+$/.test(email || '')) throw new HttpError(400, 'invalid_email');
  const userId = await upsertUser(env, { sub: `dev:${email}`, email, name: name || email.split('@')[0] });
  return json({ ok: true }, { headers: { 'Set-Cookie': await createSession(env, request, userId) } });
}

import { HttpError, cookie, now, parseCookies, randomToken, sha256Hex } from './http.js';

export const SESSION_COOKIE = 'lore_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function getSessionUser(env, request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.avatar_url FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  )
    .bind(await sha256Hex(token), now())
    .first();
  return row || null;
}

export async function createSession(env, request, userId) {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(token), userId, now() + SESSION_TTL_MS, now())
    .run();
  // Opportunistic cleanup keeps the table small without a cron job.
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()).run();
  return cookie(request, SESSION_COOKIE, token, { maxAge: SESSION_TTL_MS / 1000 });
}

export async function destroySession(env, request) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  return cookie(request, SESSION_COOKIE, '', { maxAge: 0 });
}

export async function upsertUser(env, { sub, email, name = '', picture = '' }) {
  const existing = await env.DB.prepare('SELECT id FROM users WHERE google_sub = ?').bind(sub).first();
  if (existing) {
    await env.DB.prepare('UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?').bind(email, name, picture, existing.id).run();
    return existing.id;
  }
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id, google_sub, email, name, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, sub, email, name, picture, now())
    .run();
  return id;
}

export const isAdmin = (env, user) =>
  Boolean(user) &&
  (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(user.email.toLowerCase());

export async function isEntitled(env, user) {
  if (!user) return false;
  const row = await env.DB.prepare("SELECT 1 FROM orders WHERE user_id = ? AND status = 'paid' LIMIT 1").bind(user.id).first();
  return Boolean(row);
}

export function requireUser(context) {
  const { user } = context.data;
  if (!user) throw new HttpError(401, 'unauthenticated', 'Vui lòng đăng nhập.');
  return user;
}

// Paid users and admins can read releases and download files.
export async function requireEntitled(context) {
  const user = requireUser(context);
  if (isAdmin(context.env, user) || (await isEntitled(context.env, user))) return user;
  throw new HttpError(403, 'not_entitled', 'Tài khoản chưa có đơn đã thanh toán.');
}

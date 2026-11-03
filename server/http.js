export class HttpError extends Error {
  constructor(status, code, message = code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const json = (data, init = {}) => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const errorResponse = (err) => {
  if (err instanceof HttpError) return json({ error: err.code, message: err.message }, { status: err.status });
  console.error(err);
  return json({ error: 'server_error', message: 'Có lỗi xảy ra, vui lòng thử lại.' }, { status: 500 });
};

export async function readJson(request) {
  if (!(request.headers.get('Content-Type') || '').includes('application/json')) {
    throw new HttpError(415, 'json_required', 'Yêu cầu phải gửi JSON.');
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'JSON không hợp lệ.');
  }
}

export const now = () => Date.now();

export function randomToken(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison for shared secrets (webhook keys).
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function parseCookies(request) {
  const out = {};
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(request, name, value, { maxAge, httpOnly = true } = {}) {
  const secure = new URL(request.url).protocol === 'https:';
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
    httpOnly && 'HttpOnly',
    secure && 'Secure',
    maxAge !== undefined && `Max-Age=${maxAge}`,
  ]
    .filter(Boolean)
    .join('; ');
}

// Only same-site relative paths are allowed as post-login redirects.
export const safeNext = (next) => (typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : '/account');

export const isLocalHost = (request) => ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);

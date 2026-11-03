import { createSession, upsertUser } from '../../../../server/auth.js';
import { cookie, parseCookies, safeEqual, safeNext } from '../../../../server/http.js';
import { OAUTH_COOKIE, redirectUri } from './index.js';

const fail = (request, reason) =>
  new Response(null, {
    status: 302,
    headers: { Location: `/account?login_error=${reason}`, 'Set-Cookie': cookie(request, OAUTH_COOKIE, '', { maxAge: 0 }) },
  });

function decodeJwtPayload(jwt) {
  const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(part), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const [savedState, savedNext] = (parseCookies(request)[OAUTH_COOKIE] || '').split('|');
  const state = url.searchParams.get('state') || '';
  const code = url.searchParams.get('code');
  if (url.searchParams.get('error')) return fail(request, 'cancelled');
  if (!code || !savedState || !safeEqual(state, savedState)) return fail(request, 'state');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(env, request),
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return fail(request, 'token');
  const { id_token: idToken } = await tokenRes.json();

  // The ID token came straight from Google's token endpoint over TLS, so its
  // claims can be trusted without verifying the signature (OIDC Core 3.1.3.7).
  const claims = decodeJwtPayload(idToken);
  const validIssuer = ['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss);
  if (!validIssuer || claims.aud !== env.GOOGLE_CLIENT_ID || claims.exp * 1000 < Date.now() || !claims.email_verified) {
    return fail(request, 'claims');
  }

  const userId = await upsertUser(env, { sub: claims.sub, email: claims.email, name: claims.name, picture: claims.picture });
  const headers = new Headers({ Location: safeNext(savedNext) });
  headers.append('Set-Cookie', await createSession(env, request, userId));
  headers.append('Set-Cookie', cookie(request, OAUTH_COOKIE, '', { maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}

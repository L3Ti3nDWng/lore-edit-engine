import { HttpError, cookie, randomToken, safeNext } from '../../../../server/http.js';

export const OAUTH_COOKIE = 'lore_oauth';

export const redirectUri = (env, request) => `${env.PUBLIC_ORIGIN || new URL(request.url).origin}/api/auth/google/callback`;

// Starts Google sign-in. ?next=/account picks where to land afterwards.
export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, 'google_not_configured', 'Chưa cấu hình đăng nhập Google.');
  const state = randomToken(24);
  const next = safeNext(new URL(request.url).searchParams.get('next'));
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(env, request),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'Set-Cookie': cookie(request, OAUTH_COOKIE, `${state}|${next}`, { maxAge: 600 }),
    },
  });
}

import { getSessionUser } from '../../server/auth.js';
import { HttpError, errorResponse } from '../../server/http.js';

// Runs for every /api request: rejects cross-site writes, loads the signed-in user,
// and turns thrown HttpErrors into JSON responses.
export async function onRequest(context) {
  const { request, env } = context;
  try {
    const { pathname } = new URL(request.url);
    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (isWrite && !pathname.startsWith('/api/webhooks/')) {
      const origin = request.headers.get('Origin');
      if (origin && new URL(origin).host !== request.headers.get('Host')) {
        throw new HttpError(403, 'bad_origin', 'Yêu cầu không hợp lệ.');
      }
    }
    context.data.user = await getSessionUser(env, request);
    return await context.next();
  } catch (err) {
    return errorResponse(err);
  }
}

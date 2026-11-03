import { isAdmin, requireUser } from '../../../server/auth.js';
import { HttpError } from '../../../server/http.js';

export async function onRequest(context) {
  const user = requireUser(context);
  if (!isAdmin(context.env, user)) throw new HttpError(403, 'forbidden', 'Chỉ quản trị viên mới truy cập được.');
  return context.next();
}

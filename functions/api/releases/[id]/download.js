import { requireEntitled } from '../../../../server/auth.js';
import { HttpError } from '../../../../server/http.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  await requireEntitled(context);
  const release = await env.DB.prepare('SELECT * FROM releases WHERE id = ?').bind(Number(params.id)).first();
  if (!release?.file_key) throw new HttpError(404, 'not_found', 'Phiên bản này chưa có file.');
  const object = await env.FILES.get(release.file_key);
  if (!object) throw new HttpError(404, 'file_missing', 'Không tìm thấy file trên kho lưu trữ.');

  const fallback = release.file_name.replace(/[^\x20-\x7e]|["\\]/g, '_');
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': String(object.size),
      'Content-Disposition': `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(release.file_name)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}

import { HttpError, json } from '../../../../server/http.js';

export async function onRequestDelete({ env, params }) {
  const release = await env.DB.prepare('SELECT * FROM releases WHERE id = ?').bind(Number(params.id)).first();
  if (!release) throw new HttpError(404, 'not_found', 'Không tìm thấy phiên bản.');
  if (release.file_key) await env.FILES.delete(release.file_key);
  await env.DB.prepare('DELETE FROM releases WHERE id = ?').bind(release.id).run();
  return json({ ok: true });
}

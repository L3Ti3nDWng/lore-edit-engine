import { HttpError, json, now } from '../../../../server/http.js';
import { publicRelease } from '../../../../server/releases.js';

const MAX_UPLOAD_BYTES = 95 * 1024 * 1024; // Workers cap request bodies at 100 MB on the free plan.

// multipart/form-data: version (required), title, notes, file (optional)
export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  const version = String(form.get('version') || '').trim();
  if (!version || version.length > 40) throw new HttpError(400, 'invalid_version', 'Nhập số phiên bản (tối đa 40 ký tự).');
  const title = String(form.get('title') || '').trim().slice(0, 120);
  const notes = String(form.get('notes') || '').trim().slice(0, 10000);
  const file = form.get('file');

  let fileKey = null;
  let fileName = null;
  let fileSize = null;
  if (file && typeof file === 'object' && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'file_too_large', 'File vượt quá 95 MB.');
    fileName = file.name.slice(0, 200);
    fileSize = file.size;
    fileKey = `releases/${crypto.randomUUID()}/${fileName}`;
    await env.FILES.put(fileKey, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  }

  const row = await env.DB.prepare(
    'INSERT INTO releases (version, title, notes, file_key, file_name, file_size, published_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
  )
    .bind(version, title, notes, fileKey, fileName, fileSize, now())
    .first();
  return json({ release: publicRelease(row) }, { status: 201 });
}

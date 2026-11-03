export const publicRelease = (r) => ({
  id: r.id,
  version: r.version,
  title: r.title,
  notes: r.notes,
  fileName: r.file_name,
  fileSize: r.file_size,
  hasFile: Boolean(r.file_key),
  publishedAt: r.published_at,
});

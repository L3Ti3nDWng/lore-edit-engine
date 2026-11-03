// A Beta slot is taken once its order is paid; pending orders don't hold one.
export async function slotsTaken(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'paid'").first();
  return row.n;
}

import { HttpError, json, readJson } from '../../../server/http.js';
import { publicOrder } from '../../../server/orders.js';
import { processTransaction } from '../../../server/sepay.js';

export const TEST_GATEWAY = 'TEST';

// GET: is SePay configured, and when did the last real webhook arrive?
export async function onRequestGet({ env }) {
  const last = await env.DB.prepare('SELECT amount, content, created_at FROM transactions WHERE gateway != ? ORDER BY created_at DESC LIMIT 1')
    .bind(TEST_GATEWAY)
    .first();
  return json({
    apiKeyConfigured: Boolean(env.SEPAY_API_KEY),
    lastWebhook: last ? { amount: last.amount, content: last.content, receivedAt: last.created_at } : null,
  });
}

// POST { amount, content, commit } — runs a fake incoming transfer through the same
// matching code as the real webhook. With commit=false nothing is written; with
// commit=true it is stored (gateway TEST) and can mark a pending order paid.
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const amount = Math.round(Number(body.amount));
  const content = String(body.content || '').trim();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e10) throw new HttpError(400, 'invalid_amount', 'Số tiền phải là số dương.');
  if (!content || content.length > 500) throw new HttpError(400, 'invalid_content', 'Nhập nội dung chuyển khoản (tối đa 500 ký tự).');

  const commit = body.commit === true;
  const tx = {
    id: `test-${crypto.randomUUID()}`,
    gateway: TEST_GATEWAY,
    transactionDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
    content,
    transferType: 'in',
    transferAmount: amount,
    referenceCode: 'TEST',
  };
  const result = await processTransaction(env, tx, { dryRun: !commit });
  return json({
    commit,
    transactionId: commit ? tx.id : null,
    outcome: result.outcome,
    note: result.note || '',
    codes: result.codes || [],
    order: result.order ? { ...publicOrder(result.order), status: commit && result.outcome === 'paid' ? 'paid' : result.order.status } : null,
  });
}

// Sends a signed payOS webhook to the local API, as if the payment arrived.
// usage: node scripts/simulate-payos-webhook.mjs <payosOrderCode> [amount] [reference]
// The payOS order code is order.payment.orderCode (see /api/me or the admin page).
import { signWebhookData } from '../server/payos.js';

const [orderCode, amount = '349000', reference = `FT-SIM-${Date.now()}`] = process.argv.slice(2);
if (!orderCode) {
  console.error('usage: node scripts/simulate-payos-webhook.mjs <payosOrderCode> [amount] [reference]');
  process.exit(1);
}
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'local-checksum-key';
const data = {
  orderCode: Number(orderCode),
  amount: Number(amount),
  description: 'SIMULATED',
  accountNumber: '',
  reference,
  transactionDateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  currency: 'VND',
  paymentLinkId: `mock-${orderCode}`,
  code: '00',
  desc: 'success',
  counterAccountBankId: '',
  counterAccountBankName: '',
  counterAccountName: '',
  counterAccountNumber: '',
  virtualAccountName: '',
  virtualAccountNumber: '',
};
const signature = await signWebhookData({ PAYOS_CHECKSUM_KEY: checksumKey }, data);
const res = await fetch('http://localhost:8788/api/webhooks/payos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: '00', desc: 'success', success: true, data, signature }),
});
console.log(res.status, await res.text());

import { ORDER_CODE_ALPHABET, ORDER_CODE_LENGTH, ORDER_PREFIX, transferNoteFor } from '../shared/config.js';

export function newOrderCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(ORDER_CODE_LENGTH));
  return ORDER_PREFIX + [...bytes].map((b) => ORDER_CODE_ALPHABET[b % ORDER_CODE_ALPHABET.length]).join('');
}

// Every order code that could appear in a bank transfer note. Banks drop or mangle
// spaces and punctuation, so we scan the content with all separators removed.
export function findOrderCodes(...texts) {
  const codes = new Set();
  for (const text of texts) {
    const s = String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (let i = s.indexOf(ORDER_PREFIX); i !== -1; i = s.indexOf(ORDER_PREFIX, i + 1)) {
      const body = s.slice(i + ORDER_PREFIX.length, i + ORDER_PREFIX.length + ORDER_CODE_LENGTH);
      if (body.length === ORDER_CODE_LENGTH && [...body].every((c) => ORDER_CODE_ALPHABET.includes(c))) codes.add(ORDER_PREFIX + body);
    }
  }
  return [...codes];
}

export const publicOrder = (o) => ({
  code: o.code,
  name: o.name,
  contactMethod: o.contact_method,
  contact: o.contact,
  amount: o.amount,
  status: o.status,
  paidVia: o.paid_via,
  paidAt: o.paid_at,
  createdAt: o.created_at,
  transferNote: transferNoteFor(o.code),
});

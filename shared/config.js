// Business config shared by the landing page (src/) and the API (functions/).
// The server always charges these amounts, never what the browser sends.

export const BETA_PRICE = 349000;
export const OFFICIAL_PRICE = 479000;
export const ULTIMATE_PRICE = 979000;
export const BETA_SLOTS_TOTAL = 50;
// Slots shown as already taken before any real order counts (7 → "Còn 43/50").
// They also count toward the cap, so only TOTAL − RESERVED slots can actually be sold.
export const BETA_SLOTS_RESERVED = 7;

export const PRODUCT_NAME = 'Phiên Bản Thử Nghiệm (Beta Test)';

// Order codes look like AE7K2QXM; the code is also the payOS transfer description.
export const ORDER_PREFIX = 'AE';
export const ORDER_CODE_LENGTH = 6;
export const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Offered at checkout. Older orders may still carry 'discord'.
export const CONTACT_METHOD_IDS = ['email', 'zalo'];

// Contact validation, used by the checkout form and re-checked by POST /api/orders.
export const CONTACT_VALIDATORS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  zalo: (v) => /^(\+?84|0)\d{9}$/.test(v.replace(/[\s.-]/g, '')),
  discord: (v) => /^[a-z0-9_.]{2,32}$/i.test(v.trim().replace(/^@/, '')),
};

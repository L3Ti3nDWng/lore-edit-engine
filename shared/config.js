// Business config shared by the landing page (src/) and the API (functions/).
// The server always charges these amounts, never what the browser sends.

export const BETA_PRICE = 349000;
export const OFFICIAL_PRICE = 479000;
export const ULTIMATE_PRICE = 979000;
export const BETA_SLOTS_TOTAL = 100;

export const PRODUCT_NAME = 'Phiên Bản Thử Nghiệm (Beta Test)';

// Order codes look like LB7K2QXM. The transfer note is "LORE BETA <code>";
// banks often strip spaces, so the webhook matches the code anywhere in the content.
export const ORDER_PREFIX = 'LB';
export const ORDER_CODE_LENGTH = 6;
export const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const transferNoteFor = (code) => `LORE BETA ${code}`;

export const CONTACT_METHOD_IDS = ['email', 'zalo', 'discord'];

// Contact validation, used by the checkout form and re-checked by POST /api/orders.
export const CONTACT_VALIDATORS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  zalo: (v) => /^(\+?84|0)\d{9}$/.test(v.replace(/[\s.-]/g, '')),
  discord: (v) => /^[a-z0-9_.]{2,32}$/i.test(v.trim().replace(/^@/, '')),
};

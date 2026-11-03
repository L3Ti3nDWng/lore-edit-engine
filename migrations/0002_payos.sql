-- Switch payments to payOS: each order gets its own payOS payment link.
-- SQLite can't alter a CHECK constraint, so the orders table is rebuilt.
PRAGMA defer_foreign_keys = true;

CREATE TABLE orders_new (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  contact TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_via TEXT CHECK (paid_via IN ('payos', 'manual')),
  paid_at INTEGER,
  transaction_id TEXT,
  -- payOS orderCode (integer, unique per payment link) and the link's checkout data as JSON.
  payos_order_code INTEGER UNIQUE,
  payos_link TEXT,
  created_at INTEGER NOT NULL
);

INSERT INTO orders_new (code, user_id, name, contact_method, contact, amount, status, paid_via, paid_at, transaction_id, created_at)
SELECT code, user_id, name, contact_method, contact, amount, status,
       CASE WHEN paid_via = 'sepay' THEN 'payos' ELSE paid_via END,
       paid_at, transaction_id, created_at
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_new RENAME TO orders;
CREATE INDEX orders_user ON orders(user_id);
CREATE INDEX orders_status ON orders(status, created_at);

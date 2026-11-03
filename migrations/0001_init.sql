-- AI EDITOR: users, sessions, orders, bank transactions, releases.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

-- Only the SHA-256 of the session token is stored; the raw token lives in the cookie.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE orders (
  code TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  contact TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_via TEXT CHECK (paid_via IN ('sepay', 'manual')),
  paid_at INTEGER,
  transaction_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX orders_user ON orders(user_id);
CREATE INDEX orders_status ON orders(status, created_at);

-- Every incoming SePay transfer, matched or not, so admins can reconcile by hand.
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  gateway TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  reference_code TEXT NOT NULL DEFAULT '',
  transaction_date TEXT NOT NULL DEFAULT '',
  order_code TEXT REFERENCES orders(code),
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX transactions_unmatched ON transactions(order_code, created_at);

CREATE TABLE releases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  file_key TEXT,
  file_name TEXT,
  file_size INTEGER,
  published_at INTEGER NOT NULL
);

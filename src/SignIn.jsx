import React, { useState } from 'react';
import { api, googleLoginUrl } from './lib/api.js';
import { PillButton, inputClass } from './ui.jsx';

function GoogleMark({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

export function GoogleSignInButton({ next, className = '', children = 'Tiếp tục với Google' }) {
  return (
    <PillButton className={className} onClick={() => window.location.assign(googleLoginUrl(next))}>
      <GoogleMark /> {children}
    </PillButton>
  );
}

// Local development only (stripped from production builds): sign in as any email
// through POST /api/auth/dev, which also requires DEV_LOGIN=1 on the API.
export function DevSignIn({ onDone }) {
  const [email, setEmail] = useState('buyer@aieditor.test');
  const [error, setError] = useState('');
  if (!import.meta.env.DEV) return null;
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/dev', { method: 'POST', body: { email } });
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit} className="mt-5 rounded-[24px] border border-dashed border-line2 p-4">
      <label htmlFor="dev-email" className="font-mono text-[11px] text-mute">
        Dev login (chỉ hiện khi chạy local)
      </label>
      <div className="flex gap-2">
        <input id="dev-email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass(false)} />
        <button type="submit" className="mt-2 shrink-0 rounded-2xl border border-line2 px-4 text-sm font-medium text-white hover:border-white/40">
          Vào
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
    </form>
  );
}

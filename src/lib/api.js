import { useCallback, useEffect, useState } from 'react';

// Thin fetch wrapper for /api. Throws an Error carrying the API's `code` and `status`.
export async function api(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    err.code = data.error;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const googleLoginUrl = (next) => `/api/auth/google?next=${encodeURIComponent(next)}`;

export async function logout() {
  await api('/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

// The signed-in user, their orders and entitlement. `me` is null until loaded;
// `me.user` is null when signed out.
export function useMe() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const reload = useCallback(async () => {
    try {
      setMe(await api('/me'));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { me, error, reload };
}

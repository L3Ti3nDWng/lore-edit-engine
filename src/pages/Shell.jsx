import React from 'react';
import { Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { logout } from '../lib/api.js';
import { GlobalStyles, Logo } from '../ui.jsx';

export const formatDate = (ms) => (ms ? new Date(ms).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
export const formatDateTime = (ms) =>
  ms ? new Date(ms).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
export const formatBytes = (n) => (n == null ? '' : n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function Avatar({ user, size = 'h-8 w-8' }) {
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className={`${size} rounded-full border border-line2`} />;
  return (
    <span className={`${size} flex items-center justify-center rounded-full border border-line2 bg-chip text-xs font-medium uppercase text-white`}>
      {(user.name || user.email)[0]}
    </span>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-mute">
      <Loader2 className="h-5 w-5 animate-spin" /> Đang tải...
    </div>
  );
}

// Top bar + page frame for /account and /admin.
export function Shell({ me, active, children }) {
  const user = me?.user;
  return (
    <div className="min-h-screen bg-base font-sans text-white">
      <GlobalStyles />
      <header className="border-b border-line bg-base/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-[81px] max-w-[1200px] items-center justify-between gap-4 px-4 md:px-8" aria-label="Điều hướng tài khoản">
          <a href="/" aria-label="Về trang chủ AI EDITOR">
            <Logo />
          </a>
          {user && (
            <div className="flex min-w-0 items-center gap-1 sm:gap-2">
              {me.isAdmin && (
                <a
                  href={active === 'admin' ? '/account' : '/admin'}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium tracking-tightish text-white transition-colors hover:bg-white/5"
                >
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <span className="hidden sm:inline">{active === 'admin' ? 'Trang thành viên' : 'Quản trị'}</span>
                </a>
              )}
              <span className="flex min-w-0 items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3">
                <Avatar user={user} size="h-7 w-7" />
                <span className="hidden truncate text-sm font-medium tracking-tightish sm:inline">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="Đăng xuất"
                className="flex h-10 w-10 items-center justify-center rounded-full text-mute transition-colors hover:bg-white/5 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-10 md:px-8 md:pt-16">{children}</main>
    </div>
  );
}

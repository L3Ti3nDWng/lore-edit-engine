import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Shared design primitives for the landing page, /account and /admin.

export const formatVnd = (n) => `${n.toLocaleString('vi-VN')}đ`;

export function GlobalStyles() {
  return (
    <style>{`
      @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      @keyframes letterIn { from { opacity: 0; transform: translateY(40%); filter: blur(8px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      @keyframes heroDrift { 0%, 100% { transform: scale(1.06) translate3d(0, 0, 0); } 50% { transform: scale(1.12) translate3d(-1%, -1.5%, 0); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes caret { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      @keyframes cursorMove { 0%, 100% { transform: translate(0, 0); } 40% { transform: translate(-96px, 6px); } 60% { transform: translate(-96px, 6px); } }
      .anim-marquee { animation: marquee 40s linear infinite; }
      .anim-letter { display: inline-block; animation: letterIn .7s cubic-bezier(.2,.8,.2,1) both; }
      .anim-hero { animation: heroDrift 24s ease-in-out infinite; }
      .anim-fade-up { animation: fadeUp .5s cubic-bezier(.2,.8,.2,1) both; }
      .anim-spin { animation: spin 1s linear infinite; }
      .anim-caret { animation: caret 1s steps(1) infinite; }
      .anim-cursor { animation: cursorMove 5s ease-in-out infinite; }
    `}</style>
  );
}

// Framer-style pill: label rolls up on hover.
export function PillButton({ children, variant = 'light', size = 'md', className = '', ...rest }) {
  const styles =
    variant === 'light' ? 'bg-white text-base' : 'border border-line bg-base text-white hover:border-line2';
  const pad = size === 'sm' ? 'px-5 py-2.5' : size === 'lg' ? 'px-6 py-[14px]' : 'px-6 py-3';
  return (
    <button
      type="button"
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full text-base font-medium tracking-tightish transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${pad} ${className}`}
      {...rest}
    >
      <span className="relative block overflow-hidden leading-[1.3]">
        <span className="flex items-center justify-center gap-2 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:-translate-y-full">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 flex translate-y-full items-center justify-center gap-2 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:translate-y-0"
        >
          {children}
        </span>
      </span>
    </button>
  );
}

export function Logo({ size = 26 }) {
  return (
    <span className="font-script leading-[1.2] tracking-tightish text-white" style={{ fontSize: size }}>
      Lore
    </span>
  );
}

export function Container({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 md:px-10 ${className}`}>{children}</div>;
}

export function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-inner px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-mute">{label}</p>
        <p className="truncate text-sm font-medium tracking-tightish text-white">{value || 'Đang cập nhật'}</p>
      </div>
      {value && (
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line2 bg-chip px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-white/40"
          aria-label={`Sao chép ${label}`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Đã chép' : 'Chép'}
        </button>
      )}
    </div>
  );
}

export const inputClass = (hasError) =>
  `mt-2 w-full rounded-2xl border bg-inner px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-mute/50 focus:border-line2 ${
    hasError ? 'border-rose-400/60' : 'border-line'
  }`;
export function Tag({ children, dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-line bg-inner px-4 py-1.5 text-xs font-medium tracking-tightish text-white ${className}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {children}
    </span>
  );
}

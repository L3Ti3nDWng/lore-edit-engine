import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X } from 'lucide-react';

// Renders the VietQR string from a payOS payment link. Tapping it opens a
// full-screen enlarged copy that is easier to scan from another phone.
// The qrcode library is loaded on demand so the landing page doesn't pay for it.
export default function PayosQr({ value, label, caption }) {
  const [src, setSrc] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const close = useCallback(() => setZoomed(false), []);

  useEffect(() => {
    let alive = true;
    setSrc('');
    if (!value) return undefined;
    import('qrcode')
      .then((QR) => QR.toDataURL(value, { margin: 1, width: 720, errorCorrectionLevel: 'M' }))
      .then((url) => alive && setSrc(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value]);

  if (!src) return <div className="h-full w-full animate-pulse rounded-xl bg-black/10" />;

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`Phóng to ${label}`}
        className="group relative block h-full w-full cursor-zoom-in focus-visible:outline-none"
      >
        <img src={src} alt={label} className="h-full w-full object-contain" />
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white opacity-80 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
        </span>
      </button>
      {zoomed && <ZoomedQr src={src} label={label} caption={caption} onClose={close} />}
    </>
  );
}

function ZoomedQr({ src, label, caption, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    // Capture phase + stopImmediatePropagation: Escape closes only the zoom, not the
    // checkout modal underneath (which listens for Escape on window too).
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className="anim-fade-up fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5 bg-black/90 p-4 backdrop-blur-md"
    >
      <div className="w-[min(88vw,72vh,560px)] rounded-[28px] bg-white p-4 sm:p-5">
        <img src={src} alt={label} className="block aspect-square w-full [image-rendering:pixelated]" />
      </div>
      {caption && <p className="max-w-[560px] text-center font-mono text-base text-white">{caption}</p>}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/60"
      >
        <X className="h-4 w-4" /> Đóng
      </button>
    </div>,
    document.body
  );
}

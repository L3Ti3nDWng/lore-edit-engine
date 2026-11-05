import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

// Motion layer for the landing page: Lenis drives the scroll, GSAP + ScrollTrigger
// choreograph scroll-linked reveals/parallax, Motion handles pointer physics.

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

// The house curve, cubic-bezier(0.16, 1, 0.3, 1). Same curve as Tailwind's `ease-silk`.
export const SILK = [0.16, 1, 0.3, 1];
CustomEase.create('silk', '0.16,1,0.3,1');

export { gsap, ScrollTrigger, useGSAP };

export const motionOK = () =>
  typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* Smooth scroll                                                       */
/* ------------------------------------------------------------------ */

let lenis = null;

// Lenis inertia scrolling, ticked by GSAP so ScrollTrigger and Lenis share one frame.
export function useSmoothScroll() {
  useEffect(() => {
    if (!motionOK()) return undefined;
    lenis = new Lenis({ lerp: 0.09, anchors: true, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

export const scrollLock = (locked) => (locked ? lenis?.stop() : lenis?.start());

export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: motionOK() ? 'smooth' : 'auto' });
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto', block: 'start' });
}

/* ------------------------------------------------------------------ */
/* Scroll reveals                                                      */
/* ------------------------------------------------------------------ */

// Fades and lifts its content in once it enters the viewport.
export function Reveal({ children, className = '', delay = 0, y = 48, as: Tag = 'div' }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.from(ref.current, {
        y,
        autoAlpha: 0,
        duration: 1.2,
        delay: delay / 1000,
        ease: 'silk',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
      });
    },
    { scope: ref }
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

// Children marked [data-stagger] cascade in one after another.
export function Stagger({ children, className = '', each = 0.09, y = 56, as: Tag = 'div' }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      if (!motionOK()) return;
      const items = ref.current.querySelectorAll('[data-stagger]');
      if (!items.length) return;
      gsap.from(items, {
        y,
        autoAlpha: 0,
        duration: 1.2,
        ease: 'silk',
        stagger: each,
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });
    },
    { scope: ref }
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

// Splits a string into words that each rise out of their own mask.
// Vertical padding keeps Vietnamese diacritics and descenders out of the clip.
export function Words({ children }) {
  const words = String(children).split(' ');
  return words.map((w, i) => (
    <React.Fragment key={`${w}-${i}`}>
      <span className="-my-[0.14em] inline-block overflow-hidden py-[0.14em] align-top">
        <span data-word className="inline-block will-change-transform">
          {w}
        </span>
      </span>
      {i < words.length - 1 ? ' ' : ''}
    </React.Fragment>
  ));
}

// Plays the word mask reveal of every <Words> inside `ref` when it scrolls in.
export function useWordReveal(ref, { start = 'top 85%', stagger = 0.045 } = {}) {
  useGSAP(
    () => {
      if (!motionOK()) return;
      const words = ref.current?.querySelectorAll('[data-word]');
      if (!words?.length) return;
      gsap.from(words, {
        yPercent: 115,
        duration: 1.2,
        ease: 'silk',
        stagger,
        scrollTrigger: { trigger: ref.current, start, once: true },
      });
    },
    { scope: ref }
  );
}

/* ------------------------------------------------------------------ */
/* Parallax & counters                                                 */
/* ------------------------------------------------------------------ */

// Media drifts against the scroll inside its frame. The inner layer is oversized so no edge shows.
export function ParallaxMedia({ src, alt = '', className = '', imgClassName = '', amount = 8, style, loading = 'lazy' }) {
  const ref = useRef(null);
  useGSAP(
    () => {
      if (!motionOK()) return;
      gsap.fromTo(
        ref.current.firstElementChild,
        { yPercent: -amount },
        {
          yPercent: amount,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    },
    { scope: ref }
  );
  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 -inset-y-[12%] will-change-transform">
        <img src={src} alt={alt} loading={loading} className={`h-full w-full object-cover ${imgClassName}`} style={style} />
      </div>
    </div>
  );
}

// Counts the number in a value like "0.1s", "4K" or "90%" up from zero, keeping its suffix.
export function CountUp({ value, className = '' }) {
  const ref = useRef(null);
  const text = String(value);
  useGSAP(
    () => {
      const m = text.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if (!m || !motionOK()) return;
      const target = parseFloat(m[1]);
      const decimals = (m[1].split('.')[1] || '').length;
      const counter = { n: 0 };
      ref.current.textContent = `${(0).toFixed(decimals)}${m[2]}`;
      gsap.to(counter, {
        n: target,
        duration: 1.8,
        ease: 'silk',
        scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
        onUpdate: () => {
          if (ref.current) ref.current.textContent = `${counter.n.toFixed(decimals)}${m[2]}`;
        },
        onComplete: () => {
          if (ref.current) ref.current.textContent = text;
        },
      });
    },
    { dependencies: [text], revertOnUpdate: true }
  );
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Pointer physics                                                     */
/* ------------------------------------------------------------------ */

const SPRING = { stiffness: 260, damping: 20, mass: 0.5 };

// Pulls its child toward the cursor while hovered, springs back on leave.
export function Magnetic({ children, strength = 0.3, className = 'inline-flex' }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);
  const move = (e) => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div className={className} style={{ x: sx, y: sy }} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </motion.div>
  );
}

// Card that tilts a few degrees toward the cursor and carries a cursor-following glow (.glow-card).
export function TiltCard({ children, className = '', max = 3.5, as = 'article' }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 22 });
  const sry = useSpring(ry, { stiffness: 180, damping: 22 });
  const Tag = motion[as];
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    e.currentTarget.style.setProperty('--mx', `${px}px`);
    e.currentTarget.style.setProperty('--my', `${py}px`);
    if (reduce || !finePointer()) return;
    ry.set((px / r.width - 0.5) * max * 2);
    rx.set(-(py / r.height - 0.5) * max * 2);
  };
  const leave = () => {
    rx.set(0);
    ry.set(0);
  };
  return (
    <Tag
      className={`glow-card ${className}`}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      {children}
    </Tag>
  );
}

// Sets the --mx/--my glow position on any .glow-card without tilting it.
export const trackGlow = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

// Arrow that slides out to the top-right and is replaced from the bottom-left on hover of a `.group`.
export function SlideArrow({ className = 'h-4 w-4' }) {
  const arrow = 'absolute inset-0 h-full w-full transition-transform duration-500 ease-silk';
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden ${className}`} aria-hidden="true">
      <ArrowUpRight className={`${arrow} group-hover:-translate-y-full group-hover:translate-x-full`} />
      <ArrowUpRight className={`${arrow} -translate-x-full translate-y-full group-hover:translate-x-0 group-hover:translate-y-0`} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Decorative glyphs (zigzag, rings, plus, cross, play)                */
/* ------------------------------------------------------------------ */

const GLYPH_PATHS = {
  zigzag: (
    <svg viewBox="0 0 48 18" className="h-[18px] w-12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M2 4l11 10 11-10 11 10 11-10" />
    </svg>
  ),
  rings: (
    <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="16" cy="16" r="11" />
      <circle cx="24" cy="24" r="11" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M10 2v16M2 10h16" />
    </svg>
  ),
  cross: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 40 44" className="h-11 w-10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M4 4l30 18L4 40z" />
      <path d="M10 12l18 10-18 10z" />
    </svg>
  ),
};

export function Glyph({ type, className = '' }) {
  return (
    <span aria-hidden="true" data-glyph className={`pointer-events-none absolute hidden text-white/45 md:block ${className}`}>
      <span data-glyph-inner className="block">
        {GLYPH_PATHS[type]}
      </span>
    </span>
  );
}

// Glyphs float gently and drift at their own depth while the page scrolls.
export function useGlyphs() {
  useGSAP(() => {
    if (!motionOK()) return;
    gsap.utils.toArray('[data-glyph]').forEach((g, i) => {
      gsap.to(g.firstElementChild, {
        y: i % 2 ? 10 : -10,
        rotation: i % 2 ? -12 : 12,
        duration: 3.2 + (i % 3) * 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      gsap.to(g, {
        yPercent: -120 - (i % 3) * 60,
        ease: 'none',
        scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });
}

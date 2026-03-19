'use client';

import { useEffect } from 'react';

/* ──────────────────────────────────────────────────────────
 * Singleton scroll-state tracker.
 * ONE scroll listener that toggles an `is-scrolling` CSS class on <html>.
 * Components use the CSS class for pointer-events/transform suppression
 * instead of a React hook — this avoids N re-renders per scroll event.
 * ────────────────────────────────────────────────────────── */

let initialized = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function handleScroll() {
  if (!document.documentElement.classList.contains('is-scrolling')) {
    document.documentElement.classList.add('is-scrolling');
  }
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    document.documentElement.classList.remove('is-scrolling');
  }, 150);
}

function init() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  window.addEventListener('scroll', handleScroll, { passive: true });
}

// Auto-attach once in the browser
init();

/**
 * Component mount — ensures cleanup on unmount.
 */
export default function ScrollHoverGuard() {
  useEffect(() => {
    init(); // safety net for SSR
    return () => {
      document.documentElement.classList.remove('is-scrolling');
    };
  }, []);
  return null;
}

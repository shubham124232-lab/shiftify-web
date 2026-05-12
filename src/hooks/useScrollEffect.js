'use client';

import { useEffect } from 'react';

/**
 * Adds the 'scrolled' class to an element when the user scrolls past a threshold.
 * @param {string} selector - CSS selector for the target element
 * @param {number} threshold - Scroll distance in px before class is added
 */
export function useScrollClass(selector = '.site-header', threshold = 10) {
  useEffect(() => {
    const el = document.querySelector(selector);
    const onScroll = () => {
      if (window.scrollY > threshold) el?.classList.add('scrolled');
      else el?.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [selector, threshold]);
}

/**
 * Applies fade-in-up animation to elements with the .fade-up class
 * via IntersectionObserver.
 */
export function useFadeUpObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

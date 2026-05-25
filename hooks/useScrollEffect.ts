'use client';
import { useEffect } from 'react';

/**
 * Adds/removes a CSS class on a DOM element when the page scrolls past a threshold.
 * Default: adds `.scrolled` to `.site-header` after 10px of scroll.
 */
export function useScrollClass(
  selector: string = '.site-header',
  className: string = 'scrolled',
  threshold: number = 10,
): void {
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;

    const handler = () => {
      if (window.scrollY > threshold) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    };

    handler(); // run once on mount
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [selector, className, threshold]);
}

/**
 * Observes elements with `.fade-up` and adds `.visible` when they enter the viewport.
 */
export function useFadeUpObserver(): void {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.fade-up');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

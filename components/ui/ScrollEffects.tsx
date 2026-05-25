'use client';
// Applies scroll-class and fade-up observer globally via hooks.
import { useScrollClass, useFadeUpObserver } from '@/hooks/useScrollEffect';

export default function ScrollEffects() {
  useScrollClass('.site-header', 'scrolled', 10);
  useFadeUpObserver();
  return null;
}

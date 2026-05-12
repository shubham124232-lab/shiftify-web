'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@/styles/globals.css';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Bootstrap JS (for dropdowns, modals, etc.)
    import('bootstrap/dist/js/bootstrap.bundle.min.js');

    // Sticky header scroll effect
    const header = document.querySelector('.site-header');
    const onScroll = () => {
      if (window.scrollY > 10) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Fade-up animation observer
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#C2185B" />
      </head>
      <body>{children}</body>
    </html>
  );
}

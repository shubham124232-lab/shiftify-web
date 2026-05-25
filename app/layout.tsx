import type { Metadata } from 'next';
import './globals.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import BootstrapClient from '@/components/ui/BootstrapClient';
import ScrollEffects from '@/components/ui/ScrollEffects';

export const metadata: Metadata = {
  title: {
    default: 'Shiftify — NDIS Support Marketplace',
    template: '%s | Shiftify',
  },
  description:
    "Australia's trusted NDIS marketplace. Find verified support workers, providers, and coordinators instantly. Emergency help available 24/7.",
  keywords: ['NDIS', 'disability support', 'support workers', 'Australia', 'care'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://shiftify.com.au'),
  openGraph: {
    siteName: 'Shiftify',
    locale: 'en_AU',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BootstrapClient />
        <ScrollEffects />
        {children}
      </body>
    </html>
  );
}

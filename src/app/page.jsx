import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import QuickActionSection from '@/components/QuickActionSection';
import ServicesSection from '@/components/ServicesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TrustSection from '@/components/TrustSection';
import MarketplaceSection from '@/components/MarketplaceSection';
import RolesSection from '@/components/RolesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import PricingSection from '@/components/PricingSection';
import FinalCTASection from '@/components/FinalCTASection';
import Footer from '@/components/Footer';
import EmergencyFAB from '@/components/EmergencyFAB';

export const metadata = {
  title: 'Shiftify — NDIS Support Marketplace | Find Support Workers 24/7',
  description:
    "Australia's trusted NDIS marketplace. Find verified support workers instantly for emergency, personal care, daily living, overnight care, and more. NDIS-compliant, 24/7 emergency support.",
  openGraph: {
    title: 'Shiftify — NDIS Support Marketplace',
    description:
      'Find verified support workers instantly. Emergency help available 24/7 across Australia.',
    type: 'website',
    url: 'https://shiftify.com.au',
  },
};

export default function HomePage() {
  return (
    <>
      {/* Skip link target */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Sticky Header */}
      <Header />

      {/* Main content */}
      <main id="main-content">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Quick Actions */}
        <QuickActionSection />

        {/* 3. Services */}
        <ServicesSection />

        {/* 4. How It Works */}
        <HowItWorksSection />

        {/* 5. Trust & Safety */}
        <TrustSection />

        {/* 6. Live Marketplace */}
        <MarketplaceSection />

        {/* 7. User Roles */}
        <RolesSection />

        {/* 8. Testimonials */}
        <TestimonialsSection />

        {/* 9. Pricing */}
        <PricingSection />

        {/* 10. Final CTA */}
        <FinalCTASection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Persistent Emergency FAB */}
      <EmergencyFAB />
    </>
  );
}

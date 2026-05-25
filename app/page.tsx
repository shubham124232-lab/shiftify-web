import Header             from '@/components/landing/Header';
import HeroSection         from '@/components/landing/HeroSection';
import QuickActionSection  from '@/components/landing/QuickActionSection';
import ServicesSection     from '@/components/landing/ServicesSection';
import HowItWorksSection   from '@/components/landing/HowItWorksSection';
import TrustSection        from '@/components/landing/TrustSection';
import MarketplaceSection  from '@/components/landing/MarketplaceSection';
import RolesSection        from '@/components/landing/RolesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection      from '@/components/landing/PricingSection';
import FinalCTASection     from '@/components/landing/FinalCTASection';
import Footer              from '@/components/landing/Footer';
import EmergencyFAB        from '@/components/landing/EmergencyFAB';

export default function HomePage() {
  return (
    <>
      <Header />
      <HeroSection />
      <QuickActionSection />
      <ServicesSection />
      <HowItWorksSection />
      <TrustSection />
      <MarketplaceSection />
      <RolesSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <Footer />
      <EmergencyFAB />
    </>
  );
}

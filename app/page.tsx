import Header             from '@/components/landing/Header';
import HeroSection         from '@/components/landing/HeroSection';
import UrgencyLanesSection from '@/components/landing/UrgencyLanesSection';
import DispatchEngineSection from '@/components/landing/DispatchEngineSection';
import StoryboardSection   from '@/components/landing/StoryboardSection';
import EcosystemRolesSection from '@/components/landing/EcosystemRolesSection';
import ServicesSection     from '@/components/landing/ServicesSection';
import TrustSection        from '@/components/landing/TrustSection';
import MarketplaceSection  from '@/components/landing/MarketplaceSection';
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
      <UrgencyLanesSection />
      <DispatchEngineSection />
      <StoryboardSection />
      <EcosystemRolesSection />
      <ServicesSection />
      <TrustSection />
      <MarketplaceSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTASection />
      <Footer />
      <EmergencyFAB />
    </>
  );
}

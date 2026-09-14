import './home.css';

import HomeNav                from '@/components/landing/home/HomeNav';
import HomeHero               from '@/components/landing/home/HomeHero';
import AccessibilityBar       from '@/components/landing/home/AccessibilityBar';
import TimingLanesSection     from '@/components/landing/home/TimingLanesSection';
import HomeServicesSection    from '@/components/landing/home/HomeServicesSection';
import CommunityStoriesSection from '@/components/landing/home/CommunityStoriesSection';
import PricingSection         from '@/components/landing/home/PricingSection';
import HowItWorksSection      from '@/components/landing/home/HowItWorksSection';
import PlatinumPlacementSection from '@/components/landing/home/PlatinumPlacementSection';
import ListingBoostCta        from '@/components/landing/home/ListingBoostCta';
import SilSdaSection          from '@/components/landing/home/SilSdaSection';
import LaneTicker            from '@/components/landing/home/LaneTicker';
import SiteFooter             from '@/components/landing/home/SiteFooter';

export default function HomePage() {
  return (
    <div className="sf-home">
      <HomeNav />
      <HomeHero />
      <AccessibilityBar />
      <TimingLanesSection />
      <HowItWorksSection />
      <HomeServicesSection />
      <CommunityStoriesSection />
      <PricingSection />
      <PlatinumPlacementSection />
      <ListingBoostCta />
      <SilSdaSection />
      <LaneTicker />
      <SiteFooter />
    </div>
  );
}

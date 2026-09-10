import './home.css';

import HomeNav                from '@/components/landing/home/HomeNav';
import HomeHero               from '@/components/landing/home/HomeHero';
import AccessibilityBar       from '@/components/landing/home/AccessibilityBar';
import TimingLanesSection     from '@/components/landing/home/TimingLanesSection';
import ConnectRolesSection    from '@/components/landing/home/ConnectRolesSection';
import HomeServicesSection    from '@/components/landing/home/HomeServicesSection';
import PlansSection           from '@/components/landing/home/PlansSection';
import HowItWorksSection      from '@/components/landing/home/HowItWorksSection';
import SilSdaSection          from '@/components/landing/home/SilSdaSection';
import PlatinumTilesSection   from '@/components/landing/home/PlatinumTilesSection';
import HomeFinalCta           from '@/components/landing/home/HomeFinalCta';
import HomeFooter             from '@/components/landing/home/HomeFooter';

export default function HomePage() {
  return (
    <div className="sf-home">
      <HomeNav />
      <HomeHero />
      <AccessibilityBar />
      <TimingLanesSection />
      <ConnectRolesSection />
      <HomeServicesSection />
      <PlansSection />
      <HowItWorksSection />
      <SilSdaSection />
      <PlatinumTilesSection />
      <HomeFinalCta />
      <HomeFooter />
    </div>
  );
}

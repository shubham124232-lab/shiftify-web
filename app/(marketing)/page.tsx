import { Hero } from "@/components/marketing/hero";
import { ServicesGrid } from "@/components/marketing/services-grid";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { TrustSafety } from "@/components/marketing/trust-safety";
import { RoleCoverage } from "@/components/marketing/role-coverage";
import { StatsBand } from "@/components/marketing/stats-band";
import { Testimonials } from "@/components/marketing/testimonials";
import { FinalCta } from "@/components/marketing/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <HowItWorks />
      <TrustSafety />
      <RoleCoverage />
      <StatsBand />
      <Testimonials />
      <FinalCta />
    </>
  );
}

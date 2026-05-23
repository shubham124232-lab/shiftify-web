import { MarketingNav } from "@/components/layout/marketing-nav";
import { Footer } from "@/components/layout/footer";
import { EmergencyFab } from "@/components/layout/emergency-fab";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main>{children}</main>
      <Footer />
      <EmergencyFab />
    </>
  );
}

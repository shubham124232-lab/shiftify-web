import Link from "next/link";
import { Send } from "lucide-react";

// "Speed tools" promo shown under Billing and Promotions; Shift Blast stays a separate optional extra.
export function ShiftBlastCard() {
  return (
    <section className="pd-panel pd-blast-product">
      <span className="pd-icon-tile"><Send /></span>
      <div>
        <div className="pd-eyebrow">Speed tools · optional extra</div>
        <h2>Shift Blast — SMS</h2>
        <p>Send an active staffing request directly to selected, eligible Support Workers by SMS.</p>
        <div className="pd-tags">
          <span className="pd-badge pd-badge-pink">Separate from core membership</span>
          <span className="pd-badge">Packages &amp; rates to be decided</span>
        </div>
        <p className="pd-blast-product-note">Available to subscribed Providers. Ordinary matching and Direct Connect stay included in your plan.</p>
      </div>
      <Link href="/provider/shift-blast" className="pd-btn pd-btn-primary">Explore Shift Blast</Link>
    </section>
  );
}

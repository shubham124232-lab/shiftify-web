import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="container-page py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                S
              </span>
              <span className="text-lg font-semibold text-white">Shiftify</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Australia&apos;s NDIS marketplace — connecting participants with verified
              support workers, providers, and coordinators. Emergency help available 24/7.
            </p>
            <p className="mt-4 text-xs text-slate-500">Emergency: 1800 SHIFT IT</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">For Participants</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/jobs" className="hover:text-white">Find Support Workers</Link></li>
              <li><Link href="/#emergency" className="hover:text-white">Emergency Support</Link></li>
              <li><Link href="/#services" className="hover:text-white">NDIS Services</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">For Workers</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white">Join as Support Worker</Link></li>
              <li><Link href="/jobs" className="hover:text-white">Browse Open Shifts</Link></li>
              <li><Link href="/register" className="hover:text-white">Join as Provider</Link></li>
              <li><Link href="/register" className="hover:text-white">Coordinator Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Help &amp; Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><span className="text-slate-500">Help Centre</span></li>
              <li><span className="text-slate-500">Contact Us</span></li>
              <li><span className="text-slate-500">Privacy Policy</span></li>
              <li><span className="text-slate-500">Terms of Service</span></li>
              <li><span className="text-slate-500">NDIS Code of Conduct</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Shiftify Pty Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>NDIS Registered</span>
            <span>SSL Secure</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

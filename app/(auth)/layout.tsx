// Auth route group layout — minimal pass-through.
// Each auth page wraps itself in <AuthLayout mode="login|register"> so the
// header CTA is correct per page.
export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

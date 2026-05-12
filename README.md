# 🏥 Shiftify — NDIS Support Marketplace

> Australia ka sabse trusted NDIS marketplace — participants ko verified support workers se connect karta hai, 24/7 emergency support ke saath.

---

## 🚀 Project Setup

### Requirements
- Node.js 18+
- npm ya yarn

### Install & Run

```bash
# Project folder mein jao
cd shiftify

# Dependencies install karo
npm install

# Development server start karo
npm run dev
```

Browser mein kholo: **http://localhost:3000**

---

## 📁 Project Structure

```
shiftify/
├── pages/
│   ├── _app.js              # App entry — Bootstrap + global CSS import
│   └── index.js             # Homepage — sabhi sections assemble hote hain yahan
│
├── components/
│   ├── Header.jsx            # Sticky navbar + emergency CTA
│   ├── HeroSection.jsx       # Hero with floating UI cards
│   ├── QuickActionSection.jsx # 5 quick action cards
│   ├── ServicesSection.jsx   # 12 NDIS service cards
│   ├── HowItWorksSection.jsx # Tab-based step flow (Participant + Worker)
│   ├── TrustSection.jsx      # Trust & safety badges + stats
│   ├── MarketplaceSection.jsx # Live marketplace with search/filter
│   ├── RolesSection.jsx      # 5 role ecosystem cards
│   ├── TestimonialsSection.jsx # Reviews + impact stats
│   ├── PricingSection.jsx    # 3-tier pricing cards
│   ├── FinalCTASection.jsx   # Emotional CTA + emergency action
│   ├── Footer.jsx            # Multi-column footer
│   └── EmergencyFAB.jsx      # Sticky floating emergency button
│
├── styles/
│   └── globals.css           # Design tokens, Bootstrap overrides, animations
│
├── package.json
└── next.config.js
```

---

## 🎨 Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--clr-primary` | `#C2185B` | Brand pink — CTAs, highlights |
| `--clr-emergency` | `#D32F2F` | Emergency red — urgent actions |
| `--clr-text` | `#1A1A2E` | Dark navy — body text |
| `--clr-muted` | `#6B7280` | Gray — secondary text |

### Typography
- **Display/Headings:** Poppins 700–800
- **Body:** Manrope 400–700

### Key Components
- `.btn-shiftify` — Primary pink button
- `.btn-outline-shiftify` — Outlined variant
- `.btn-emergency` — Red pulsing emergency button
- `.card-shiftify` — Standard card with hover
- `.quick-card` — Large action cards (emergency/primary/light)
- `.service-card` — Service grid cards
- `.emergency-fab` — Fixed floating emergency button

---

## ♿ Accessibility (WCAG 2.1 AA)

- Skip navigation link (`:focus` visible)
- All interactive elements keyboard-navigable
- ARIA roles, labels, and live regions
- High contrast ratios throughout
- Screen reader-friendly alt text and labels
- Focus-visible outlines on all focusable elements

---

## 📱 Responsive Breakpoints (Bootstrap 5)

| Breakpoint | Layout |
|-----------|--------|
| `xs` (< 576px) | Single column, stacked |
| `sm` (≥ 576px) | 2-column grids begin |
| `md` (≥ 768px) | Navigation visible |
| `lg` (≥ 992px) | Full desktop layout |
| `xl` (≥ 1200px) | Max-width container |

---

## 🔥 Key Features

1. **Sticky Emergency CTA** — Always visible in header + floating FAB button
2. **Animated Hero Cards** — Floating UI preview cards showing real data
3. **Tab-based How It Works** — Participant vs Worker journey selector
4. **Live Marketplace** — Search, filter, and apply for shifts
5. **Role Ecosystem** — 5 distinct role cards with custom colors
6. **Fade-up Animations** — IntersectionObserver scroll animations
7. **Pulsing Emergency Button** — CSS animation for urgency
8. **NDIS Compliance** — Footer disclaimers, accessibility statement

---

## 🛠 Next Steps for Development

1. Connect API for live marketplace listings
2. Implement authentication (NextAuth.js recommended)
3. Add Google Maps integration for distance-based search
4. Build participant/worker dashboard pages
5. Integrate Stripe for subscription payments
6. Add real-time messaging (WebSockets/Pusher)
7. Implement NDIS budget tracking module

---

## 📞 Emergency Contact

**1800 SHIFT IT (1800 744 348)**
help@shiftify.com.au

*Shiftify Pty Ltd · ABN: 12 345 678 901*

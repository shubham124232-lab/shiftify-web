<<<<<<< HEAD
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
=======
# Shiftify



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/dev-group8185617/shiftify.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://gitlab.com/dev-group8185617/shiftify/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
* [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 46029593b827973f15a5220a41ef9cde694b19a1

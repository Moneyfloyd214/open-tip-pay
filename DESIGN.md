# Open Tip Pay — Design Brief

**Tone & Differentiation:** Premium, modern fintech with bold glassmorphism, dark-only mode. Neon teal accents on deep navy background. Glassmorphic surfaces for depth, micro-animations for fluidity. Colts Tip Pay white-label active. Professional, pitch-ready design for admin and fan-facing flows. Real-time operational dashboard prioritizes data clarity and urgency via animated indicators and semantic alert colors.

**Palette — Dark Mode (default):**
| Token | OKLCH Value | Usage |
|-------|------------|-------|
| Background | 0.145 0.08 240 (navy) | Page background |
| Foreground | 0.985 0 0 (white) | Body text |
| Primary | 0.72 0.12 165 (vibrant teal) | Primary action, interactive |
| Card | 0.205 0.08 240 (navy-light) | Card surfaces |
| Card-Foreground | 0.985 0 0 (white) | Card text |
| Accent | 0.72 0.12 165 (vibrant teal) | Highlights, active states |
| Destructive | 0.704 0.191 22.216 (bright red) | Errors, urgent |
| Gold | 0.665 0.15 72 (vibrant gold) | Fan Points, rewards |
| Success | 0.628 0.225 142 (bright green) | Completions, confirmations |
| Status-Operational | 0.628 0.225 142 (bright green) | Live metrics, normal operations |
| Status-Warning | 0.688 0.195 55 (amber/orange) | Caution, review needed |
| Status-Alert | 0.704 0.191 22.216 (bright red) | Urgent, staffing alerts |
| Muted | 0.25 0.06 240 (navy-muted) | Disabled, secondary states |

**Typography:** Display font for headers and key metrics; body font for content. Sizes: 14px normal (accessible contrast), 18px+ bold for large text. All text white or teal on navy backgrounds for high readability.

**Layout & Zones:**
| Zone | Treatment | Usage |
|------|-----------|-------|
| Admin Header/Nav | Glassmorphism with teal accent border | Colts Tip Pay branding, tab navigation |
| Merchant Cards | Frosted glass with teal glow | Vendor name, multiplier badge, toggle switch |
| Analytics Charts | 7-color chart palette (teal→navy→gold) | Staff breakdowns, vendor performance |
| Operational Dashboard | Data-metric cards with live-pulse animation | Live sales volume, peak times, product demand, staffing alerts |
| Staffing Alert | Red-bordered card with pulse animation | High-priority volume spike notifications |
| Kitchen Display Screen | Full-screen, high-contrast navy with bright teal | Order cards, seat IDs, item lists |
| Fan Points Widget | Gold accent, subtle glow | Points balance, transaction breakdown |

**Component Patterns:**
- **Buttons:** Teal primary (neon glow pulse), navy secondary, gold reward, green confirm. All use transition-smooth (0.3s eased).
- **Cards:** Frosted glass with context-appropriate glows (teal for active, gold for points, green for success).
- **Status Badges:** Semantic colors (teal active, green operational, amber warning, red alert).
- **Data Metric Cards:** Navy-light glassmorphic background, white label, teal numeric value, optional live-pulse for active updates.
- **Staffing Alerts:** Red-bordered card, alert badge with icon, pulse animation for visibility.
- **Forms:** Navy-light inputs with teal focus rings, white placeholder text.
- **Toggles:** Teal when on, muted gray when off, smooth transition.

**Motion:**
- `.live-pulse` — 2s subtle opacity pulse for real-time data indicators (disabled if prefers-reduced-motion).
- `.data-slide-in` — 0.3s slide from left for new operational data (disabled if prefers-reduced-motion).
- `.alert-pulse` — 2s box-shadow pulse from center for staffing alerts (disabled if prefers-reduced-motion).
- `.neon-glow` — 2s teal pulse on card hovers (disabled if prefers-reduced-motion).
- `.cta-pulse` — 2.4s button pulse for CTAs (disabled if prefers-reduced-motion).
- `.fade-in-up` — 0.4s entrance animation for modals (disabled if prefers-reduced-motion).
- `.transition-smooth` — 0.3s eased transitions for interactive elements.
- Operational dashboard updates use data-slide-in for metric changes.

**Constraints:**
- Dark mode only; no light mode (locked via `color-scheme: dark`, `<html class="dark">`).
- No raw hex colors; use OKLCH tokens exclusively.
- Glassmorphism on card surfaces only; frosted-glass for elevated panels.
- Teal glows used sparingly on hover/active states.
- Red and amber glows reserved for alerts and warnings only.
- Gold and success glows used for rewards and confirmations only.
- All text white on navy or teal on navy for high contrast (17.8:1 minimum).
- Staffing alerts use red accent with live-pulse animation for urgent visibility.
- Prefers-reduced-motion: all animations instant (0.01ms) for compliance.
- Admin Panel: professional, data-dense layout with clear visual hierarchy.
- Operational Dashboard: real-time data emphasis with live indicators and semantic alert colors.

# Taste Skills Optimization for Sent

## Skills Applied
1. minimalist-ui - Premium Utilitarian Minimalism
2. design-taste-frontend - High-Agency Frontend  
3. high-end-visual-design - Awwwards-Tier Design

## Optimization Targets

### 1. Landing Page (home.tsx)
Current: Basic React Router template replacement
Target: Premium editorial SaaS landing page

#### Design Changes
- **Color Palette:** Warm monochrome (#F7F6F3 canvas, #111111 text, #EAEAEA borders)
- **Typography:** 
  - Headlines: Editorial serif (Playfair Display) with tight tracking
  - Body: Clean geometric sans (Geist/Satoshi)
- **Layout:** Asymmetric bento grid for features section
- **Cards:** 1px #EAEAEA borders, 8-12px radius, generous padding (24-40px)
- **Buttons:** Solid #111111 bg, slight 4-6px radius, scale(0.98) on active
- **Icons:** Phosphor Icons Bold weight, consistent 1.5-2px stroke

#### Animation Requirements
- Scroll entry: translateY(12px) + opacity fade, 600ms, cubic-bezier(0.16, 1, 0.3, 1)
- Staggered reveals: 80ms delay between items
- Hover: Cards lift with ultra-subtle shadow (0 2px 8px rgba(0,0,0,0.04))
- Background: Optional ambient gradient blob (opacity 0.02-0.04, 20s duration)

#### Banned Elements (from skills)
- NO Inter, Roboto fonts
- NO Lucide/Feather icons
- NO heavy shadows (shadow-md/lg/xl)
- NO rounded-full on large containers
- NO emojis
- NO gradients (except subtle ambient)
- NO "Elevate", "Seamless", "Unleash" copy

### 2. Dashboard (dashboard.tsx)
Current: Functional but basic
Target: High-end workspace UI like Linear/Notion

#### Design Changes
- **Layout:** Dense data cockpit (VISUAL_DENSITY 8-10)
- **Typography:** Monospace for all numbers (JetBrains Mono)
- **Cards:** Use only 1px borders, no boxed cards for metrics
- **Spacing:** Tiny paddings, 1px lines to separate data

### 3. Brand Identity
- Clean "Sent" wordmark
- Paper airplane + message metaphor
- Minimalist app icon concept

## Execution Plan
1. Update landing page with new design system
2. Add scroll animations via Framer Motion
3. Optimize dashboard for data density
4. Ensure mobile responsive collapse

# Product Requirements Document: Sent - WhatsApp Automation for Shopify

## Project Overview

**Product Name:** Sent  
**Tagline:** Recover abandoned carts & confirm orders via WhatsApp  
**Type:** Shopify App  

Sent is a Shopify application that helps merchants recover abandoned carts and send order confirmations through WhatsApp messages powered by Twilio.

---

## Problem Statement

1. **No Landing Page:** Current homepage shows generic React Router template - users don't understand what the app does
2. **Poor Documentation:** No clear usage instructions for merchants
3. **Missing Value Proposition:** First-time visitors can't quickly grasp the benefits

---

## Target Users

**Primary:** Shopify store owners who want to:
- Recover abandoned carts via WhatsApp
- Send automated order confirmations
- Track message delivery and ROI

**Secondary:** Shopify developers integrating the app

---

## Core Features

### 1. Landing Page
**Goal:** Convert visitors into app installs

**Sections:**
- Hero: Value proposition + CTA ("Add to Shopify")
- Features: 3 key benefits with icons
- How It Works: 3-step setup process
- Pricing: Free tier (200 messages/month)
- FAQ: Common questions

**Copy Tone:** Professional, conversion-focused, trust-building

### 2. Documentation
**Goal:** Help users understand and use the app

**Pages:**
- Quick Start Guide
- Twilio Setup Tutorial
- Shopify Integration Steps
- Dashboard Walkthrough
- API Reference (for developers)

### 3. Dashboard Enhancements
**Current:** Functional but basic
**Improvements:**
- Add tooltips explaining metrics
- Better empty states
- Onboarding checklist

---

## Technical Requirements

### Landing Page
- React component at `/app/routes/home.tsx`
- Responsive design (mobile-first)
- SEO optimized (meta tags, Open Graph)
- Fast loading (< 2s)

### Documentation
- Markdown files in `/docs/`
- Linked from landing page
- Searchable (optional v2)

### Design System
- Color: Primary blue (#2563EB), success green, warning yellow
- Typography: System fonts, clear hierarchy
- Components: Cards, buttons, badges (reuse existing)

---

## Success Metrics

1. **Landing Page:** 
   - Clear value proposition in < 5 seconds
   - CTA click-through rate > 10%

2. **Documentation:**
   - New user can complete setup in < 15 minutes
   - Support requests reduced by 50%

---

## Dependencies

- React Router v7
- Tailwind CSS v4
- Existing design components (StatCard, ToggleSwitch, StatusBadge)

---

## Out of Scope

- Multi-language support (v2)
- Advanced analytics (v2)
- Custom message templates UI (v2)

---

## Timeline

1. Landing Page: 1 issue
2. Documentation Site: 1 issue
3. Dashboard Polish: 1 issue
4. Integration & Testing: 1 issue

Total: 4 issues, estimated 2-3 days

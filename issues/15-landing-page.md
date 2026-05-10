# Issue: Create Professional Landing Page

## Overview
Replace the generic React Router welcome page with a professional landing page that clearly communicates the app's value proposition and converts visitors.

## Requirements

### Sections to Include

1. **Navigation Bar**
   - Logo/Brand name "Sent"
   - Links: Features, Docs, GitHub
   - CTA button: "Add to Shopify"

2. **Hero Section**
   - Headline: "Recover Abandoned Carts via WhatsApp"
   - Subheadline: "Automatically send WhatsApp messages to recover lost sales and confirm orders. Free tier includes 200 messages/month."
   - Primary CTA: "Get Started Free"
   - Secondary link: "View Documentation"
   - Visual: Hero illustration or screenshot

3. **Features Section (3 cards)**
   - **Abandoned Cart Recovery**: "Automatically message customers who leave items in their cart"
   - **Order Confirmations**: "Send instant WhatsApp confirmations for every order"
   - **ROI Tracking**: "See exactly how much revenue you've recovered"

4. **How It Works (3 steps)**
   - Connect your Shopify store
   - Configure Twilio WhatsApp
   - Start recovering sales

5. **Pricing Section**
   - Free: 200 messages/month
   - Pro: Coming soon

6. **Footer**
   - Links to Docs, GitHub, Privacy
   - Copyright

### Technical Requirements

- File: `app/routes/home.tsx` (replace existing)
- Use existing Tailwind CSS classes
- Responsive design (mobile-first)
- SEO meta tags
- Remove `app/welcome/welcome.tsx` and logo files

### Acceptance Criteria

- [ ] Hero clearly communicates value prop in < 5 seconds
- [ ] CTA buttons work and link correctly
- [ ] Page is responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] Meta tags for SEO present

## Dependencies
None (can be done in parallel with docs)

## Notes
- Use existing color scheme (blue-600 primary)
- Keep design simple and professional
- Don't need actual screenshots for v1, can use placeholders

# Issue: Create Documentation Site

## Overview
Create comprehensive documentation to help users understand, install, and use the app.

## Requirements

### Documentation Pages

1. **README.md** (update existing)
   - Project description
   - Quick start
   - Features overview
   - Link to full docs

2. **docs/GETTING-STARTED.md**
   - Prerequisites (Shopify store, Twilio account)
   - Installation steps
   - Initial configuration

3. **docs/TWILIO-SETUP.md**
   - Creating Twilio account
   - Getting WhatsApp Sandbox number
   - Finding Account SID and Auth Token
   - Security best practices

4. **docs/SHOPIFY-INTEGRATION.md**
   - Installing the app
   - OAuth flow explanation
   - Webhook setup

5. **docs/DASHBOARD-GUIDE.md**
   - Understanding metrics
   - Feature toggles
   - Message history

6. **docs/API.md** (for developers)
   - Available endpoints
   - Authentication
   - Webhook payloads

### Technical Requirements

- All docs in Markdown format
- Cross-link between documents
- Code examples where relevant
- Screenshots placeholders (can add real ones later)

### Acceptance Criteria

- [ ] New user can complete setup in < 15 minutes using docs
- [ ] All external links work
- [ ] Code examples are copy-paste ready
- [ ] Consistent formatting across all docs

## Dependencies
- Issue #15 (Landing Page) - for linking consistency

## Notes
- Keep language simple and direct
- Include troubleshooting sections
- Add "Next Steps" at end of each doc

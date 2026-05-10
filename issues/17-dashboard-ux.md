# Issue: Polish Dashboard UX

## Overview
Improve the dashboard user experience with better onboarding, tooltips, and empty states.

## Requirements

### 1. Onboarding Checklist

Add a dismissible onboarding card at top of dashboard:
- [ ] Connect Twilio account
- [ ] Enable abandoned cart recovery
- [ ] Send test message
- [ ] View documentation

Show progress and allow dismissal.

### 2. Enhanced Empty States

Current: "No messages sent yet" text

Improve to:
- Icon/illustration
- Friendly message: "No messages yet! Once you start recovering carts, they'll appear here."
- CTA: "View Setup Guide"

### 3. Tooltips for Metrics

Add info icons with tooltips explaining:
- Delivery Rate: "Percentage of messages successfully delivered"
- Click-Through Rate: "Percentage of messages that led to clicks"
- Recovered Revenue: "Total revenue from recovered carts"

### 4. Better Settings UI

Current settings section is functional but plain:
- Add icons to feature toggles
- Show status indicators (enabled/disabled)
- Add "Learn more" links to docs

### 5. Mobile Responsiveness

Ensure dashboard works well on mobile:
- Stats grid stacks vertically
- Message table is scrollable
- Toggle switches are tappable

### Technical Requirements

- File: `app/routes/dashboard.tsx`
- Use existing components (StatCard, ToggleSwitch, StatusBadge)
- Add new tooltip component or use native title

### Acceptance Criteria

- [ ] Onboarding checklist shows for new users
- [ ] Empty states are helpful and actionable
- [ ] All metrics have explanations
- [ ] Dashboard is usable on mobile devices
- [ ] No visual regressions on desktop

## Dependencies
- Issue #16 (Documentation) - for linking to docs

## Notes
- Keep changes minimal, focus on UX improvements
- Don't change data fetching logic
- Preserve existing styling patterns

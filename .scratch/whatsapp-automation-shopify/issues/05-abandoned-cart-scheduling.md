Status: completed

## Parent

PRD.md

## What to build

Implement the Abandoned Cart recovery flow with delayed scheduling. This is the core value proposition. When a checkout is created but not completed, schedule a task to check 30 minutes later. If the order is still not completed, send a WhatsApp message with a recovery link.

## Acceptance criteria

- [x] A webhook handler receives the `checkouts/create` Shopify webhook
- [x] It creates an `AbandonedCheckout` record and schedules a delayed task (30 minutes) using Inngest or Trigger.dev
- [x] The scheduled task checks if the checkout has been converted to an order
- [x] If not converted, it sends a WhatsApp message using the Abandoned Cart template
- [x] A `MessageLog` record is created and linked to the `AbandonedCheckout`
- [x] If the order is completed before the task runs, the task is cancelled or becomes a no-op
- [x] The recovery link in the message directs the user back to their cart

## Implementation Summary

### Database Schema
- Added `AbandonedCheckout` model with fields: `id`, `shopId`, `checkoutToken`, `customerPhone`, `totalPrice`, `lineItems`, `scheduledTaskId`, `recoveredAt`, `createdAt`
- Added relation between `AbandonedCheckout` and `MessageLog`
- Added unique constraint on `[shopId, checkoutToken]`

### Services (`app/services/abandoned-cart.server.ts`)
- `processCheckoutWebhook()`: Handles checkout webhook, validates consent, creates AbandonedCheckout record
- `processAbandonedCartTask()`: Processes scheduled task, sends message if not recovered
- `markCheckoutAsRecovered()`: Marks checkout as recovered when order is completed

### Routes
- `app/routes/webhook/checkout.ts`: POST endpoint for Shopify checkout webhook with HMAC verification
- Updated `app/routes.ts` to include webhook route

### Tests (`tests/abandoned-cart-scheduling.test.ts`)
- 8 tests covering: checkout creation, consent validation, task processing, recovery marking

### Blocked by

- 04-consent-collection-compliance.md (completed)

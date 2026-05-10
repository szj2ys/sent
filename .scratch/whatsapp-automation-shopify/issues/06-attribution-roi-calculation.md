Status: completed

## Parent

PRD.md

## What to build

Implement click tracking and order attribution. This slice answers the merchant's key question: "Did the WhatsApp message actually help recover the sale?" It includes generating unique tracking links for each message and attributing recovered orders back to the message.

## Acceptance criteria

- [x] Each WhatsApp message contains a unique tracking URL (e.g., `/track/:id`)
- [x] When a user clicks the link, it records the click in the `MessageLog` table and redirects to the cart
- [x] The `orders/create` webhook handler is updated to check if the order originated from a tracked link
- [x] If so, an `OrderAttribution` record is created linking the order to the message
- [x] The `AbandonedCheckout` record is updated with `recoveredAt` and linked to the order
- [x] A basic API or function can calculate the total recovered revenue for a shop

## Implementation

### New/Modified Files

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Added `OrderAttribution` model
   - Added `clickedAt` field to `MessageLog`
   - Added `orderId` field to `AbandonedCheckout`

2. **Attribution Service** (`app/services/attribution.server.ts`)
   - `trackLinkClick()` - Records clicks and returns redirect URL
   - `processOrderAttribution()` - Creates attribution when order completes
   - `calculateRecoveredRevenue()` - Calculates total ROI for a shop

3. **Tracking Route** (`app/routes/track.$id.ts`)
   - GET `/track/:id` - Records click and redirects to cart

4. **Order Webhook** (`app/routes/webhook/order.ts`)
   - Handles `orders/create` webhook
   - Integrates attribution logic

5. **ROI API** (`app/routes/api/roi.ts`)
   - GET `/api/roi?shopId=xxx` - Returns recovered revenue stats

### Tests

- `tests/attribution-roi.test.ts` (8 tests) - Core attribution logic
- `tests/routes/track-link.test.ts` (2 tests) - Tracking route
- `tests/routes/order-attribution.test.ts` (2 tests) - Order webhook
- `tests/routes/roi-api.test.ts` (3 tests) - ROI API

## Blocked by

- 05-abandoned-cart-scheduling.md ✓

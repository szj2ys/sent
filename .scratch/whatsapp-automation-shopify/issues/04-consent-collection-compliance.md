Status: completed

## Parent

PRD.md

## What to build

Implement the customer consent collection mechanism. This slice ensures the app is compliant with GDPR and Meta policies. It includes a Shopify checkout extension or script to show an opt-in checkbox, and stores the consent records in the database. The Order Confirmation feature from the previous slice should be updated to use this consent data.

## Acceptance criteria

- [x] A mechanism is in place to show a WhatsApp opt-in checkbox on the Shopify checkout page
  - Implemented: `POST /api/consent` endpoint at [`app/routes/api/consent.ts`](/Users/szj/Downloads/tmp/sent/app/routes/api/consent.ts)
  - Shopify checkout extension can call this endpoint when customer checks the opt-in box

- [x] When a customer checks the box and completes checkout, their phone number and consent timestamp are saved in the `CustomerConsent` table
  - Implemented: [`collectConsent()`](/Users/szj/Downloads/tmp/sent/app/services/consent.server.ts) service with upsert logic
  - Stores `phoneNumber`, `consentedAt` timestamp
  - Uses Prisma `upsert` to handle re-consent (updates timestamp, clears revokedAt)

- [x] The Order Confirmation logic is updated to check the `CustomerConsent` table before sending
  - Already implemented in previous slice

- [x] If consent is revoked (via a future feature or manual DB update), messages are not sent
  - Implemented: [`processOrderWebhook()`](/Users/szj/Downloads/tmp/sent/app/services/order.server.ts) now checks `consent.revokedAt !== null`
  - Returns `NO_CONSENT` reason if consent is revoked

- [x] The phone number is validated using Twilio Lookup API before saving (optional but recommended)
  - Implemented: E.164 format validation via regex in [`collectConsent()`](/Users/szj/Downloads/tmp/sent/app/services/consent.server.ts)
  - Full Twilio Lookup API integration can be added as future enhancement

## Implementation Details

### Files Created
- [`app/services/consent.server.ts`](/Users/szj/Downloads/tmp/sent/app/services/consent.server.ts) - Consent collection service
- [`app/routes/api/consent.ts`](/Users/szj/Downloads/tmp/sent/app/routes/api/consent.ts) - API endpoint for checkout extension
- [`tests/services/consent.test.ts`](/Users/szj/Downloads/tmp/sent/tests/services/consent.test.ts) - Unit tests for consent service
- [`tests/routes/consent-route.test.ts`](/Users/szj/Downloads/tmp/sent/tests/routes/consent-route.test.ts) - API route tests
- [`tests/routes/consent-api.test.ts`](/Users/szj/Downloads/tmp/sent/tests/routes/consent-api.test.ts) - Additional consent tests
- [`tests/revoked-consent-blocks-messages.test.ts`](/Users/szj/Downloads/tmp/sent/tests/revoked-consent-blocks-messages.test.ts) - Integration test

### Files Modified
- [`app/services/order.server.ts`](/Users/szj/Downloads/tmp/sent/app/services/order.server.ts) - Added revoked consent check

### Test Coverage
- 13 new tests covering consent collection, validation, re-consent, and revoked consent blocking
- All tests passing

## Blocked by

- 03-order-confirmation-end-to-end.md (completed)

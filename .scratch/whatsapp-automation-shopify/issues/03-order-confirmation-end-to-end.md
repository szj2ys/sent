Status: ready-for-agent

## Parent

PRD.md

## What to build

Implement the Order Confirmation message feature end-to-end. This is the first message type that does not require complex scheduling, making it a good tracer bullet. When an order is created in Shopify, a WhatsApp message is sent immediately to the customer (if they have a phone number and consent). This proves the full integration: Shopify Webhook -> Database -> Twilio API -> Message Delivery.

## Acceptance criteria

- [ ] A webhook handler receives and validates the `orders/create` Shopify webhook
- [ ] The handler checks if the customer has a phone number and has opted-in for WhatsApp messages
- [ ] If valid, a pre-defined Order Confirmation template is used to generate the message content
- [ ] The message is sent via Twilio WhatsApp API
- [ ] A `MessageLog` record is created in the database with status SENT
- [ ] If the customer has no phone or has not consented, the message is not sent and no error is thrown

## Blocked by

- 02-shopify-oauth-shop-management.md

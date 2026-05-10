Status: ready-for-agent

## Parent

09-shop-module-deepening

## What to build

Add mock adapter and comprehensive tests for the Shop Module. This slice ensures the module is fully testable in isolation without database dependencies.

The mock adapter enables fast, deterministic tests that verify:
- Encryption/decryption round-trip
- Storage interface contract
- Error handling paths

Structure:
- `app/modules/shop/adapter.mock.ts` — In-memory storage adapter
- `tests/modules/shop.test.ts` — Module behavior tests
- `tests/modules/shop-adapter.test.ts` — Adapter contract tests

## Acceptance criteria

- [ ] Mock adapter created with same interface as Prisma adapter
- [ ] Tests verify: save shop → get shop returns same plaintext token
- [ ] Tests verify: mock and Prisma adapters behave identically
- [ ] Tests run without database (fast, isolated)
- [ ] All 6 user stories from parent have test coverage

## Blocked by

10-shop-module-core-with-prisma-adapter

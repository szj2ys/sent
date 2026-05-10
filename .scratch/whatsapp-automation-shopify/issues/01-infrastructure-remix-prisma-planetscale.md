Status: ready-for-agent

## Parent

PRD.md

## What to build

Setup the base Remix + Shopify App Bridge project with Prisma configured for PlanetScale. This slice proves that the basic application can start, connect to a database, and run a simple migration. It does not include full OAuth yet, just the boilerplate and database connection.

## Acceptance criteria

- [ ] A new Remix project is initialized using the Shopify App template
- [ ] Prisma is installed and configured with a PlanetScale (MySQL) driver
- [ ] The core database schema from the PRD is defined in `schema.prisma`
- [ ] A successful Prisma migration can be generated and applied to a development database
- [ ] The app starts locally and renders a basic "Hello World" or Shopify default index page

## Blocked by

None - can start immediately

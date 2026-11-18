# Hoang Anh Airlines

Flight-search web application built for Cloudflare Workers + static assets.

## Current release

This first foundation release includes:
- Responsive Vietnamese flight-search interface.
- One-way, round-trip and multi-city itineraries (up to 6 segments).
- Adults, children (age 2–11), lap infants and infants with a seat as separate passenger groups.
- Cabin selection, display currency, flexible-date and nearby-airport preferences.
- Provider-neutral API routes: `/api/health`, `/api/providers`, `/api/search`, `/api/calendar`, and offer repricing placeholder.
- Explicit no-live-fare state while no authorized live supplier is configured.

**Important:** No live airfare provider is connected in this release. Search requests are validated but intentionally return zero offers. No sample, estimated or fabricated fares are shown.

## Deploy to Cloudflare Workers

1. Install Node.js LTS and Wrangler: `npm install -g wrangler`.
2. In this repository run `npx wrangler login`.
3. Deploy: `npx wrangler deploy`.
4. Cloudflare will provide a `*.workers.dev` address if Workers subdomain is enabled for the account.

No paid custom domain is required. Check the current Cloudflare plan limits before enabling optional paid features.

## Live supplier integration

The provider registry is intentionally separate from the search endpoint. To show real fares, implement and authorize a provider adapter and store credentials as encrypted Worker secrets, never in source control.

Potential providers listed in the UI are not connected merely because they appear there. Access may require commercial approval, partner credentials, or an eligible API plan. Website scraping is not used.

Before a fare can be offered to a customer, the integration must return supplier identity, offer ID, itinerary legs, passenger pricing, currency, baggage/fare rules, source timestamp, ticketing capability and a successful reprice/availability confirmation.

## API contract

### POST /api/search

Accepts:
- `tripType`: `oneway`, `roundtrip`, or `multicity`
- `segments`: array of `{ from, to, date }` using IATA airport codes
- `passengers`: `{ adults, children: [{ age }], infants, infantsWithSeat }`
- `cabin`: `economy`, `premium_economy`, `business`, or `first`
- `currency`: `USD` or `VND`
- `options`: flexible dates, nearby airports, mixed airlines and separate tickets

Until a provider is connected, the response has `offers: []` and status `providers_not_connected`.

## Next engineering milestones

1. Add authorized live provider adapter(s) and supplier-specific repricing.
2. Implement currency conversion with recorded source/rate/timestamp.
3. Add calendar date-pair search, baggage and layover filters.
4. Add secure booking workflow, D1 audit records and customer booking management.
5. Add integration tests and production monitoring.

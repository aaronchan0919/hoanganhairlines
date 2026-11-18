# Hoang Anh Airlines

Flight-search web application built for Cloudflare Workers + static assets.

## Current release

- Responsive Vietnamese flight-search interface.
- One-way, round-trip and multi-city itineraries (up to 6 segments).
- Adults, children (age 2–11), lap infants and infants with a seat as separate passenger groups.
- Cabin selection, display currency, flexible-date and nearby-airport preferences.
- Provider-neutral API routes: `/api/health`, `/api/providers`, `/api/search`, `/api/calendar`, and offer repricing placeholder.
- Explicit no-live-fare state while no authorized live supplier is configured.

**Important:** No live airfare provider is connected in this release. Search requests are validated but intentionally return zero offers. No sample, estimated or fabricated fares are shown.

## Deploy using Cloudflare Git integration (recommended)

Cloudflare account authorization must be completed by the account owner; this repository cannot authorize itself into an external Cloudflare account.

1. Sign in to the Cloudflare dashboard.
2. Open **Workers & Pages** and choose **Create application → Workers → Connect to Git** (wording may vary).
3. Authorize GitHub and select `aaronchan0919/hoanganhairlines`, branch `main`.
4. Set the deployment command to `npx wrangler deploy`; repository root is `/`.
5. Confirm the Worker name is `hoanganhairlines` and enable the free `workers.dev` subdomain if prompted.
6. Deploy. Subsequent pushes to `main` can deploy automatically.

No paid custom domain is required. Check the current Cloudflare plan limits before enabling optional paid features.

### Alternative: GitHub Actions

The repository includes `.github/workflows/deploy-cloudflare.yml`. To use it, add these GitHub Actions repository secrets under **Settings → Secrets and variables → Actions**:
- `CLOUDFLARE_API_TOKEN`: token with permission to deploy Workers for the correct account.
- `CLOUDFLARE_ACCOUNT_ID`: the Cloudflare account ID.

Then run the workflow from the Actions tab or push to `main`. Never put tokens in source code, issues, or chat messages.

## Real global airfare data: what is possible

There is no single free public API that exposes every airline and every online travel agency's live inventory, complete prices, and ticketing rights. Global coverage requires one or more licensed distribution agreements, airline NDC connections, low-cost-carrier agreements, or authorized affiliate feeds. OTA websites must not be scraped or reverse-engineered against their terms.

A practical aggregator should combine:
- A global distribution system / aggregator for broad airline coverage.
- Direct airline NDC/API connections where commercial access is granted.
- Low-cost carrier connections and authorized partner feeds.
- OTA affiliate/search feeds where the provider permits display and click-through.

Travelport publicly describes TripServices Flights as providing access to content from 400+ airlines, NDC and low-cost carriers, with search, pricing, booking and ticketing workflows. This is a commercial provider, not a free unauthenticated public feed. See https://developer.travelport.com/.

Potential future adapters: Travelport, Sabre, Amadeus (subject to current product eligibility), airline NDC endpoints, and authorized OTA affiliate feeds such as eligible partner programs. Their names in this plan do not mean accounts, contracts, API keys, inventory or live fares are connected.

### Required provider behavior

Before a fare can be offered to a customer, an adapter must return supplier identity, offer ID, itinerary legs, passenger pricing, currency, baggage/fare rules, source timestamp, ticketing capability and a successful reprice/availability confirmation. Affiliate click-out offers must be labeled separately from fares that can be booked and ticketed through this system.

Credentials must be stored as encrypted Worker secrets, never committed to GitHub. Do not show inferred or cached values as live prices.

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

1. Complete Cloudflare account authorization and first deployment.
2. Obtain authorized provider access and implement provider adapter(s) with supplier-specific repricing.
3. Implement currency conversion with recorded source/rate/timestamp.
4. Add calendar date-pair search, baggage and layover filters.
5. Add secure booking workflow, D1 audit records and customer booking management.
6. Add integration tests and production monitoring.

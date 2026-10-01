# Boarding Lab · Flight Management System

**[Open the live product lab](https://pratiksha0108.github.io/Flight-Management-System/)** · [Product brief and acceptance criteria](docs/product-brief.md)

A connected traveler and operations prototype: choose a fictional route, select exact seats, create a practice reservation, and inspect how capacity changes. The original Java desktop source remains in the repository. The GitHub Pages version is an independent browser adaptation.

## Try the full loop

1. Search Chicago to New York with two travelers.
2. Choose a departure and select two seats in the visual cabin.
3. Create a practice reservation and inspect its non-travel summary.
4. Open Control tower for the same date. The occupancy chart and event log reflect the reservation.
5. Try reducing capacity below an assigned seat. The lab blocks that change.
6. Cancel the practice trip. The same seats become available again.

## Why these details matter

Inventory is scoped to a flight and a date. Two dates do not accidentally consume each other's seats. Capacity validation protects exact assigned seat labels, rather than relying on a passenger count alone. Failed reservations do not change state. Cancellation restores seats exactly once. A session event log makes these transitions inspectable.

## Honest boundaries

All four flights, city labels, fares and small cabin layouts are fictional. There are no payments, passenger details, airline integrations or real tickets. The fare concept changes price only, not the seat layout. No taxes, fees, time-zone calculations or actual airline policies are modeled. Everything resets on reload and is isolated to one browser session. This is not a concurrent production reservation system.

Occupancy is a computed session measure, not an airline performance statistic. No external dataset is needed to demonstrate the inventory behavior. The product brief documents a validation plan, not completed user research or achieved business results.

## Run the browser version

Requires Node.js 20+ and npm:

```sh
npm ci --prefix demo
npm test --prefix demo
npm run build --prefix demo
python3 -m http.server 4323 --directory site
```

Open `http://localhost:4323/`. Serve the generated `site/` folder, not the unbundled source. Content-hashed assets and an explicit startup-recovery state avoid mismatched cached modules and endless loading.

## Verification

19 automated checks cover calendar validation, unique seat selection, double-booking rejection, date and flight isolation, capacity protection, cancellation, fare calculations, occupancy reconciliation, state isolation and release bundling. Browser verification covers the end-to-end seat-selection flow, capacity errors, cancellation, export contents, and desktop/mobile layouts.

## Production next steps

Transactional seat holds with expiry, server-side idempotency, authentication, airline reconciliation, secure passenger information handling, ticketing and payment integration, and accessibility testing with actual users. These are intentionally out of scope for this free portfolio lab.

# Boarding Lab: a traveler-to-operations product loop

## Product hypothesis

Travelers need a clear, reversible seat-selection flow. Operations teams need inventory that reflects those choices. A connected prototype can help reviewers understand both the user journey and the state rules behind it.

This is an independent portfolio adaptation of the original Java desktop Flight Management System, not a production airline integration. No user research or business impact has been claimed.

## Experience and scope

1. Choose a fictional city pair, illustrative date, party size, and fare concept.
2. Inspect a departure and select exact seats in a small visual cabin.
3. Confirm a local practice reservation and download an explicitly non-travel summary.
4. Inspect the same date in Control tower: reserved seats, available seats, occupancy, and an event history.
5. Adjust released capacity. The model protects assigned seat labels, not merely the total booked count.
6. Cancel a practice reservation. Its exact seats become available again, on that departure only.

## Data and calculation boundaries

Four fictional flights, three city labels, illustrative fares, and cabins of up to 36 seats. No external airline dataset is required to demonstrate booking-state integrity. Adding a large flight spreadsheet would not make seat inventory live or safe.

- City labels CHI, NYC and LON represent cities, not specific airport identifiers.
- Date + flight ID form the inventory key. Different dates do not share bookings or capacity overrides.
- Calendar dates are validated. The lab supports illustrative dates, including historical ones; no actual flight schedule is implied.
- Fare = base price × travelers × illustrative cabin multiplier (1 for Economy, 1.8 for Business), rounded to whole dollars. No taxes, fees, fare rules or payment are modeled.
- Cabin choice affects only illustrative price, not seat class or layout.
- Occupancy = active reserved seats ÷ released capacity on the chosen date. Zero capacity displays “N/A,” not an invalid percentage.
- There is no passenger data, checkout, real ticket, cross-browser inventory or shared backend.

## Acceptance criteria

- A reservation requires exactly one unique, available seat per traveler, with 1 to 4 travelers.
- A selected seat cannot be assigned twice on the same flight/date.
- The same seat may be independently assigned on another flight or date.
- Failed reservations do not consume IDs or change bookings.
- Cancellation restores the assigned seats once; repeated cancellation is rejected.
- Reducing capacity cannot remove an assigned seat, even if total capacity would still exceed the number of passengers.
- Capacity changes for one date do not affect another date.
- Exports clearly identify simulation status and no issued ticket.
- All primary controls work with a keyboard, reduced-motion preference is honored, and a manual motion pause is available.

## What makes this a product project?

The visible cabin makes an abstract inventory constraint understandable. A boarding-pass-style summary establishes a clear completion state without pretending to issue a real ticket. The linked operations view lets a reviewer inspect the effect of the workflow rather than trusting a success toast alone. A session event log explains state changes and makes recovery testable.

## Validation plan

Observe five participants completing a two-person booking, changing an assigned seat choice before confirmation, finding the corresponding occupancy, and canceling. Record task completion, misinterpretation of simulation status, missed validation messages, and keyboard/mobile friction. This is planned research, not completed evidence.

For correctness, test calendar validation, exact-seat conflicts, group-size limits, date isolation, protected-seat capacity changes, cancellation idempotence and occupancy reconciliation. A real system needs concurrency and failure-recovery testing against a transactional backend; single-browser tests cannot establish production safety.

## Before production

Transactional seat holds with expiry; server-side idempotency and authorization; airline schedule/fare integration; timezone-aware itineraries; secure passenger information handling; reconciliation; payment and ticketing separation; cancellation policies; audit retention; monitored recovery paths; accessibility evaluation with actual users. These are explicitly out of scope for GitHub Pages.

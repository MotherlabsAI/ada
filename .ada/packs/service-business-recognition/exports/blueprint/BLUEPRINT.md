# Blueprint — Context engineering for a local service-business recognition system

## Scope
Bookings, staff, clients, services, deposits, payments. The vertical slice that
proves the trust loop: a booking feature guarded by deterministic checks.

## Non-goals (P0)
- Marketing campaigns, content library, reviews (modelled, not built yet)
- Multi-location (open question)
- Accounts / cloud sync

## Target stack
TypeScript · Node API · SQL database · typed ORM. Money in integer minor units.

## Data model

## Services (verbs)
- `book(serviceId, staffId, clientId, startsAt)` — rejects overlaps (no_double_booking)
- `reschedule(bookingId, startsAt)` — preserves deposit, rejects overlaps
- `cancel(bookingId)` — releases slot, applies policy
- `capturePayment(bookingId, amountCents, kind)` — non-negative only

## Workflows

## Build order
See `TASK_GRAPH.json`. Schema and constraints first, then services, then UI.

## Done
Code satisfies `ACCEPTANCE.md` and `node c/checks/verify.mjs` passes on real data.

# Blueprint — AI-Native Service Business Command Center

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
- **Canonical Entity Registry** — The de-duplicated list of domain entities and their canonical names.
- **Database Schema** — The canonical relational schema the executor builds and migrates against.
- **Client Table** — clients(id, name, contact, created_at).
- **Staff Table** — staff(id, name, role, active).
- **Service Table** — services(id, name, minutes, price_cents).
- **Appointment Table** — bookings(id, staff_id, client_id, service_id, starts_at, ends_at, status).
- **Payment Table** — payments(id, booking_id, amount_cents, kind).

## Services (verbs)
- `book(serviceId, staffId, clientId, startsAt)` — rejects overlaps (no_double_booking)
- `reschedule(bookingId, startsAt)` — preserves deposit, rejects overlaps
- `cancel(bookingId)` — releases slot, applies policy
- `capturePayment(bookingId, amountCents, kind)` — non-negative only

## Workflows
- **Booking Flow** — Select service -> choose staff and slot -> confirm -> hold with deposit. The flow the double-booking check guards.
- **Deposit Flow** — Capture a deposit at booking time and reconcile it at checkout.
- **Reschedule Flow** — Move a booking to a new slot without losing the deposit or creating an overlap.
- **Cancellation Flow** — Release a slot and apply the cancellation policy to the deposit.

## Build order
See `TASK_GRAPH.json`. Schema and constraints first, then services, then UI.

## Done
Code satisfies `ACCEPTANCE.md` and `node c/checks/verify.mjs` passes on real data.

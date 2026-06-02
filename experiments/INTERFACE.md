# Booking module — required interface

Write ONE self-contained ESM file `booking.mjs` (zero dependencies, no I/O, no network).
It must export exactly these functions, keeping all state in-module:

- `reset()` → clear all state
- `addStaff(id)` , `addClient(id)` , `addService(id, minutes)` → register reference data
- `book(b)` → `{ ok: boolean, error?: string }`
  - `b = { id, staffId, clientId, serviceId, startsAt, endsAt }` (times are ISO-8601 strings)
  - Persist the booking when you accept it.
- `capturePayment(p)` → `{ ok: boolean, error?: string }`
  - `p = { id, bookingId, amountCents, kind }` (kind ∈ 'deposit' | 'final' | 'refund')
- `listBookings()` → array of accepted bookings
- `listPayments()` → array of captured payments

## How the grader uses it

- It calls these in sequence and inspects `ok`/`error` and the lists.
- To **reject** an operation, return `{ ok: false, error }`. Throwing is also treated as a rejection.
- To **accept**, return `{ ok: true }` and persist.

Build a sensible, correct implementation. You decide what is and isn't a valid operation.

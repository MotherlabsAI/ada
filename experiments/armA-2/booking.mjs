// booking.mjs — self-contained, zero-dependency ESM booking module.
//
// In-memory state for a local service business:
//   reference data: staff, clients, services
//   transactions:   bookings, payments
//
// Design goals: sensible, correct, and defensive. Every accepted operation
// is validated against reference data, schedule consistency, and money rules
// before it is persisted. Rejections return { ok: false, error } and never
// mutate state.

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let staff;
let clients;
let services; // id -> minutes
let bookings; // id -> booking record (accepted)
let payments; // id -> payment record (captured)

reset();

export function reset() {
  staff = new Set();
  clients = new Set();
  services = new Map();
  bookings = new Map();
  payments = new Map();
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export function addStaff(id) {
  if (!isNonEmptyString(id)) return { ok: false, error: 'invalid staff id' };
  staff.add(id);
  return { ok: true };
}

export function addClient(id) {
  if (!isNonEmptyString(id)) return { ok: false, error: 'invalid client id' };
  clients.add(id);
  return { ok: true };
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) return { ok: false, error: 'invalid service id' };
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return { ok: false, error: 'service minutes must be a positive integer' };
  }
  services.set(id, minutes);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export function book(b) {
  // --- shape ---
  if (!b || typeof b !== 'object') return { ok: false, error: 'invalid booking' };
  const { id, staffId, clientId, serviceId, startsAt, endsAt } = b;

  if (!isNonEmptyString(id)) return { ok: false, error: 'invalid booking id' };

  // R1: ids must be unique — never silently overwrite an existing booking.
  if (bookings.has(id)) return { ok: false, error: 'duplicate booking id' };

  // R2: every foreign key must reference registered reference data.
  if (!staff.has(staffId)) return { ok: false, error: 'unknown staff' };
  if (!clients.has(clientId)) return { ok: false, error: 'unknown client' };
  if (!services.has(serviceId)) return { ok: false, error: 'unknown service' };

  // R3: times must be valid ISO-8601 instants.
  const start = parseInstant(startsAt);
  const end = parseInstant(endsAt);
  if (start === null) return { ok: false, error: 'invalid startsAt' };
  if (end === null) return { ok: false, error: 'invalid endsAt' };

  // R4: the interval must be positive (end strictly after start).
  if (end <= start) return { ok: false, error: 'endsAt must be after startsAt' };

  // R5: booked duration must match the service's defined duration.
  const expectedMs = services.get(serviceId) * 60_000;
  if (end - start !== expectedMs) {
    return { ok: false, error: 'duration does not match service' };
  }

  // R6: no double-booking for the same staff member (overlapping intervals).
  // R7: no double-booking for the same client (a client can't be in two
  //     places at once).
  for (const existing of bookings.values()) {
    if (overlaps(start, end, existing._start, existing._end)) {
      if (existing.staffId === staffId) {
        return { ok: false, error: 'staff double-booked' };
      }
      if (existing.clientId === clientId) {
        return { ok: false, error: 'client double-booked' };
      }
    }
  }

  // Accept & persist. Keep parsed millis privately for fast overlap checks,
  // but return only the public shape from listBookings().
  bookings.set(id, {
    id,
    staffId,
    clientId,
    serviceId,
    startsAt,
    endsAt,
    _start: start,
    _end: end,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

const PAYMENT_KINDS = new Set(['deposit', 'final', 'refund']);

export function capturePayment(p) {
  // --- shape ---
  if (!p || typeof p !== 'object') return { ok: false, error: 'invalid payment' };
  const { id, bookingId, amountCents, kind } = p;

  if (!isNonEmptyString(id)) return { ok: false, error: 'invalid payment id' };

  // P1: payment ids must be unique.
  if (payments.has(id)) return { ok: false, error: 'duplicate payment id' };

  // P2: kind must be a known kind.
  if (!PAYMENT_KINDS.has(kind)) return { ok: false, error: 'invalid payment kind' };

  // P3: a payment must attach to an existing, accepted booking.
  const booking = bookings.get(bookingId);
  if (!booking) return { ok: false, error: 'unknown booking' };

  // P4: amount must be an integer number of cents and strictly positive.
  //     Sign is encoded by `kind` (refund), not by a negative amount.
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: 'amountCents must be a positive integer' };
  }

  // Gather existing payments on this booking for ordering / balance rules.
  const prior = [...payments.values()].filter((q) => q.bookingId === bookingId);
  const hasFinal = prior.some((q) => q.kind === 'final');
  const captured = signedTotal(prior); // net captured so far (deposit+final - refund)

  if (kind === 'deposit') {
    // P5: a deposit can't be taken after the booking has been finalized.
    if (hasFinal) return { ok: false, error: 'cannot deposit after final payment' };
    // P6: at most one deposit per booking.
    if (prior.some((q) => q.kind === 'deposit')) {
      return { ok: false, error: 'deposit already captured' };
    }
  } else if (kind === 'final') {
    // P7: exactly one final payment per booking.
    if (hasFinal) return { ok: false, error: 'final payment already captured' };
  } else if (kind === 'refund') {
    // P8: cannot refund more than the net amount currently captured.
    if (amountCents > captured) {
      return { ok: false, error: 'refund exceeds captured amount' };
    }
  }

  // Accept & persist.
  payments.set(id, { id, bookingId, amountCents, kind });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function listBookings() {
  return [...bookings.values()].map(({ _start, _end, ...pub }) => pub);
}

export function listPayments() {
  return [...payments.values()].map((p) => ({ ...p }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

// Parse a strict ISO-8601 instant. Returns epoch millis, or null if the string
// is not a real, round-trippable date-time. Date.parse alone is too lax, so we
// require an explicit date+time and verify the parse round-trips.
function parseInstant(s) {
  if (!isNonEmptyString(s)) return null;
  // Must look like a date-time: YYYY-MM-DDTHH:MM(:SS)?(.fff)?(Z|±HH:MM)?
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(s)) {
    return null;
  }
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

// Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).
// Back-to-back bookings (one ends exactly when the next begins) do NOT overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Net captured amount: deposits and finals add, refunds subtract.
function signedTotal(list) {
  return list.reduce(
    (sum, q) => sum + (q.kind === 'refund' ? -q.amountCents : q.amountCents),
    0,
  );
}

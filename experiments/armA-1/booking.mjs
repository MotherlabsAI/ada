// booking.mjs — self-contained, zero-dependency ESM booking module.
//
// Domain: a local service business with clients, staff, services, bookings,
// deposits and payments. All state is kept in-module. No I/O, no network.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

let staff;     // Set<string> of registered staff ids
let clients;   // Set<string> of registered client ids
let services;  // Map<string, number> serviceId -> duration in minutes
let bookings;  // Map<string, booking> id -> accepted booking
let payments;  // Map<string, payment> id -> captured payment

function freshState() {
  staff = new Set();
  clients = new Set();
  services = new Map();
  bookings = new Map();
  payments = new Map();
}
freshState();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_KINDS = new Set(['deposit', 'final', 'refund']);

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

// Parse a strict ISO-8601 timestamp into epoch milliseconds.
// Returns null when the value is not a usable timestamp.
function parseIso(v) {
  if (!isNonEmptyString(v)) return null;
  const ms = Date.parse(v);
  if (Number.isNaN(ms)) return null;
  return ms;
}

function isInteger(v) {
  return typeof v === 'number' && Number.isInteger(v);
}

// Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap iff
// they share any positive-length span. Touching at an endpoint is allowed
// (back-to-back bookings are fine).
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ---------------------------------------------------------------------------
// Reference data registration
// ---------------------------------------------------------------------------

export function reset() {
  freshState();
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: 'staff id must be a non-empty string' };
  }
  staff.add(id);
  return { ok: true };
}

export function addClient(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: 'client id must be a non-empty string' };
  }
  clients.add(id);
  return { ok: true };
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: 'service id must be a non-empty string' };
  }
  if (!isInteger(minutes) || minutes <= 0) {
    return { ok: false, error: 'service minutes must be a positive integer' };
  }
  services.set(id, minutes);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export function book(b) {
  if (b === null || typeof b !== 'object') {
    return { ok: false, error: 'booking must be an object' };
  }

  const { id, staffId, clientId, serviceId, startsAt, endsAt } = b;

  // Identity + reference integrity.
  if (!isNonEmptyString(id)) {
    return { ok: false, error: 'booking id must be a non-empty string' };
  }
  if (bookings.has(id)) {
    return { ok: false, error: `duplicate booking id: ${id}` };
  }
  if (!isNonEmptyString(staffId) || !staff.has(staffId)) {
    return { ok: false, error: `unknown staff: ${staffId}` };
  }
  if (!isNonEmptyString(clientId) || !clients.has(clientId)) {
    return { ok: false, error: `unknown client: ${clientId}` };
  }
  if (!isNonEmptyString(serviceId) || !services.has(serviceId)) {
    return { ok: false, error: `unknown service: ${serviceId}` };
  }

  // Time validity.
  const startMs = parseIso(startsAt);
  const endMs = parseIso(endsAt);
  if (startMs === null) {
    return { ok: false, error: 'startsAt must be an ISO-8601 timestamp' };
  }
  if (endMs === null) {
    return { ok: false, error: 'endsAt must be an ISO-8601 timestamp' };
  }
  if (endMs <= startMs) {
    return { ok: false, error: 'endsAt must be after startsAt' };
  }

  // Duration must match the booked service definition.
  const expectedMinutes = services.get(serviceId);
  const actualMinutes = (endMs - startMs) / 60000;
  if (actualMinutes !== expectedMinutes) {
    return {
      ok: false,
      error: `duration ${actualMinutes}m does not match service ${serviceId} (${expectedMinutes}m)`,
    };
  }

  // No double-booking: the same staff member cannot hold two overlapping
  // bookings. (A client double-booking themselves is also rejected.)
  for (const existing of bookings.values()) {
    if (existing.staffId === staffId &&
        overlaps(startMs, endMs, existing._startMs, existing._endMs)) {
      return { ok: false, error: `staff ${staffId} is already booked in that window` };
    }
    if (existing.clientId === clientId &&
        overlaps(startMs, endMs, existing._startMs, existing._endMs)) {
      return { ok: false, error: `client ${clientId} is already booked in that window` };
    }
  }

  // Accept and persist.
  bookings.set(id, {
    id,
    staffId,
    clientId,
    serviceId,
    startsAt,
    endsAt,
    // private numeric cache for overlap math; stripped from listBookings()
    _startMs: startMs,
    _endMs: endMs,
  });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export function capturePayment(p) {
  if (p === null || typeof p !== 'object') {
    return { ok: false, error: 'payment must be an object' };
  }

  const { id, bookingId, amountCents, kind } = p;

  // Identity + reference integrity.
  if (!isNonEmptyString(id)) {
    return { ok: false, error: 'payment id must be a non-empty string' };
  }
  if (payments.has(id)) {
    return { ok: false, error: `duplicate payment id: ${id}` };
  }
  if (!isNonEmptyString(bookingId) || !bookings.has(bookingId)) {
    return { ok: false, error: `unknown booking: ${bookingId}` };
  }
  if (!VALID_KINDS.has(kind)) {
    return { ok: false, error: `invalid payment kind: ${kind}` };
  }
  if (!isInteger(amountCents)) {
    return { ok: false, error: 'amountCents must be an integer' };
  }

  // Sign convention: charges (deposit/final) are positive, refunds negative.
  if (kind === 'refund') {
    if (amountCents >= 0) {
      return { ok: false, error: 'refund amountCents must be negative' };
    }
  } else if (amountCents <= 0) {
    return { ok: false, error: `${kind} amountCents must be positive` };
  }

  // Gather existing payments for this booking.
  const existing = [...payments.values()].filter((x) => x.bookingId === bookingId);

  // At most one deposit and at most one final per booking.
  if (kind === 'deposit' && existing.some((x) => x.kind === 'deposit')) {
    return { ok: false, error: `booking ${bookingId} already has a deposit` };
  }
  if (kind === 'final' && existing.some((x) => x.kind === 'final')) {
    return { ok: false, error: `booking ${bookingId} already has a final payment` };
  }

  // A refund cannot exceed the net amount already captured on the booking.
  if (kind === 'refund') {
    const net = existing.reduce((sum, x) => sum + x.amountCents, 0);
    if (net <= 0) {
      return { ok: false, error: `booking ${bookingId} has nothing to refund` };
    }
    if (-amountCents > net) {
      return { ok: false, error: `refund exceeds captured amount for booking ${bookingId}` };
    }
  }

  // Accept and persist.
  payments.set(id, { id, bookingId, amountCents, kind });
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export function listBookings() {
  // Strip private overlap-cache fields from the returned view.
  return [...bookings.values()].map(({ _startMs, _endMs, ...rest }) => rest);
}

export function listPayments() {
  return [...payments.values()].map((p) => ({ ...p }));
}

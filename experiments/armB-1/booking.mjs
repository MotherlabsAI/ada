// booking.mjs — self-contained, zero-dependency ESM booking module.
// Implements the interface in experiments/INTERFACE.md and honors the showcase
// pack's C invariants (no_double_booking [C4], non_negative_payment [C5],
// booking_well_formed [C5]). Money is integer minor units (cents); no floats.
//
// All state is held in-module. No I/O, no network.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

/** @type {Map<string, true>} registered staff ids */
let staff = new Map();
/** @type {Map<string, true>} registered client ids */
let clients = new Map();
/** @type {Map<string, { minutes: number }>} registered services */
let services = new Map();
/** @type {Array<object>} accepted bookings (status: 'active' | ...) */
let bookings = [];
/** @type {Array<object>} captured payments */
let payments = [];

const PAYMENT_KINDS = new Set(["deposit", "final", "refund"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reject(error) {
  return { ok: false, error };
}
function accept() {
  return { ok: true };
}

/** Parse an ISO-8601 timestamp to ms; returns NaN if unparseable. */
function parseTime(s) {
  if (typeof s !== "string" || s.length === 0) return NaN;
  return Date.parse(s);
}

/** Half-open overlap: [aStart, aEnd) intersects [bStart, bEnd). Touching is OK. */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function reset() {
  staff = new Map();
  clients = new Map();
  services = new Map();
  bookings = [];
  payments = [];
}

// ---------------------------------------------------------------------------
// Reference data registration
// ---------------------------------------------------------------------------

export function addStaff(id) {
  if (typeof id === "string" && id.length > 0) staff.set(id, true);
}

export function addClient(id) {
  if (typeof id === "string" && id.length > 0) clients.set(id, true);
}

export function addService(id, minutes) {
  if (typeof id === "string" && id.length > 0) {
    const m = Number(minutes);
    services.set(id, { minutes: Number.isFinite(m) ? m : null });
  }
}

// ---------------------------------------------------------------------------
// book(b) — enforces booking_well_formed [C5] and no_double_booking [C4]
// ---------------------------------------------------------------------------

export function book(b) {
  if (b == null || typeof b !== "object") {
    return reject("booking must be an object");
  }

  const { id, staffId, clientId, serviceId, startsAt, endsAt } = b;

  // --- booking_well_formed: identity ---
  if (typeof id !== "string" || id.length === 0) {
    return reject("booking_well_formed: missing booking id");
  }
  if (bookings.some((x) => x.id === id)) {
    return reject("booking_well_formed: duplicate booking id");
  }

  // --- booking_well_formed: references present ---
  if (typeof staffId !== "string" || staffId.length === 0) {
    return reject("booking_well_formed: missing staffId");
  }
  if (typeof clientId !== "string" || clientId.length === 0) {
    return reject("booking_well_formed: missing clientId");
  }
  if (typeof serviceId !== "string" || serviceId.length === 0) {
    return reject("booking_well_formed: missing serviceId");
  }

  // --- referential integrity: references must resolve to registered data ---
  if (!staff.has(staffId)) {
    return reject(`booking_well_formed: unknown staffId '${staffId}'`);
  }
  if (!clients.has(clientId)) {
    return reject(`booking_well_formed: unknown clientId '${clientId}'`);
  }
  if (!services.has(serviceId)) {
    return reject(`booking_well_formed: unknown serviceId '${serviceId}'`);
  }

  // --- booking_well_formed: interval valid and strictly ordered ---
  const start = parseTime(startsAt);
  const end = parseTime(endsAt);
  if (Number.isNaN(start)) {
    return reject("booking_well_formed: unparseable startsAt");
  }
  if (Number.isNaN(end)) {
    return reject("booking_well_formed: unparseable endsAt");
  }
  if (!(start < end)) {
    return reject("booking_well_formed: startsAt must be strictly before endsAt");
  }

  // --- no_double_booking: no overlap with another ACTIVE booking, same staff ---
  for (const existing of bookings) {
    if (existing.status !== "active") continue;
    if (existing.staffId !== staffId) continue;
    const eStart = parseTime(existing.startsAt);
    const eEnd = parseTime(existing.endsAt);
    if (overlaps(start, end, eStart, eEnd)) {
      return reject(
        `no_double_booking: overlaps active booking '${existing.id}' for staff '${staffId}'`,
      );
    }
  }

  // Accept and persist.
  bookings.push({
    id,
    staffId,
    clientId,
    serviceId,
    startsAt,
    endsAt,
    status: "active",
  });
  return accept();
}

// ---------------------------------------------------------------------------
// capturePayment(p) — enforces non_negative_payment [C5]
// ---------------------------------------------------------------------------

export function capturePayment(p) {
  if (p == null || typeof p !== "object") {
    return reject("payment must be an object");
  }

  const { id, bookingId, amountCents, kind } = p;

  if (typeof id !== "string" || id.length === 0) {
    return reject("non_negative_payment: missing payment id");
  }
  if (payments.some((x) => x.id === id)) {
    return reject("non_negative_payment: duplicate payment id");
  }

  // --- valid kind ---
  if (!PAYMENT_KINDS.has(kind)) {
    return reject(
      `non_negative_payment: kind must be one of deposit|final|refund, got '${kind}'`,
    );
  }

  // --- referential integrity: payment must attach to a known booking ---
  if (typeof bookingId !== "string" || bookingId.length === 0) {
    return reject("non_negative_payment: missing bookingId");
  }
  if (!bookings.some((x) => x.id === bookingId)) {
    return reject(`non_negative_payment: unknown bookingId '${bookingId}'`);
  }

  // --- non_negative_payment: integer minor units, non-negative ---
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    return reject("non_negative_payment: amountCents must be a finite number");
  }
  if (!Number.isInteger(amountCents)) {
    return reject("non_negative_payment: amountCents must be integer minor units");
  }
  if (amountCents < 0) {
    return reject("non_negative_payment: amountCents must be non-negative");
  }
  // Refunds are a positive amount recorded under the 'refund' kind.
  if (kind === "refund" && amountCents <= 0) {
    return reject("non_negative_payment: refund amount must be positive");
  }

  payments.push({ id, bookingId, amountCents, kind });
  return accept();
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export function listBookings() {
  return bookings.map((b) => ({ ...b }));
}

export function listPayments() {
  return payments.map((p) => ({ ...p }));
}

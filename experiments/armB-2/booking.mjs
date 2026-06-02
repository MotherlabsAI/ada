// Booking module — armB-2
// Self-contained, zero-dependency ESM. No I/O, no network. All state in-module.
//
// Correctness is governed by the Ada showcase pack's C checks:
//   - no_double_booking [C4]: no active booking overlaps another active booking
//     for the same staff member (half-open intervals; touching slots are fine).
//   - booking_well_formed [C5]: every active booking references staff + client +
//     service, and starts strictly before it ends.
//   - non_negative_payment [C5]: every payment amount is a non-negative integer
//     (cents); refunds use kind 'refund' with a POSITIVE amount.
//
// Design choices honoring the pack invariants:
//   * Money is integer minor units (cents). Floats / NaN / non-integers rejected.
//   * Stored bookings carry status:'active' and the ref + time fields the C
//     checks read, so listBookings() output passes the checks on real data.
//   * Rejections return { ok:false, error } rather than throwing.

const VALID_KINDS = new Set(["deposit", "final", "refund"]);

// --- in-module state ---------------------------------------------------------
const staff = new Set();
const clients = new Set();
const services = new Map(); // id -> { minutes }
let bookings = []; // { id, staffId, clientId, serviceId, startsAt, endsAt, status }
let payments = []; // { id, bookingId, amountCents, kind }

export function reset() {
  staff.clear();
  clients.clear();
  services.clear();
  bookings = [];
  payments = [];
}

// --- reference data ----------------------------------------------------------
export function addStaff(id) {
  if (typeof id === "string" && id) staff.add(id);
}

export function addClient(id) {
  if (typeof id === "string" && id) clients.add(id);
}

export function addService(id, minutes) {
  if (typeof id === "string" && id) {
    const m = Number(minutes);
    services.set(id, { minutes: Number.isFinite(m) ? m : null });
  }
}

// --- helpers -----------------------------------------------------------------
function parseTime(t) {
  if (typeof t !== "string" || t.length === 0) return NaN;
  return Date.parse(t);
}

// Half-open overlap, matching the no_double_booking C4 predicate exactly:
//   aStart < bEnd && bStart < aEnd  → overlap. Touching (end == start) is OK.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// --- book --------------------------------------------------------------------
export function book(b) {
  if (!b || typeof b !== "object") {
    return { ok: false, error: "invalid_input" };
  }
  const { id, staffId, clientId, serviceId, startsAt, endsAt } = b;

  // Identity: a booking needs a usable id, and ids must be unique.
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "missing_id" };
  }
  if (bookings.some((x) => x.id === id)) {
    return { ok: false, error: "duplicate_booking_id" };
  }

  // booking_well_formed [C5]: must reference staff, client, and service.
  if (typeof staffId !== "string" || staffId.length === 0) {
    return { ok: false, error: "missing_staff" };
  }
  if (typeof clientId !== "string" || clientId.length === 0) {
    return { ok: false, error: "missing_client" };
  }
  if (typeof serviceId !== "string" || serviceId.length === 0) {
    return { ok: false, error: "missing_service" };
  }

  // Referential integrity: refs must point at registered reference data.
  if (!staff.has(staffId)) return { ok: false, error: "unknown_staff" };
  if (!clients.has(clientId)) return { ok: false, error: "unknown_client" };
  if (!services.has(serviceId)) return { ok: false, error: "unknown_service" };

  // booking_well_formed [C5]: starts strictly before it ends.
  const start = parseTime(startsAt);
  const end = parseTime(endsAt);
  if (Number.isNaN(start)) return { ok: false, error: "invalid_startsAt" };
  if (Number.isNaN(end)) return { ok: false, error: "invalid_endsAt" };
  if (start >= end) return { ok: false, error: "inverted_interval" };

  // no_double_booking [C4]: reject overlap with an active booking for same staff.
  for (const ex of bookings) {
    if (ex.status !== "active") continue;
    if (ex.staffId !== staffId) continue;
    const exStart = Date.parse(ex.startsAt);
    const exEnd = Date.parse(ex.endsAt);
    if (overlaps(start, end, exStart, exEnd)) {
      return { ok: false, error: "double_booking" };
    }
  }

  // Accept + persist with the fields the C checks read.
  bookings.push({
    id,
    staffId,
    clientId,
    serviceId,
    startsAt,
    endsAt,
    status: "active",
  });
  return { ok: true };
}

// --- capturePayment ----------------------------------------------------------
export function capturePayment(p) {
  if (!p || typeof p !== "object") {
    return { ok: false, error: "invalid_input" };
  }
  const { id, bookingId, amountCents, kind } = p;

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "missing_id" };
  }
  if (payments.some((x) => x.id === id)) {
    return { ok: false, error: "duplicate_payment_id" };
  }

  // Payment must reference a known booking.
  if (typeof bookingId !== "string" || bookingId.length === 0) {
    return { ok: false, error: "missing_booking" };
  }
  if (!bookings.some((bk) => bk.id === bookingId)) {
    return { ok: false, error: "unknown_booking" };
  }

  // kind must be one of the allowed kinds.
  if (!VALID_KINDS.has(kind)) {
    return { ok: false, error: "invalid_kind" };
  }

  // non_negative_payment [C5]: integer cents, no floats, non-negative.
  if (typeof amountCents !== "number" || !Number.isFinite(amountCents)) {
    return { ok: false, error: "invalid_amount" };
  }
  if (!Number.isInteger(amountCents)) {
    return { ok: false, error: "non_integer_amount" };
  }
  if (amountCents < 0) {
    return { ok: false, error: "negative_amount" };
  }
  // Refunds are recorded as a refund kind with a POSITIVE amount.
  if (kind === "refund" && amountCents <= 0) {
    return { ok: false, error: "refund_must_be_positive" };
  }

  payments.push({ id, bookingId, amountCents, kind });
  return { ok: true };
}

// --- reads -------------------------------------------------------------------
export function listBookings() {
  return bookings.map((b) => ({ ...b }));
}

export function listPayments() {
  return payments.map((p) => ({ ...p }));
}

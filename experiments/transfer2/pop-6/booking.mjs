// Appointment engine for a medical clinic.
// Self-contained, zero-dependency ESM module. All state kept in-module.
//
// Entities:
//   staff    (doctors)   — provide services
//   clients  (patients)  — book a doctor for a service in a time window
//   services             — have a fixed duration in minutes
//
// A booking ties a client + staff + service to a [startsAt, endsAt) window.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

const staff = new Set();
const clients = new Set();
const services = new Map(); // id -> minutes (positive integer)
let bookings = [];          // accepted bookings (persisted)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

// Parse an ISO-8601 timestamp into epoch milliseconds.
// Returns NaN if the value is not a valid, parseable timestamp.
function parseInstant(v) {
  if (typeof v !== "string" || v.length === 0) return NaN;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? NaN : ms;
}

// Two half-open intervals [a1,a2) and [b1,b2) overlap iff a1 < b2 && b1 < a2.
// Touching at an endpoint (a2 === b1) does NOT overlap — back-to-back is fine.
function overlaps(a1, a2, b1, b2) {
  return a1 < b2 && b1 < a2;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function reset() {
  staff.clear();
  clients.clear();
  services.clear();
  bookings = [];
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid staff id" };
  }
  staff.add(id);
  return { ok: true };
}

export function addClient(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid client id" };
  }
  clients.add(id);
  return { ok: true };
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid service id" };
  }
  if (
    typeof minutes !== "number" ||
    !Number.isFinite(minutes) ||
    !Number.isInteger(minutes) ||
    minutes <= 0
  ) {
    return { ok: false, error: "service minutes must be a positive integer" };
  }
  services.set(id, minutes);
  return { ok: true };
}

export function book(b) {
  // ---- shape validation -------------------------------------------------
  if (b === null || typeof b !== "object") {
    return { ok: false, error: "booking must be an object" };
  }
  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid booking id" };
  }
  if (!isNonEmptyString(clientId)) {
    return { ok: false, error: "invalid clientId" };
  }
  if (!isNonEmptyString(staffId)) {
    return { ok: false, error: "invalid staffId" };
  }
  if (!isNonEmptyString(serviceId)) {
    return { ok: false, error: "invalid serviceId" };
  }

  // ---- referential integrity -------------------------------------------
  if (!clients.has(clientId)) {
    return { ok: false, error: "unknown client" };
  }
  if (!staff.has(staffId)) {
    return { ok: false, error: "unknown staff" };
  }
  if (!services.has(serviceId)) {
    return { ok: false, error: "unknown service" };
  }

  // ---- unique booking id ------------------------------------------------
  if (bookings.some((x) => x.id === id)) {
    return { ok: false, error: "duplicate booking id" };
  }

  // ---- time-window validity --------------------------------------------
  const start = parseInstant(startsAt);
  const end = parseInstant(endsAt);
  if (Number.isNaN(start)) {
    return { ok: false, error: "invalid startsAt" };
  }
  if (Number.isNaN(end)) {
    return { ok: false, error: "invalid endsAt" };
  }
  if (end <= start) {
    return { ok: false, error: "endsAt must be after startsAt" };
  }

  // ---- duration must match the service ---------------------------------
  const minutes = services.get(serviceId);
  const expectedMs = minutes * 60 * 1000;
  if (end - start !== expectedMs) {
    return {
      ok: false,
      error: "duration does not match service",
    };
  }

  // ---- double-booking checks (half-open overlap) ------------------------
  for (const x of bookings) {
    // The same doctor cannot be in two places at once.
    if (x.staffId === staffId && overlaps(start, end, x._start, x._end)) {
      return { ok: false, error: "staff double-booked" };
    }
    // The same patient cannot be in two places at once.
    if (x.clientId === clientId && overlaps(start, end, x._start, x._end)) {
      return { ok: false, error: "client double-booked" };
    }
  }

  // ---- accept & persist -------------------------------------------------
  bookings.push({
    id,
    clientId,
    staffId,
    serviceId,
    startsAt,
    endsAt,
    _start: start,
    _end: end,
  });
  return { ok: true };
}

export function listBookings() {
  // Return a clean copy without internal numeric fields.
  return bookings.map(({ _start, _end, ...rest }) => ({ ...rest }));
}

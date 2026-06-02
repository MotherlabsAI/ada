// booking.mjs
// Self-contained, zero-dependency ESM booking module for a medical clinic.
// Domain: Staff (doctors) provide Services; Clients (patients) book a Staff
// member for a Service over a [startsAt, endsAt) time window.
//
// State is held in-module. reset() clears it.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

const state = {
  staff: new Set(),          // staffId -> exists
  clients: new Set(),        // clientId -> exists
  services: new Map(),       // serviceId -> durationMinutes (number > 0)
  bookings: [],              // array of persisted booking records
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

// Parse an ISO-8601 timestamp into epoch milliseconds.
// Returns null if the value is not a valid, unambiguous ISO-8601 string.
// We require an explicit timezone (Z or +/-HH:MM) so two bookings can never be
// compared across an undefined local offset — ambiguous local times are rejected.
function parseIso(value) {
  if (!isNonEmptyString(value)) return null;

  // Must look like ISO-8601 with a date and a time and an explicit timezone.
  // Examples accepted: 2026-06-02T09:00:00Z, 2026-06-02T09:00:00.500+02:00
  const isoShape =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;
  if (!isoShape.test(value)) return null;

  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;
  return ms;
}

// Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap iff
// aStart < bEnd && bStart < aEnd. Touching at an endpoint does NOT overlap,
// so back-to-back bookings are allowed.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function reset() {
  state.staff.clear();
  state.clients.clear();
  state.services.clear();
  state.bookings = [];
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid_staff_id" };
  }
  state.staff.add(id);
  return { ok: true };
}

export function addClient(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid_client_id" };
  }
  state.clients.add(id);
  return { ok: true };
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid_service_id" };
  }
  if (
    typeof minutes !== "number" ||
    !Number.isFinite(minutes) ||
    !Number.isInteger(minutes) ||
    minutes <= 0
  ) {
    return { ok: false, error: "invalid_service_minutes" };
  }
  state.services.set(id, minutes);
  return { ok: true };
}

export function book(b) {
  // ---- Shape validation -------------------------------------------------
  if (b === null || typeof b !== "object") {
    return { ok: false, error: "invalid_booking" };
  }

  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  if (!isNonEmptyString(id)) {
    return { ok: false, error: "invalid_booking_id" };
  }
  if (!isNonEmptyString(clientId)) {
    return { ok: false, error: "invalid_client_id" };
  }
  if (!isNonEmptyString(staffId)) {
    return { ok: false, error: "invalid_staff_id" };
  }
  if (!isNonEmptyString(serviceId)) {
    return { ok: false, error: "invalid_service_id" };
  }

  // ---- Referential integrity -------------------------------------------
  if (!state.clients.has(clientId)) {
    return { ok: false, error: "unknown_client" };
  }
  if (!state.staff.has(staffId)) {
    return { ok: false, error: "unknown_staff" };
  }
  if (!state.services.has(serviceId)) {
    return { ok: false, error: "unknown_service" };
  }

  // ---- Time parsing -----------------------------------------------------
  const startMs = parseIso(startsAt);
  if (startMs === null) {
    return { ok: false, error: "invalid_startsAt" };
  }
  const endMs = parseIso(endsAt);
  if (endMs === null) {
    return { ok: false, error: "invalid_endsAt" };
  }

  // ---- Temporal sanity --------------------------------------------------
  if (endMs <= startMs) {
    return { ok: false, error: "end_not_after_start" };
  }

  // ---- Duration must match the service definition -----------------------
  const serviceMinutes = state.services.get(serviceId);
  const requestedMinutes = (endMs - startMs) / 60000;
  if (requestedMinutes !== serviceMinutes) {
    return { ok: false, error: "duration_mismatch" };
  }

  // ---- Idempotency / unique id ------------------------------------------
  if (state.bookings.some((x) => x.id === id)) {
    return { ok: false, error: "duplicate_booking_id" };
  }

  // ---- Double-booking checks (no overlap on shared resource) ------------
  // A doctor cannot be in two places at once.
  for (const x of state.bookings) {
    if (x.staffId === staffId && overlaps(startMs, endMs, x.startMs, x.endMs)) {
      return { ok: false, error: "staff_double_booked" };
    }
  }
  // A patient cannot be in two appointments at once.
  for (const x of state.bookings) {
    if (
      x.clientId === clientId &&
      overlaps(startMs, endMs, x.startMs, x.endMs)
    ) {
      return { ok: false, error: "client_double_booked" };
    }
  }

  // ---- Persist ----------------------------------------------------------
  state.bookings.push({
    id,
    clientId,
    staffId,
    serviceId,
    startsAt,
    endsAt,
    startMs,
    endMs,
  });

  return { ok: true };
}

export function listBookings() {
  // Return a clean, externally-facing view (hide internal epoch fields),
  // sorted by start time then id for deterministic output.
  return state.bookings
    .slice()
    .sort((a, b) => a.startMs - b.startMs || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(({ id, clientId, staffId, serviceId, startsAt, endsAt }) => ({
      id,
      clientId,
      staffId,
      serviceId,
      startsAt,
      endsAt,
    }));
}

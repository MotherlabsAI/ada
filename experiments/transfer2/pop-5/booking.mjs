// Appointment engine for a medical clinic — self-contained, zero-dependency ESM.
//
// Entities:
//   staff    — doctors who provide services
//   clients  — patients who book
//   services — named procedures with a fixed duration in minutes
//   bookings — a client books a staff member for a service in a [startsAt, endsAt) window
//
// State is kept in-module. reset() returns it to empty.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

let staff;     // Set<string>  of staff ids
let clients;   // Set<string>  of client ids
let services;  // Map<string, number>  serviceId -> duration in minutes
let bookings;  // Map<string, object>  bookingId -> stored booking record

function freshState() {
  staff = new Set();
  clients = new Set();
  services = new Map();
  bookings = new Map();
}

freshState();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

// Parse an ISO-8601 timestamp into epoch milliseconds.
// Returns null when the value is not a valid, unambiguous instant.
// We require an explicit timezone/offset (trailing Z or ±HH:MM) so that two
// bookings are always compared on the same absolute timeline — a bare local
// datetime like "2026-06-02T09:00" is ambiguous and rejected.
function parseInstant(v) {
  if (typeof v !== "string" || v.length === 0) return null;
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(v);
  if (!hasOffset) return null;
  const ms = Date.parse(v);
  if (Number.isNaN(ms)) return null;
  return ms;
}

// Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap iff
// they share a positive-length sub-interval. Touching at an endpoint
// (aEnd === bStart) does NOT count as overlap, so back-to-back bookings
// are allowed.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function reject(error) {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Registration API
// ---------------------------------------------------------------------------

export function reset() {
  freshState();
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) return reject("staff id must be a non-empty string");
  staff.add(id);
  return { ok: true };
}

export function addClient(id) {
  if (!isNonEmptyString(id)) return reject("client id must be a non-empty string");
  clients.add(id);
  return { ok: true };
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) return reject("service id must be a non-empty string");
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) {
    return reject("service minutes must be a finite number");
  }
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return reject("service minutes must be a positive integer");
  }
  services.set(id, minutes);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Booking API
// ---------------------------------------------------------------------------

export function book(b) {
  // ---- shape ----
  if (b === null || typeof b !== "object") {
    return reject("booking must be an object");
  }
  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  // ---- required identifiers ----
  if (!isNonEmptyString(id)) return reject("booking id must be a non-empty string");
  if (!isNonEmptyString(clientId)) return reject("clientId must be a non-empty string");
  if (!isNonEmptyString(staffId)) return reject("staffId must be a non-empty string");
  if (!isNonEmptyString(serviceId)) return reject("serviceId must be a non-empty string");

  // ---- referential integrity ----
  if (bookings.has(id)) return reject("booking id already exists");
  if (!clients.has(clientId)) return reject("unknown clientId");
  if (!staff.has(staffId)) return reject("unknown staffId");
  if (!services.has(serviceId)) return reject("unknown serviceId");

  // ---- time window ----
  const start = parseInstant(startsAt);
  const end = parseInstant(endsAt);
  if (start === null) return reject("startsAt must be an ISO-8601 instant with timezone");
  if (end === null) return reject("endsAt must be an ISO-8601 instant with timezone");
  if (end <= start) return reject("endsAt must be after startsAt");

  // ---- duration must match the service definition ----
  const minutes = services.get(serviceId);
  const durationMs = (end - start);
  if (durationMs !== minutes * 60_000) {
    return reject("window duration does not match service duration");
  }

  // ---- conflict detection: no double-booking ----
  // A staff member cannot serve two overlapping appointments, and a client
  // cannot be in two places at once. Touching endpoints are allowed.
  for (const existing of bookings.values()) {
    const sameStaff = existing.staffId === staffId;
    const sameClient = existing.clientId === clientId;
    if (!sameStaff && !sameClient) continue;
    if (overlaps(start, end, existing._start, existing._end)) {
      if (sameStaff) return reject("staff is already booked in that window");
      return reject("client is already booked in that window");
    }
  }

  // ---- accept & persist ----
  bookings.set(id, {
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
  // Return public records only (drop internal _start/_end cache fields),
  // sorted by start time for stable, sensible output.
  return [...bookings.values()]
    .sort((a, b) => a._start - b._start || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(({ _start, _end, ...rest }) => rest);
}

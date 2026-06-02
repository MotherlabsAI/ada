// Salon booking engine — self-contained, zero-dependency ESM module.
// All state is kept in-module. Times are ISO-8601 strings.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------
let staff;     // Set<string>  : registered stylist ids
let clients;   // Set<string>  : registered client ids
let services;  // Map<string, number> : serviceId -> duration in minutes
let bookings;  // Map<string, object>  : bookingId -> stored booking

reset();

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
export function reset() {
  staff = new Set();
  clients = new Set();
  services = new Map();
  bookings = new Map();
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) throw new Error('addStaff: id must be a non-empty string');
  staff.add(id);
}

export function addClient(id) {
  if (!isNonEmptyString(id)) throw new Error('addClient: id must be a non-empty string');
  clients.add(id);
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) throw new Error('addService: id must be a non-empty string');
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error('addService: minutes must be a positive integer');
  }
  services.set(id, minutes);
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------
export function book(b) {
  // Shape validation -------------------------------------------------------
  if (b === null || typeof b !== 'object') return fail('booking must be an object');

  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  if (!isNonEmptyString(id)) return fail('id is required');
  if (!isNonEmptyString(clientId)) return fail('clientId is required');
  if (!isNonEmptyString(staffId)) return fail('staffId is required');
  if (!isNonEmptyString(serviceId)) return fail('serviceId is required');
  if (!isNonEmptyString(startsAt)) return fail('startsAt is required');
  if (!isNonEmptyString(endsAt)) return fail('endsAt is required');

  // Uniqueness of booking id ----------------------------------------------
  if (bookings.has(id)) return fail(`booking id "${id}" already exists`);

  // Referential integrity --------------------------------------------------
  if (!clients.has(clientId)) return fail(`unknown client "${clientId}"`);
  if (!staff.has(staffId)) return fail(`unknown staff "${staffId}"`);
  if (!services.has(serviceId)) return fail(`unknown service "${serviceId}"`);

  // Time parsing -----------------------------------------------------------
  const start = parseInstant(startsAt);
  if (start === null) return fail('startsAt is not a valid ISO-8601 instant');
  const end = parseInstant(endsAt);
  if (end === null) return fail('endsAt is not a valid ISO-8601 instant');

  // Positive duration ------------------------------------------------------
  if (end <= start) return fail('endsAt must be after startsAt');

  // Duration must match the service's defined length -----------------------
  const expectedMinutes = services.get(serviceId);
  const actualMinutes = (end - start) / 60000;
  if (actualMinutes !== expectedMinutes) {
    return fail(
      `duration ${actualMinutes}min does not match service "${serviceId}" (${expectedMinutes}min)`
    );
  }

  // Double-booking checks (half-open interval [start, end)) ----------------
  for (const existing of bookings.values()) {
    if (existing.staffId === staffId && overlaps(start, end, existing._start, existing._end)) {
      return fail(`staff "${staffId}" is already booked in that window`);
    }
    if (existing.clientId === clientId && overlaps(start, end, existing._start, existing._end)) {
      return fail(`client "${clientId}" already has a booking in that window`);
    }
  }

  // Persist (store normalized epoch ms internally; expose original fields) --
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
  return [...bookings.values()].map(stripInternal);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fail(error) {
  return { ok: false, error };
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

// Parse an ISO-8601 instant to epoch ms. Requires a real date AND a time
// component so that ambiguous date-only strings are rejected for bookings.
function parseInstant(s) {
  // Must contain a 'T' time separator to count as a bookable instant.
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

// Half-open overlap test: [aStart, aEnd) intersects [bStart, bEnd).
// Back-to-back bookings (one ends exactly when the next begins) do NOT overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function stripInternal(b) {
  const { _start, _end, ...rest } = b;
  return { ...rest };
}

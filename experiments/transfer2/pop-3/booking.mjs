// Salon booking engine — self-contained, zero-dependency ESM module.
//
// Domain: staff (stylists) offer services; clients book a stylist for a
// service in a time window [startsAt, endsAt). All state lives in-module.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

let staff;     // Set<string>     known staff ids
let clients;   // Set<string>     known client ids
let services;  // Map<string, number>  serviceId -> duration in minutes
let bookings;  // Map<string, object>  bookingId -> stored booking record

reset();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A usable id is a non-empty string (after trimming). */
function isValidId(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Parse an ISO-8601 instant into epoch milliseconds.
 * Returns NaN for anything that is not a finite, well-formed timestamp.
 * We require a string that round-trips through Date so that loose inputs
 * like "" , "not-a-date", or numbers are rejected.
 */
function parseInstant(v) {
  if (typeof v !== "string" || v.trim().length === 0) return NaN;
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? ms : NaN;
}

/** Two half-open intervals [aS,aE) and [bS,bE) overlap iff aS < bE && bS < aE. */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function fail(error) {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function reset() {
  staff = new Set();
  clients = new Set();
  services = new Map();
  bookings = new Map();
}

export function addStaff(id) {
  if (!isValidId(id)) throw new Error("addStaff: id must be a non-empty string");
  staff.add(id);
}

export function addClient(id) {
  if (!isValidId(id)) throw new Error("addClient: id must be a non-empty string");
  clients.add(id);
}

export function addService(id, minutes) {
  if (!isValidId(id)) throw new Error("addService: id must be a non-empty string");
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || !Number.isInteger(minutes) || minutes <= 0) {
    throw new Error("addService: minutes must be a positive integer");
  }
  services.set(id, minutes);
}

/**
 * Attempt to make a booking.
 * b = { id, clientId, staffId, serviceId, startsAt, endsAt }
 * Returns { ok:true } on success (and persists), { ok:false, error } otherwise.
 */
export function book(b) {
  // --- shape ---
  if (b === null || typeof b !== "object" || Array.isArray(b)) {
    return fail("booking must be an object");
  }

  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  // --- id validity ---
  if (!isValidId(id)) return fail("booking id must be a non-empty string");
  if (!isValidId(clientId)) return fail("clientId must be a non-empty string");
  if (!isValidId(staffId)) return fail("staffId must be a non-empty string");
  if (!isValidId(serviceId)) return fail("serviceId must be a non-empty string");

  // --- unique booking id ---
  if (bookings.has(id)) return fail(`booking id already exists: ${id}`);

  // --- referential integrity: entities must be registered ---
  if (!clients.has(clientId)) return fail(`unknown client: ${clientId}`);
  if (!staff.has(staffId)) return fail(`unknown staff: ${staffId}`);
  if (!services.has(serviceId)) return fail(`unknown service: ${serviceId}`);

  // --- time parsing ---
  const start = parseInstant(startsAt);
  const end = parseInstant(endsAt);
  if (Number.isNaN(start)) return fail("startsAt is not a valid ISO-8601 time");
  if (Number.isNaN(end)) return fail("endsAt is not a valid ISO-8601 time");

  // --- positive, non-zero duration ---
  if (end <= start) return fail("endsAt must be strictly after startsAt");

  // --- duration must match the service definition ---
  const expectedMinutes = services.get(serviceId);
  const actualMinutes = (end - start) / 60000;
  if (actualMinutes !== expectedMinutes) {
    return fail(
      `booking duration ${actualMinutes}min does not match service ${serviceId} duration ${expectedMinutes}min`,
    );
  }

  // --- conflict detection: no double-booking for the same staff, and the
  //     same client cannot be in two places at once ---
  for (const existing of bookings.values()) {
    if (existing.staffId === staffId && overlaps(start, end, existing._start, existing._end)) {
      return fail(`staff ${staffId} is already booked in that window`);
    }
    if (existing.clientId === clientId && overlaps(start, end, existing._start, existing._end)) {
      return fail(`client ${clientId} already has a booking in that window`);
    }
  }

  // --- accept & persist ---
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
  // Return public-shape copies, hiding internal epoch fields, ordered by start.
  return [...bookings.values()]
    .sort((a, b) => a._start - b._start)
    .map(({ id, clientId, staffId, serviceId, startsAt, endsAt }) => ({
      id,
      clientId,
      staffId,
      serviceId,
      startsAt,
      endsAt,
    }));
}

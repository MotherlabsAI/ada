// Medical clinic appointment engine.
// Self-contained, zero-dependency ESM module. All state lives in-module.
//
// Domain model:
//   Staff   = doctors who provide services.
//   Client  = patients who book a doctor for a service in a time window.
//   Service = a procedure with a fixed expected duration in minutes.
//   Booking = { id, clientId, staffId, serviceId, startsAt, endsAt }
//
// A booking is accepted only when it is internally coherent (known refs,
// valid times, duration matches the service) and conflicts with no existing
// booking on the shared resources (the doctor and the patient).

const staff = new Map();    // id -> true
const clients = new Map();  // id -> true
const services = new Map(); // id -> minutes (positive integer)
let bookings = [];          // accepted Booking records (frozen copies)

export function reset() {
  staff.clear();
  clients.clear();
  services.clear();
  bookings = [];
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) throw new Error('addStaff: id must be a non-empty string');
  staff.set(id, true);
}

export function addClient(id) {
  if (!isNonEmptyString(id)) throw new Error('addClient: id must be a non-empty string');
  clients.set(id, true);
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) throw new Error('addService: id must be a non-empty string');
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error('addService: minutes must be a positive integer');
  }
  services.set(id, minutes);
}

export function book(b) {
  // --- shape ---
  if (b == null || typeof b !== 'object') {
    return reject('booking must be an object');
  }
  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  // --- required identifiers ---
  if (!isNonEmptyString(id)) return reject('id must be a non-empty string');
  if (!isNonEmptyString(clientId)) return reject('clientId must be a non-empty string');
  if (!isNonEmptyString(staffId)) return reject('staffId must be a non-empty string');
  if (!isNonEmptyString(serviceId)) return reject('serviceId must be a non-empty string');

  // --- referential integrity ---
  if (!clients.has(clientId)) return reject(`unknown client: ${clientId}`);
  if (!staff.has(staffId)) return reject(`unknown staff: ${staffId}`);
  if (!services.has(serviceId)) return reject(`unknown service: ${serviceId}`);

  // --- unique booking id ---
  if (bookings.some((x) => x.id === id)) return reject(`duplicate booking id: ${id}`);

  // --- time parsing & validity ---
  const start = parseInstant(startsAt);
  if (start === null) return reject('startsAt must be a valid ISO-8601 instant');
  const end = parseInstant(endsAt);
  if (end === null) return reject('endsAt must be a valid ISO-8601 instant');
  if (end <= start) return reject('endsAt must be after startsAt');

  // --- duration must match the service definition ---
  const expectedMs = services.get(serviceId) * 60_000;
  if (end - start !== expectedMs) {
    return reject(
      `duration must equal service length of ${services.get(serviceId)} minute(s)`
    );
  }

  // --- no double-booking the doctor; no double-booking the patient ---
  for (const x of bookings) {
    if (x.staffId === staffId && overlaps(start, end, x._start, x._end)) {
      return reject(`staff ${staffId} is already booked in that window`);
    }
    if (x.clientId === clientId && overlaps(start, end, x._start, x._end)) {
      return reject(`client ${clientId} is already booked in that window`);
    }
  }

  // --- accept & persist (store parsed bounds for future overlap checks) ---
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
  // Return public view only; never leak internal parsed bounds.
  return bookings.map(({ id, clientId, staffId, serviceId, startsAt, endsAt }) => ({
    id,
    clientId,
    staffId,
    serviceId,
    startsAt,
    endsAt,
  }));
}

// ---------- helpers ----------

function reject(error) {
  return { ok: false, error };
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.length > 0;
}

// Parse an ISO-8601 instant into epoch-ms. Returns null on anything
// non-conforming. Requires a real date string (not just any Date-coercible
// value) and rejects ambiguous local times by demanding an explicit offset
// or 'Z', so two clients in different zones can't collide silently.
function parseInstant(v) {
  if (typeof v !== 'string' || v.length === 0) return null;
  // Must look like a full ISO date-time with timezone designator.
  // e.g. 2026-06-02T09:00:00Z or 2026-06-02T09:00:00+02:00
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
  if (!iso.test(v)) return null;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? null : ms;
}

// Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).
// Back-to-back appointments (one ends exactly when the next starts) do NOT
// overlap, which is the correct clinic semantics.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

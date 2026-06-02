// Salon booking engine — self-contained, zero-dependency ESM module.
// All state is kept in-module. The model:
//   - staff   : the stylists who perform services
//   - clients : the people booking
//   - services: a service id -> duration in minutes
//   - bookings: accepted reservations (one stylist, one service, one window)
//
// A booking is accepted only if every rule in `book()` passes. On any failure we
// return { ok:false, error }. On success we persist the booking and return { ok:true }.

const state = {
  staff: new Set(),
  clients: new Set(),
  services: new Map(), // id -> minutes (positive integer)
  bookings: [],        // accepted booking records
};

export function reset() {
  state.staff = new Set();
  state.clients = new Set();
  state.services = new Map();
  state.bookings = [];
}

export function addStaff(id) {
  if (!isNonEmptyString(id)) throw new Error('addStaff: id must be a non-empty string');
  state.staff.add(id);
}

export function addClient(id) {
  if (!isNonEmptyString(id)) throw new Error('addClient: id must be a non-empty string');
  state.clients.add(id);
}

export function addService(id, minutes) {
  if (!isNonEmptyString(id)) throw new Error('addService: id must be a non-empty string');
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new Error('addService: minutes must be a positive integer');
  }
  state.services.set(id, minutes);
}

export function book(b) {
  // --- shape validation ---
  if (b === null || typeof b !== 'object') {
    return fail('booking must be an object');
  }
  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  if (!isNonEmptyString(id)) return fail('id must be a non-empty string');
  if (!isNonEmptyString(clientId)) return fail('clientId must be a non-empty string');
  if (!isNonEmptyString(staffId)) return fail('staffId must be a non-empty string');
  if (!isNonEmptyString(serviceId)) return fail('serviceId must be a non-empty string');

  // --- unique booking id ---
  if (state.bookings.some((x) => x.id === id)) {
    return fail(`duplicate booking id: ${id}`);
  }

  // --- referential integrity: entities must exist ---
  if (!state.clients.has(clientId)) return fail(`unknown client: ${clientId}`);
  if (!state.staff.has(staffId)) return fail(`unknown staff: ${staffId}`);
  if (!state.services.has(serviceId)) return fail(`unknown service: ${serviceId}`);

  // --- time validity ---
  const start = parseInstant(startsAt);
  if (start === null) return fail('startsAt must be a valid ISO-8601 time');
  const end = parseInstant(endsAt);
  if (end === null) return fail('endsAt must be a valid ISO-8601 time');

  if (end <= start) return fail('endsAt must be strictly after startsAt');

  // --- duration must match the service definition exactly ---
  const expectedMinutes = state.services.get(serviceId);
  const actualMinutes = (end - start) / 60000;
  if (actualMinutes !== expectedMinutes) {
    return fail(
      `window length (${actualMinutes} min) must equal service duration (${expectedMinutes} min)`,
    );
  }

  // --- no double-booking the same stylist (overlap on staff) ---
  for (const existing of state.bookings) {
    if (existing.staffId !== staffId) continue;
    if (overlaps(start, end, existing.start, existing.end)) {
      return fail(`stylist ${staffId} is already booked in that window`);
    }
  }

  // --- a client cannot be in two places at once (overlap on client) ---
  for (const existing of state.bookings) {
    if (existing.clientId !== clientId) continue;
    if (overlaps(start, end, existing.start, existing.end)) {
      return fail(`client ${clientId} already has a booking in that window`);
    }
  }

  // --- accept & persist ---
  state.bookings.push({
    id,
    clientId,
    staffId,
    serviceId,
    startsAt,
    endsAt,
    start, // numeric epoch ms, kept for overlap checks
    end,
  });

  return { ok: true };
}

export function listBookings() {
  // Return a clean public view (omit internal numeric fields), defensively copied.
  return state.bookings.map(({ id, clientId, staffId, serviceId, startsAt, endsAt }) => ({
    id,
    clientId,
    staffId,
    serviceId,
    startsAt,
    endsAt,
  }));
}

// ---------- helpers ----------

function fail(error) {
  return { ok: false, error };
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Parse an ISO-8601 timestamp to epoch ms. Returns null if invalid.
// Requires a full date-time (rejects bare "2026-06-02" date-only strings and
// other loosely-parsed values) so two bookings always compare on the same axis.
function parseInstant(s) {
  if (typeof s !== 'string' || s.trim().length === 0) return null;
  // Must look like a date-time: date + 'T' + time component.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

// Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).
// Back-to-back bookings (one ends exactly when the next begins) do NOT overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

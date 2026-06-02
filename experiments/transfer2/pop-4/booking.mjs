// Salon booking engine — self-contained, zero-dependency ESM module.
// All state is kept in-module. Times are ISO-8601 strings.

const staff = new Map();        // staffId -> true
const clients = new Map();      // clientId -> true
const services = new Map();     // serviceId -> minutes
const bookings = [];            // accepted booking records

export function reset() {
  staff.clear();
  clients.clear();
  services.clear();
  bookings.length = 0;
}

export function addStaff(id) {
  if (id === undefined || id === null || id === "") {
    return { ok: false, error: "invalid staff id" };
  }
  staff.set(id, true);
  return { ok: true };
}

export function addClient(id) {
  if (id === undefined || id === null || id === "") {
    return { ok: false, error: "invalid client id" };
  }
  clients.set(id, true);
  return { ok: true };
}

export function addService(id, minutes) {
  if (id === undefined || id === null || id === "") {
    return { ok: false, error: "invalid service id" };
  }
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0 || !Number.isInteger(minutes)) {
    return { ok: false, error: "invalid service duration" };
  }
  services.set(id, minutes);
  return { ok: true };
}

// Strict ISO-8601 parse. Returns epoch ms or NaN. Requires a full
// date-time with a timezone designator (Z or +/-hh:mm) so comparisons
// across inputs are unambiguous.
function parseISO(value) {
  if (typeof value !== "string") return NaN;
  const re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
  if (!re.test(value)) return NaN;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? NaN : ms;
}

// Half-open interval overlap: [aStart, aEnd) intersects [bStart, bEnd).
// Back-to-back bookings (one ends exactly when the next starts) do NOT overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function book(b) {
  if (b === undefined || b === null || typeof b !== "object") {
    return { ok: false, error: "invalid booking" };
  }

  const { id, clientId, staffId, serviceId, startsAt, endsAt } = b;

  // Required identifiers present.
  if (id === undefined || id === null || id === "") {
    return { ok: false, error: "missing booking id" };
  }
  if (clientId === undefined || clientId === null || clientId === "") {
    return { ok: false, error: "missing client id" };
  }
  if (staffId === undefined || staffId === null || staffId === "") {
    return { ok: false, error: "missing staff id" };
  }
  if (serviceId === undefined || serviceId === null || serviceId === "") {
    return { ok: false, error: "missing service id" };
  }

  // Unique booking id.
  if (bookings.some((x) => x.id === id)) {
    return { ok: false, error: "duplicate booking id" };
  }

  // Referential integrity: entities must be registered.
  if (!clients.has(clientId)) {
    return { ok: false, error: "unknown client" };
  }
  if (!staff.has(staffId)) {
    return { ok: false, error: "unknown staff" };
  }
  if (!services.has(serviceId)) {
    return { ok: false, error: "unknown service" };
  }

  // Valid, parseable time window.
  const start = parseISO(startsAt);
  const end = parseISO(endsAt);
  if (Number.isNaN(start)) {
    return { ok: false, error: "invalid startsAt" };
  }
  if (Number.isNaN(end)) {
    return { ok: false, error: "invalid endsAt" };
  }

  // Positive-duration window.
  if (end <= start) {
    return { ok: false, error: "end must be after start" };
  }

  // Window duration must match the service's defined duration.
  const expectedMinutes = services.get(serviceId);
  const actualMinutes = (end - start) / 60000;
  if (actualMinutes !== expectedMinutes) {
    return { ok: false, error: "duration does not match service" };
  }

  // Double-booking checks against accepted bookings.
  for (const existing of bookings) {
    if (!overlaps(start, end, existing.start, existing.end)) continue;
    // Same stylist cannot serve two clients at once.
    if (existing.staffId === staffId) {
      return { ok: false, error: "staff double-booked" };
    }
    // Same client cannot be in two places at once.
    if (existing.clientId === clientId) {
      return { ok: false, error: "client double-booked" };
    }
  }

  // Accept and persist.
  bookings.push({
    id,
    clientId,
    staffId,
    serviceId,
    startsAt,
    endsAt,
    start,
    end,
  });

  return { ok: true };
}

export function listBookings() {
  // Return a stable, defensive copy of the public shape.
  return bookings.map((x) => ({
    id: x.id,
    clientId: x.clientId,
    staffId: x.staffId,
    serviceId: x.serviceId,
    startsAt: x.startsAt,
    endsAt: x.endsAt,
  }));
}

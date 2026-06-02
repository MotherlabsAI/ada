// Meeting-room reservation module.
// Self-contained, zero-dependency ESM. All state lives in this module.

// ---- In-module state -------------------------------------------------------

const rooms = new Set();          // known room ids
const reservations = [];          // accepted reservations (insertion order)
const seenReservationIds = new Set(); // for idempotency / duplicate detection

// ---- Helpers ---------------------------------------------------------------

const isNonEmptyString = (v) => typeof v === "string" && v.length > 0;

// Parse an ISO-8601 string strictly: it must be a real, fully-specified
// instant. We require a date+time and accept an offset/Z. We reject anything
// Date can't parse or that round-trips loosely (e.g. "2026-13-40").
function parseInstant(s) {
  if (!isNonEmptyString(s)) return null;
  // Require at least YYYY-MM-DDTHH:MM with optional seconds/fraction/offset.
  const iso =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/;
  if (!iso.test(s)) return null;
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return null;
  return ms;
}

function fail(error) {
  return { ok: false, error };
}

// Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap iff
// aStart < bEnd && bStart < aEnd. Back-to-back bookings (end == start) are OK.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ---- Public API ------------------------------------------------------------

export function reset() {
  rooms.clear();
  reservations.length = 0;
  seenReservationIds.clear();
}

export function addRoom(id) {
  if (!isNonEmptyString(id)) return fail("room id must be a non-empty string");
  if (rooms.has(id)) return fail("room already exists");
  rooms.add(id);
  return { ok: true };
}

export function reserve(r) {
  // Shape validation.
  if (r === null || typeof r !== "object") return fail("reservation must be an object");

  const { id, roomId, startsAt, endsAt } = r;

  if (!isNonEmptyString(id)) return fail("id must be a non-empty string");
  if (!isNonEmptyString(roomId)) return fail("roomId must be a non-empty string");

  // Duplicate reservation id is rejected (ids must be unique).
  if (seenReservationIds.has(id)) return fail("duplicate reservation id");

  // Room must be known.
  if (!rooms.has(roomId)) return fail("unknown roomId");

  // Time validation.
  const start = parseInstant(startsAt);
  if (start === null) return fail("startsAt must be a valid ISO-8601 datetime");
  const end = parseInstant(endsAt);
  if (end === null) return fail("endsAt must be a valid ISO-8601 datetime");

  if (!(start < end)) return fail("startsAt must be strictly before endsAt");

  // No overlap with an existing reservation in the same room.
  for (const ex of reservations) {
    if (ex.roomId !== roomId) continue;
    if (overlaps(start, end, ex._start, ex._end)) {
      return fail("time conflict with an existing reservation");
    }
  }

  // Accept and persist.
  reservations.push({
    id,
    roomId,
    startsAt,
    endsAt,
    _start: start,
    _end: end,
  });
  seenReservationIds.add(id);

  return { ok: true };
}

export function listReservations() {
  // Return clean public copies, without internal numeric fields.
  return reservations.map(({ id, roomId, startsAt, endsAt }) => ({
    id,
    roomId,
    startsAt,
    endsAt,
  }));
}

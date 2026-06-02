// Meeting-room reservation module.
// Single self-contained zero-dependency ESM file. All state kept in-module.

// ---- In-module state ----
const rooms = new Set();          // known room ids
const reservations = new Map();   // reservation id -> reservation record

// ---- Helpers ----

const ISO_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// Parse an ISO-8601 instant. Returns epoch ms, or NaN if invalid.
// We require an explicit timezone offset (Z or +/-hh:mm) so that two
// instants are unambiguously comparable.
function parseInstant(s) {
  if (!isNonEmptyString(s)) return NaN;
  if (!ISO_RE.test(s)) return NaN;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? NaN : ms;
}

// Two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap iff
// aStart < bEnd && bStart < aEnd. Touching at an endpoint does not overlap.
function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ---- Public API ----

export function reset() {
  rooms.clear();
  reservations.clear();
}

export function addRoom(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "INVALID_ROOM_ID" };
  }
  rooms.add(id);
  return { ok: true };
}

export function reserve(r) {
  // 1. Payload must be an object.
  if (r === null || typeof r !== "object") {
    return { ok: false, error: "INVALID_PAYLOAD" };
  }

  const { id, roomId, startsAt, endsAt } = r;

  // 2. Reservation id must be a non-empty string.
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "INVALID_RESERVATION_ID" };
  }

  // 3. Reservation id must be unique (no silent overwrite).
  if (reservations.has(id)) {
    return { ok: false, error: "DUPLICATE_RESERVATION_ID" };
  }

  // 4. roomId must be a non-empty string.
  if (!isNonEmptyString(roomId)) {
    return { ok: false, error: "INVALID_ROOM_ID" };
  }

  // 5. Room must exist (have been added first).
  if (!rooms.has(roomId)) {
    return { ok: false, error: "UNKNOWN_ROOM" };
  }

  // 6. startsAt / endsAt must be valid ISO-8601 instants with a timezone.
  const start = parseInstant(startsAt);
  if (Number.isNaN(start)) {
    return { ok: false, error: "INVALID_START" };
  }
  const end = parseInstant(endsAt);
  if (Number.isNaN(end)) {
    return { ok: false, error: "INVALID_END" };
  }

  // 7. The interval must be positive (start strictly before end).
  if (start >= end) {
    return { ok: false, error: "NON_POSITIVE_INTERVAL" };
  }

  // 8. No overlap with an existing reservation in the same room.
  //    Intervals are half-open, so back-to-back bookings are allowed.
  for (const existing of reservations.values()) {
    if (existing.roomId !== roomId) continue;
    if (overlaps(start, end, existing._start, existing._end)) {
      return { ok: false, error: "OVERLAP" };
    }
  }

  // Accept and persist.
  reservations.set(id, {
    id,
    roomId,
    startsAt,
    endsAt,
    _start: start,
    _end: end,
  });

  return { ok: true };
}

export function listReservations() {
  // Return a stable, sorted snapshot without internal fields.
  return [...reservations.values()]
    .sort((a, b) => a._start - b._start || a.id.localeCompare(b.id))
    .map(({ id, roomId, startsAt, endsAt }) => ({
      id,
      roomId,
      startsAt,
      endsAt,
    }));
}

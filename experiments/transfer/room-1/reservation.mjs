// Meeting-room reservation module.
// Self-contained, zero-dependency ESM. All state lives in this module.

// --- In-module state ---------------------------------------------------------

/** @type {Set<string>} known room ids */
let rooms = new Set();

/** @type {Array<{id:string, roomId:string, startsAt:string, endsAt:string, startMs:number, endMs:number}>} */
let reservations = [];

/** @type {Set<string>} reservation ids already used (must be unique) */
let reservationIds = new Set();

// --- Helpers -----------------------------------------------------------------

/**
 * Parse a strict ISO-8601 instant into epoch milliseconds.
 * Returns NaN for anything that is not a well-formed, unambiguous instant.
 *
 * We require a date, a 'T' time separator, and an explicit timezone
 * designator ('Z' or +/-HH:MM). Without a timezone the instant is ambiguous,
 * so we reject it rather than guess the host's local zone.
 */
function parseInstant(value) {
  if (typeof value !== "string") return NaN;
  const s = value.trim();
  if (s === "") return NaN;

  // YYYY-MM-DD T HH:MM[:SS[.fff]] (Z | +HH:MM | -HH:MM)
  const iso =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/;
  if (!iso.test(s)) return NaN;

  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return NaN;

  // Guard against calendar rollover (e.g. month 13, day 32, "2026-02-30").
  // Date.parse tolerates some of these on some engines, so validate the raw
  // calendar fields from the source string directly. Offset-bearing
  // timestamps shift the UTC date, so we never compare against a parsed Date.
  const m = iso.exec(s);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!validCalendar(year, month, day)) return NaN;

  return ms;
}

/** Validate Y-M-D as a real calendar date. */
function validCalendar(year, month, day) {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  const daysInMonth = [
    31,
    isLeap(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function reject(error) {
  return { ok: false, error };
}

function accept() {
  return { ok: true };
}

// --- Public API --------------------------------------------------------------

/** Clear all state. */
export function reset() {
  rooms = new Set();
  reservations = [];
  reservationIds = new Set();
}

/**
 * Register a room. Idempotent on the same id.
 * @returns {{ok:true} | {ok:false, error:string}}
 */
export function addRoom(id) {
  if (typeof id !== "string" || id.trim() === "") {
    return reject("room id must be a non-empty string");
  }
  rooms.add(id);
  return accept();
}

/**
 * Reserve a room for a half-open time interval [startsAt, endsAt).
 *
 * @param {{id:string, roomId:string, startsAt:string, endsAt:string}} r
 * @returns {{ok:true} | {ok:false, error:string}}
 */
export function reserve(r) {
  // R1: payload shape
  if (r === null || typeof r !== "object") {
    return reject("reservation must be an object");
  }
  const { id, roomId, startsAt, endsAt } = r;

  // R2: reservation id is a non-empty string
  if (typeof id !== "string" || id.trim() === "") {
    return reject("id must be a non-empty string");
  }

  // R3: reservation id must be unique
  if (reservationIds.has(id)) {
    return reject(`reservation id already exists: ${id}`);
  }

  // R4: roomId is a non-empty string
  if (typeof roomId !== "string" || roomId.trim() === "") {
    return reject("roomId must be a non-empty string");
  }

  // R5: room must be registered first
  if (!rooms.has(roomId)) {
    return reject(`unknown room: ${roomId}`);
  }

  // R6: both timestamps must be well-formed, real ISO-8601 instants that
  // carry an explicit timezone (Z or +/-HH:MM).
  const startMs = parseInstant(startsAt);
  if (Number.isNaN(startMs)) {
    return reject(
      "startsAt must be a valid ISO-8601 instant with a timezone (Z or +/-HH:MM)",
    );
  }
  const endMs = parseInstant(endsAt);
  if (Number.isNaN(endMs)) {
    return reject(
      "endsAt must be a valid ISO-8601 instant with a timezone (Z or +/-HH:MM)",
    );
  }

  // R7: interval must be strictly positive (end strictly after start)
  if (endMs <= startMs) {
    return reject("endsAt must be strictly after startsAt");
  }

  // R8: no overlap with an existing reservation for the same room.
  // Intervals are half-open [start, end): touching at an endpoint is allowed,
  // so a booking ending at 10:00 and another starting at 10:00 do not conflict.
  for (const existing of reservations) {
    if (existing.roomId !== roomId) continue;
    const overlaps = startMs < existing.endMs && existing.startMs < endMs;
    if (overlaps) {
      return reject(
        `time conflict in room ${roomId} with reservation ${existing.id}`,
      );
    }
  }

  // Accept: persist a normalized copy and record the id for uniqueness.
  reservations.push({
    id,
    roomId,
    startsAt,
    endsAt,
    startMs,
    endMs,
  });
  reservationIds.add(id);
  return accept();
}

/**
 * Return a snapshot of all reservations (public fields only).
 * @returns {Array<{id:string, roomId:string, startsAt:string, endsAt:string}>}
 */
export function listReservations() {
  return reservations.map(({ id, roomId, startsAt, endsAt }) => ({
    id,
    roomId,
    startsAt,
    endsAt,
  }));
}

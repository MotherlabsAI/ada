// Meeting-room reservation module.
// Self-contained, zero-dependency ESM. All state lives in-module.
//
// Public API:
//   reset()
//   addRoom(id)
//   reserve(r) -> { ok: boolean, error?: string }
//   listReservations() -> array
//
// A reservation r = { id, roomId, startsAt, endsAt } with ISO-8601 string times.

// ---------------------------------------------------------------------------
// In-module state
// ---------------------------------------------------------------------------

/** @type {Set<string>} known room ids */
const rooms = new Set();

/** @type {Array<{id:string, roomId:string, startsAt:string, endsAt:string, start:number, end:number}>} */
let reservations = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a strict ISO-8601 instant and return epoch milliseconds, or NaN.
 * We require a real date AND that the string round-trips, so junk like
 * "2026-13-40" or "not-a-date" is rejected rather than silently coerced.
 */
function parseInstant(value) {
  if (typeof value !== "string" || value.trim() === "") return NaN;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return NaN;
  return ms;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/** Two half-open intervals [aStart,aEnd) and [bStart,bEnd) overlap? */
function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Clear all rooms and reservations. */
export function reset() {
  rooms.clear();
  reservations = [];
}

/**
 * Register a room. Idempotent: re-adding an existing room is a no-op success.
 * @param {string} id
 * @returns {{ok:boolean, error?:string}}
 */
export function addRoom(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "addRoom: id must be a non-empty string" };
  }
  rooms.add(id);
  return { ok: true };
}

/**
 * Attempt to reserve a room for an interval.
 * @param {{id:string, roomId:string, startsAt:string, endsAt:string}} r
 * @returns {{ok:boolean, error?:string}}
 */
export function reserve(r) {
  // Rule 1: payload must be an object.
  if (r === null || typeof r !== "object" || Array.isArray(r)) {
    return { ok: false, error: "reservation must be an object" };
  }

  const { id, roomId, startsAt, endsAt } = r;

  // Rule 2: reservation id required (non-empty string).
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "id is required and must be a non-empty string" };
  }

  // Rule 3: roomId required (non-empty string).
  if (!isNonEmptyString(roomId)) {
    return { ok: false, error: "roomId is required and must be a non-empty string" };
  }

  // Rule 4: roomId must reference a known room.
  if (!rooms.has(roomId)) {
    return { ok: false, error: `unknown roomId: ${roomId}` };
  }

  // Rule 5: startsAt and endsAt must be valid ISO-8601 instants.
  const start = parseInstant(startsAt);
  if (Number.isNaN(start)) {
    return { ok: false, error: "startsAt must be a valid ISO-8601 datetime string" };
  }
  const end = parseInstant(endsAt);
  if (Number.isNaN(end)) {
    return { ok: false, error: "endsAt must be a valid ISO-8601 datetime string" };
  }

  // Rule 6: interval must be strictly positive (end after start).
  if (end <= start) {
    return { ok: false, error: "endsAt must be strictly after startsAt" };
  }

  // Rule 7: reservation id must be unique across all reservations.
  if (reservations.some((x) => x.id === id)) {
    return { ok: false, error: `duplicate reservation id: ${id}` };
  }

  // Rule 8: no double-booking — interval must not overlap an existing
  // reservation for the SAME room. Half-open intervals, so back-to-back
  // bookings (one ends exactly when the next begins) are allowed.
  for (const existing of reservations) {
    if (existing.roomId !== roomId) continue;
    if (intervalsOverlap(start, end, existing.start, existing.end)) {
      return {
        ok: false,
        error: `time conflict in room ${roomId} with reservation ${existing.id}`,
      };
    }
  }

  // Accept and persist. Store normalized epoch ms alongside the original
  // ISO strings so overlap checks are timezone-correct.
  reservations.push({ id, roomId, startsAt, endsAt, start, end });
  return { ok: true };
}

/**
 * Return a snapshot copy of all reservations (public-shaped, no internal
 * epoch fields, no live references into module state).
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

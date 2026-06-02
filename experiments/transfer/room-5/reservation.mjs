// Meeting-room reservation module.
// Self-contained, zero-dependency ESM. All state lives in-module.

// ---- In-module state ----------------------------------------------------

/** @type {Set<string>} known room ids */
let rooms = new Set();

/** @type {Array<{id:string, roomId:string, startsAt:string, endsAt:string, start:number, end:number}>} */
let reservations = [];

/** @type {Set<string>} reservation ids, for dedupe */
let reservationIds = new Set();

// ---- Helpers ------------------------------------------------------------

// Strict ISO-8601 instant: date + time + explicit zone (Z or +/-HH:MM).
// We require an explicit offset so two strings compare as the same instant
// regardless of how they were written.
const ISO_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function isNonEmptyString(v) {
  return typeof v === "string" && v.length > 0;
}

function parseInstant(s) {
  if (!isNonEmptyString(s) || !ISO_RE.test(s)) return NaN;
  const t = Date.parse(s);
  return Number.isNaN(t) ? NaN : t;
}

function reject(error) {
  return { ok: false, error };
}

function accept() {
  return { ok: true };
}

// ---- Public API ---------------------------------------------------------

export function reset() {
  rooms = new Set();
  reservations = [];
  reservationIds = new Set();
}

export function addRoom(id) {
  if (!isNonEmptyString(id)) {
    return reject("room id must be a non-empty string");
  }
  rooms.add(id);
  return accept();
}

export function reserve(r) {
  // 1. Shape: r must be an object.
  if (r === null || typeof r !== "object" || Array.isArray(r)) {
    return reject("reservation must be an object");
  }

  const { id, roomId, startsAt, endsAt } = r;

  // 2. Required string fields.
  if (!isNonEmptyString(id)) {
    return reject("id must be a non-empty string");
  }
  if (!isNonEmptyString(roomId)) {
    return reject("roomId must be a non-empty string");
  }

  // 3. Reservation id must be unique (idempotency / no silent overwrite).
  if (reservationIds.has(id)) {
    return reject(`reservation id already exists: ${id}`);
  }

  // 4. Room must be registered.
  if (!rooms.has(roomId)) {
    return reject(`unknown room: ${roomId}`);
  }

  // 5. Timestamps must be valid ISO-8601 instants with an explicit zone.
  const start = parseInstant(startsAt);
  if (Number.isNaN(start)) {
    return reject("startsAt must be a valid ISO-8601 datetime with timezone");
  }
  const end = parseInstant(endsAt);
  if (Number.isNaN(end)) {
    return reject("endsAt must be a valid ISO-8601 datetime with timezone");
  }

  // 6. Interval must be positive (end strictly after start).
  if (end <= start) {
    return reject("endsAt must be after startsAt");
  }

  // 7. No overlap with an existing reservation in the same room.
  //    Intervals are half-open [start, end): touching at an edge is allowed.
  for (const existing of reservations) {
    if (existing.roomId !== roomId) continue;
    if (start < existing.end && existing.start < end) {
      return reject(
        `time conflict in room ${roomId} with reservation ${existing.id}`
      );
    }
  }

  // Accept: persist.
  reservations.push({ id, roomId, startsAt, endsAt, start, end });
  reservationIds.add(id);
  return accept();
}

export function listReservations() {
  // Return a defensive copy with only the public fields.
  return reservations.map(({ id, roomId, startsAt, endsAt }) => ({
    id,
    roomId,
    startsAt,
    endsAt,
  }));
}

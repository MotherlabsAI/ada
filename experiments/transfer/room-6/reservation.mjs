// Meeting-room reservation module.
// Self-contained, zero-dependency ESM. All state lives in-module.

// ---- In-module state ----
const rooms = new Set();
/** @type {Array<{id:string, roomId:string, startsAt:string, endsAt:string, start:number, end:number}>} */
let reservations = [];

// ---- Helpers ----

const isNonEmptyString = (v) => typeof v === "string" && v.length > 0;

// Strict ISO-8601 instant parse. Requires a date, time, and explicit offset
// (Z or +/-HH:MM) so two timestamps are always comparable on one timeline.
// Returns epoch ms, or NaN if the string is not a valid strict ISO-8601 instant.
const ISO_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/;

function parseInstant(s) {
  if (!isNonEmptyString(s)) return NaN;
  const m = ISO_RE.exec(s);
  if (!m) return NaN;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return NaN;

  const [, y, mo, d, h, mi, se] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = se ? Number(se) : 0;

  // Reject calendar/clock-invalid fields that Date.parse silently rolls over
  // (e.g. 2026-02-30 -> March, month 13, hour 25). Validate each field against
  // its real bounds directly — independent of timezone offset.
  if (month < 1 || month > 12) return NaN;
  if (hour > 23 || minute > 59 || second > 59) return NaN;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return NaN;

  return t;
}

// Half-open interval overlap: [aStart, aEnd) intersects [bStart, bEnd).
// Touching at an endpoint (a.end === b.start) is NOT an overlap.
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// ---- Public API ----

export function reset() {
  rooms.clear();
  reservations = [];
}

export function addRoom(id) {
  if (!isNonEmptyString(id)) {
    return { ok: false, error: "roomId must be a non-empty string" };
  }
  rooms.add(id);
  return { ok: true };
}

export function reserve(r) {
  // Shape
  if (r === null || typeof r !== "object") {
    return { ok: false, error: "reservation must be an object" };
  }
  const { id, roomId, startsAt, endsAt } = r;

  if (!isNonEmptyString(id)) {
    return { ok: false, error: "id must be a non-empty string" };
  }
  if (!isNonEmptyString(roomId)) {
    return { ok: false, error: "roomId must be a non-empty string" };
  }
  if (!isNonEmptyString(startsAt)) {
    return { ok: false, error: "startsAt must be a non-empty string" };
  }
  if (!isNonEmptyString(endsAt)) {
    return { ok: false, error: "endsAt must be a non-empty string" };
  }

  // Room must exist
  if (!rooms.has(roomId)) {
    return { ok: false, error: `unknown room: ${roomId}` };
  }

  // Timestamps must be valid strict ISO-8601 instants
  const start = parseInstant(startsAt);
  if (Number.isNaN(start)) {
    return { ok: false, error: "startsAt is not a valid ISO-8601 instant" };
  }
  const end = parseInstant(endsAt);
  if (Number.isNaN(end)) {
    return { ok: false, error: "endsAt is not a valid ISO-8601 instant" };
  }

  // Positive duration
  if (end <= start) {
    return { ok: false, error: "endsAt must be after startsAt" };
  }

  // Unique reservation id (idempotency / no silent overwrite)
  if (reservations.some((x) => x.id === id)) {
    return { ok: false, error: `duplicate reservation id: ${id}` };
  }

  // No double-booking: same room, overlapping time window
  const clash = reservations.find(
    (x) => x.roomId === roomId && overlaps(start, end, x.start, x.end),
  );
  if (clash) {
    return { ok: false, error: `time conflict in room ${roomId}` };
  }

  reservations.push({ id, roomId, startsAt, endsAt, start, end });
  return { ok: true };
}

export function listReservations() {
  // Return a defensive copy of the public-facing fields, sorted by start time.
  return reservations
    .slice()
    .sort((a, b) => a.start - b.start || a.roomId.localeCompare(b.roomId))
    .map(({ id, roomId, startsAt, endsAt }) => ({ id, roomId, startsAt, endsAt }));
}

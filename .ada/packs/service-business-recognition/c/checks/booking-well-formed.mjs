export const name = "booking_well_formed";
export const invariant =
  "Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends.";
export const checkClass = "C5";

export function run(data) {
  const TERMINAL = ['cancelled', 'completed', 'no_show'];
  const live = (data.bookings || []).filter((b) => !TERMINAL.includes(b.status));
  const violations = [];
  for (const b of live) {
    const missing = ['staffId', 'clientId', 'serviceId', 'startsAt', 'endsAt'].filter(
      (k) => !b[k],
    );
    if (missing.length) {
      violations.push({ kind: 'missing_refs', booking: b.id, missing });
      continue;
    }
    const s = Date.parse(b.startsAt);
    const e = Date.parse(b.endsAt);
    if (Number.isNaN(s) || Number.isNaN(e)) {
      violations.push({ kind: 'unparseable_interval', booking: b.id });
    } else if (s >= e) {
      violations.push({ kind: 'bad_interval', booking: b.id });
    }
  }
  return { name, pass: violations.length === 0, violations };
}

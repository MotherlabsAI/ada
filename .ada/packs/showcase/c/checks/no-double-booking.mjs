export const name = "no_double_booking";
export const invariant =
  "No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped.";
export const checkClass = "C4";

export function run(data) {
  const TERMINAL = ['cancelled', 'completed', 'no_show'];
  const live = (data.bookings || []).filter((b) => !TERMINAL.includes(b.status));
  const violations = [];
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (a.staffId !== b.staffId) continue;
      const aStart = Date.parse(a.startsAt);
      const aEnd = Date.parse(a.endsAt);
      const bStart = Date.parse(b.startsAt);
      const bEnd = Date.parse(b.endsAt);
      // Unparseable data is exactly when a conflict is most likely; never let
      // NaN comparisons (always false) silently report 'no overlap'.
      if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) {
        violations.push({
          kind: 'unparseable_dates',
          staffId: a.staffId,
          bookings: [a.id, b.id],
        });
        continue;
      }
      // Half-open intervals: touching slots (end === start) do NOT overlap.
      if (aStart < bEnd && bStart < aEnd) {
        violations.push({
          kind: 'overlap',
          staffId: a.staffId,
          bookings: [a.id, b.id],
        });
      }
    }
  }
  return { name, pass: violations.length === 0, violations };
}

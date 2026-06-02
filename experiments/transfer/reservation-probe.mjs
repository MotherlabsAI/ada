// Cross-domain transfer probe. The SAME interval invariant induced from staff-booking
// (half-open overlap + reject unparseable/inverted times), applied to a DIFFERENT
// feature (room reservation) built blind. If it catches failures here, the invariant
// transferred across domains, not just across functions.
//   node reservation-probe.mjs <path-to-reservation.mjs>
import { pathToFileURL } from "node:url";

const target = process.argv[2];
let mod;
try {
  mod = await import(pathToFileURL(target).href);
} catch (e) {
  console.log(JSON.stringify({ arm: target, loadError: String(e), score: 0, total: 0, results: [] }));
  process.exit(0);
}

function attempt(fn) {
  try {
    const r = fn();
    if (r && typeof r === "object" && "ok" in r) return r.ok ? "accepted" : "rejected";
    return "accepted";
  } catch {
    return "rejected";
  }
}

try { mod.reset?.(); } catch {}
try { mod.addRoom?.("room_a"); mod.addRoom?.("room_b"); } catch {}
const R = (o) => () => mod.reserve(o);

const scenarios = [
  { name: "sanity_valid_accepted", axis: "baseline", want: "accepted",
    got: attempt(R({ id: "r1", roomId: "room_a", startsAt: "2026-06-10T14:00:00Z", endsAt: "2026-06-10T16:00:00Z" })) },
  { name: "overlap_rejected", axis: "overlap", want: "rejected",
    got: attempt(R({ id: "r2", roomId: "room_a", startsAt: "2026-06-10T15:00:00Z", endsAt: "2026-06-10T15:30:00Z" })) },
  { name: "touching_accepted", axis: "overlap_not_too_broad", want: "accepted",
    got: attempt(R({ id: "r3", roomId: "room_a", startsAt: "2026-06-10T16:00:00Z", endsAt: "2026-06-10T16:30:00Z" })) },
  { name: "other_room_same_time_accepted", axis: "overlap_not_too_broad", want: "accepted",
    got: attempt(R({ id: "r4", roomId: "room_b", startsAt: "2026-06-10T14:00:00Z", endsAt: "2026-06-10T16:00:00Z" })) },
  { name: "unparseable_start_rejected", axis: "nan_guard", want: "rejected",
    got: attempt(R({ id: "r5", roomId: "room_a", startsAt: "not-a-date", endsAt: "2026-06-10T18:00:00Z" })) },
  { name: "unparseable_end_rejected", axis: "nan_guard", want: "rejected",
    got: attempt(R({ id: "r6", roomId: "room_a", startsAt: "2026-06-10T18:00:00Z", endsAt: "garbage" })) },
  { name: "inverted_interval_rejected", axis: "interval", want: "rejected",
    got: attempt(R({ id: "r7", roomId: "room_a", startsAt: "2026-06-10T20:00:00Z", endsAt: "2026-06-10T19:00:00Z" })) },
];

const results = scenarios.map((s) => ({ ...s, pass: s.want === s.got }));
const guards = results.filter((r) => r.axis !== "baseline");
const score = guards.filter((r) => r.pass).length;
const missed = guards.filter((r) => !r.pass);

console.log(JSON.stringify({
  arm: target.replace(/.*transfer\//, ""),
  score, total: guards.length, sane: results[0].pass,
  missedAxes: [...new Set(missed.map((m) => m.axis))],
  results,
}, null, 2));

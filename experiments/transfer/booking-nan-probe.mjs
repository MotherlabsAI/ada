// Behavioral transfer probe. Induced from the no_double_booking NaN failure.
// Fires malformed/missing-time bookings at an arm's booking.mjs — an axis the
// original A8 grader never tested. If an arm silently ACCEPTS them, the induced
// invariant has caught a latent bug in code it was not written for.
//   node booking-nan-probe.mjs <path-to-booking.mjs>
import { pathToFileURL } from "node:url";

const target = process.argv[2];
let mod;
try {
  mod = await import(pathToFileURL(target).href);
} catch (e) {
  console.log(JSON.stringify({ arm: target, loadError: String(e), transferScore: 0, total: 0, results: [] }));
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
try {
  mod.addStaff?.("staff_amy");
  mod.addClient?.("cl_jo");
  mod.addService?.("sv_long", 120);
} catch {}

const B = (o) => () => mod.book(o);
const base = { staffId: "staff_amy", clientId: "cl_jo", serviceId: "sv_long" };

// All four probes target the induced invariant: malformed/missing time => must NOT be accepted.
const scenarios = [
  { name: "sanity_valid_accepted", want: "accepted",
    got: attempt(B({ id: "n0", ...base, startsAt: "2026-06-10T14:00:00Z", endsAt: "2026-06-10T16:00:00Z" })) },
  { name: "unparseable_start_rejected", want: "rejected",
    got: attempt(B({ id: "n1", ...base, startsAt: "not-a-date", endsAt: "2026-06-10T16:00:00Z" })) },
  { name: "unparseable_end_rejected", want: "rejected",
    got: attempt(B({ id: "n2", ...base, startsAt: "2026-06-10T14:00:00Z", endsAt: "garbage" })) },
  { name: "missing_end_rejected", want: "rejected",
    got: attempt(B({ id: "n3", ...base, startsAt: "2026-06-10T14:00:00Z" })) },
];

const results = scenarios.map((s) => ({ ...s, pass: s.want === s.got }));
// Transfer score = the 3 malformed-time guards (exclude the sanity case).
const guards = results.filter((r) => r.name !== "sanity_valid_accepted");
const transferScore = guards.filter((r) => r.pass).length;

console.log(JSON.stringify({
  arm: target.replace(/.*experiments\//, ""),
  transferScore, total: guards.length,
  sane: results[0].pass,
  results,
}, null, 2));

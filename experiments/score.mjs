// Deterministic grader for the A8 experiment. Judges a booking.mjs by behavior,
// not by reading its source. Scoring is C (pass/fail predicates), not opinion.
//   node score.mjs <path-to-booking.mjs>
import { pathToFileURL } from "node:url";

const target = process.argv[2];
if (!target) {
  console.error("usage: node score.mjs <path-to-booking.mjs>");
  process.exit(2);
}

let mod;
try {
  mod = await import(pathToFileURL(target).href);
} catch (e) {
  console.log(JSON.stringify({ arm: target, loadError: String(e), score: 0, total: 0, results: [] }, null, 2));
  process.exit(0);
}

// An operation "rejected" if it returns {ok:false} or throws; "accepted" otherwise.
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
  mod.addStaff?.("staff_amy"); mod.addStaff?.("staff_lee");
  mod.addClient?.("cl_jo"); mod.addClient?.("cl_max");
  mod.addService?.("sv_long", 120); mod.addService?.("sv_short", 30);
} catch {}

const B = (o) => () => mod.book(o);
const P = (o) => () => mod.capturePayment(o);

const scenarios = [
  { name: "valid_booking_accepted", invariant: "baseline", want: "accepted",
    got: attempt(B({ id: "bk1", staffId: "staff_amy", clientId: "cl_jo", serviceId: "sv_long", startsAt: "2026-06-10T14:00:00Z", endsAt: "2026-06-10T16:00:00Z" })) },
  { name: "overlap_rejected", invariant: "no_double_booking", want: "rejected",
    got: attempt(B({ id: "bk2", staffId: "staff_amy", clientId: "cl_max", serviceId: "sv_short", startsAt: "2026-06-10T15:00:00Z", endsAt: "2026-06-10T15:30:00Z" })) },
  { name: "touching_accepted", invariant: "no_double_booking (not too broad)", want: "accepted",
    got: attempt(B({ id: "bk3", staffId: "staff_amy", clientId: "cl_max", serviceId: "sv_short", startsAt: "2026-06-10T16:00:00Z", endsAt: "2026-06-10T16:30:00Z" })) },
  { name: "other_staff_same_time_accepted", invariant: "no_double_booking (not too broad)", want: "accepted",
    got: attempt(B({ id: "bk4", staffId: "staff_lee", clientId: "cl_jo", serviceId: "sv_long", startsAt: "2026-06-10T14:00:00Z", endsAt: "2026-06-10T16:00:00Z" })) },
  { name: "negative_payment_rejected", invariant: "non_negative_payment", want: "rejected",
    got: attempt(P({ id: "p1", bookingId: "bk1", amountCents: -500, kind: "deposit" })) },
  { name: "missing_staff_rejected", invariant: "booking_well_formed", want: "rejected",
    got: attempt(B({ id: "bk5", staffId: "", clientId: "cl_jo", serviceId: "sv_long", startsAt: "2026-06-10T18:00:00Z", endsAt: "2026-06-10T19:00:00Z" })) },
  { name: "inverted_interval_rejected", invariant: "booking_well_formed", want: "rejected",
    got: attempt(B({ id: "bk6", staffId: "staff_amy", clientId: "cl_jo", serviceId: "sv_long", startsAt: "2026-06-10T20:00:00Z", endsAt: "2026-06-10T19:00:00Z" })) },
];

const results = scenarios.map((s) => ({ ...s, pass: s.want === s.got }));
const score = results.filter((r) => r.pass).length;
// Headline discriminators: the 4 "rejected" invariant scenarios.
const guards = results.filter((r) => r.want === "rejected");
const guardsPassed = guards.filter((r) => r.pass).length;

console.log(JSON.stringify({
  arm: target,
  score, total: results.length,
  guardsPassed, guardsTotal: guards.length,
  results,
}, null, 2));

// Grader for Transfer v2. Contains the FROZEN induced check (single scenario, induced
// from A8 armA-1) and an INDEPENDENT, richer ground-truth battery. Behavior-only.
//   node grade.mjs <path-to-booking.mjs>
// Interface expected (same as A8): reset, addStaff(id), addClient(id), addService(id,min),
//   book({id, clientId, staffId, serviceId, startsAt, endsAt}) -> {ok,error?}, listBookings()
import { pathToFileURL } from "node:url";

const target = process.argv[2];
let mod;
try {
  mod = await import(pathToFileURL(target).href);
} catch (e) {
  console.log(JSON.stringify({ arm: target, loadError: String(e) }));
  process.exit(0);
}

function outcome(fn) {
  try {
    const r = fn();
    if (r && typeof r === "object" && "ok" in r) return r.ok ? "accepted" : "rejected";
    return "accepted";
  } catch {
    return "rejected";
  }
}

function seed() {
  try { mod.reset?.(); } catch {}
  try {
    mod.addStaff?.("s1"); mod.addStaff?.("s2");
    mod.addClient?.("c1"); mod.addClient?.("c2");
    mod.addService?.("v1", 60);
  } catch {}
}

const T = "2026-06-10T";
const W = (h, m) => `${T}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`;
const ANCHOR = { id: "anchor", clientId: "c1", staffId: "s1", serviceId: "v1", startsAt: W(10, 0), endsAt: W(11, 0) };

// Run a scenario from a clean state: place the anchor, then attempt the probe booking.
function scenario(probe) {
  seed();
  const anchor = outcome(() => mod.book({ ...ANCHOR }));
  const test = outcome(() => mod.book({ serviceId: "v1", ...probe }));
  return { anchor, test };
}

// ── FROZEN INDUCED CHECK (from armA-1): same client, different staff, [10:30,11:30] overlap.
const ind = scenario({ id: "ind", clientId: "c1", staffId: "s2", startsAt: W(10, 30), endsAt: W(11, 30) });
const inducedFlags = ind.anchor === "accepted" && ind.test === "accepted";

// ── INDEPENDENT GROUND-TRUTH BATTERY (richer; different overlap shapes + controls)
const GT1_partial = scenario({ id: "g1", clientId: "c1", staffId: "s2", startsAt: W(10, 30), endsAt: W(11, 30) }); // reject
const GT2_contained = scenario({ id: "g2", clientId: "c1", staffId: "s2", startsAt: W(10, 15), endsAt: W(10, 45) }); // reject
const GT3_identical = scenario({ id: "g3", clientId: "c1", staffId: "s2", startsAt: W(10, 0), endsAt: W(11, 0) }); // reject
const C1_diffclient = scenario({ id: "k1", clientId: "c2", staffId: "s2", startsAt: W(10, 30), endsAt: W(11, 30) }); // accept
const C2_touching = scenario({ id: "k2", clientId: "c1", staffId: "s2", startsAt: W(11, 0), endsAt: W(12, 0) }); // accept
const C3_nonoverlap = scenario({ id: "k3", clientId: "c1", staffId: "s2", startsAt: W(13, 0), endsAt: W(14, 0) }); // accept

const anchorOK = GT1_partial.anchor === "accepted";
const gtAccepts = [GT1_partial.test, GT2_contained.test, GT3_identical.test];
const controls = [C1_diffclient.test, C2_touching.test, C3_nonoverlap.test];

const hasFailure = gtAccepts.some((x) => x === "accepted"); // accepted a same-client overlap
const isOverbroad = controls.some((x) => x === "rejected"); // rejected a legitimate booking
const isInsane = !anchorOK || C3_nonoverlap.test === undefined;

let label;
if (isInsane) label = "INSANE";
else if (hasFailure) label = "FAILURE";
else if (isOverbroad) label = "OVERBROAD";
else label = "CORRECT";

console.log(JSON.stringify({
  arm: target.replace(/.*experiments\//, ""),
  label,
  inducedFlags,
  hasFailure,
  detail: {
    gt: { partial: GT1_partial.test, contained: GT2_contained.test, identical: GT3_identical.test },
    controls: { diffClient: C1_diffclient.test, touching: C2_touching.test, nonOverlap: C3_nonoverlap.test },
  },
}, null, 2));

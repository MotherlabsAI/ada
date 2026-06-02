/**
 * C check sources (AXIOM A3: a C check is a runnable pass/fail predicate, no model).
 *
 * These are emitted as standalone zero-dependency ESM (.mjs) into the pack's
 * c/checks/ directory, so the pack is self-contained and runnable by ANY executor
 * (Claude Code included): `node verify.mjs`. Ada's own `ada c run` executes the same
 * emitted files — single source of truth (DECISION D6, AXIOM A5).
 *
 * Hardened after adversarial review (2026-06-02): NaN-masking guards, finite/integer
 * money checks, the refund clause, a spec-aligned "live booking" filter, and an
 * external-dataset path for the verify harness so the A8 claim of checking real data
 * is honest.
 *
 * The embedded .mjs code deliberately uses plain quotes + concatenation (no template
 * literals) so it survives being carried inside these TS strings without escaping.
 */

export interface CheckFile {
  filename: string;
  name: string;
  invariant: string;
  checkClass: string;
  /** L2C lineage: which spec node this check generalizes from. */
  lineage: string;
  source: string;
}

// A booking is "live" unless it has reached a terminal/void state. Keying on a single
// 'active' value would silently skip lead/booked/deposit-paid bookings (spec L2C.004),
// producing a vacuous pass — so we exclude terminal states instead.
const LIVE_FILTER =
  "  const TERMINAL = ['cancelled', 'completed', 'no_show'];\n" +
  "  const live = (data.bookings || []).filter((b) => !TERMINAL.includes(b.status));";

const NO_DOUBLE_BOOKING: CheckFile = {
  filename: "no-double-booking.mjs",
  name: "no_double_booking",
  invariant:
    "No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped.",
  checkClass: "C4",
  lineage:
    "WORKFLOW.005 Booking Flow ; L2C.016 Failure Language -> C Candidate",
  source: [
    'export const name = "no_double_booking";',
    "export const invariant =",
    '  "No live booking may overlap another live booking for the same staff member; bookings with unparseable times are flagged, not skipped.";',
    'export const checkClass = "C4";',
    "",
    "export function run(data) {",
    LIVE_FILTER,
    "  const violations = [];",
    "  for (let i = 0; i < live.length; i++) {",
    "    for (let j = i + 1; j < live.length; j++) {",
    "      const a = live[i];",
    "      const b = live[j];",
    "      if (a.staffId !== b.staffId) continue;",
    "      const aStart = Date.parse(a.startsAt);",
    "      const aEnd = Date.parse(a.endsAt);",
    "      const bStart = Date.parse(b.startsAt);",
    "      const bEnd = Date.parse(b.endsAt);",
    "      // Unparseable data is exactly when a conflict is most likely; never let",
    "      // NaN comparisons (always false) silently report 'no overlap'.",
    "      if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) {",
    "        violations.push({",
    "          kind: 'unparseable_dates',",
    "          staffId: a.staffId,",
    "          bookings: [a.id, b.id],",
    "        });",
    "        continue;",
    "      }",
    "      // Half-open intervals: touching slots (end === start) do NOT overlap.",
    "      if (aStart < bEnd && bStart < aEnd) {",
    "        violations.push({",
    "          kind: 'overlap',",
    "          staffId: a.staffId,",
    "          bookings: [a.id, b.id],",
    "        });",
    "      }",
    "    }",
    "  }",
    "  return { name, pass: violations.length === 0, violations };",
    "}",
    "",
  ].join("\n"),
};

const NON_NEGATIVE_PAYMENT: CheckFile = {
  filename: "non-negative-payment.mjs",
  name: "non_negative_payment",
  invariant:
    "Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount.",
  checkClass: "C5",
  lineage: "DOMAIN.010 Payment ; L2C.007 Money Terms -> Ledger Objects",
  source: [
    'export const name = "non_negative_payment";',
    "export const invariant =",
    "  \"Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount.\";",
    'export const checkClass = "C5";',
    "",
    "export function run(data) {",
    "  const violations = [];",
    "  for (const p of data.payments || []) {",
    "    if (",
    "      typeof p.amountCents !== 'number' ||",
    "      !Number.isFinite(p.amountCents) ||",
    "      !Number.isInteger(p.amountCents) ||",
    "      p.amountCents < 0",
    "    ) {",
    "      violations.push({",
    "        kind: 'invalid_amount',",
    "        payment: p.id,",
    "        amountCents: p.amountCents,",
    "      });",
    "      continue;",
    "    }",
    "    // Enforce the second clause of the invariant, not just the sign.",
    "    if (p.kind === 'refund' && !(p.amountCents > 0)) {",
    "      violations.push({",
    "        kind: 'nonpositive_refund',",
    "        payment: p.id,",
    "        amountCents: p.amountCents,",
    "      });",
    "    }",
    "  }",
    "  return { name, pass: violations.length === 0, violations };",
    "}",
    "",
  ].join("\n"),
};

const BOOKING_WELL_FORMED: CheckFile = {
  filename: "booking-well-formed.mjs",
  name: "booking_well_formed",
  invariant:
    "Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends.",
  checkClass: "C5",
  lineage:
    "DOMAIN.007 Appointment ; L2C.015 Relationship Language -> Foreign Keys",
  source: [
    'export const name = "booking_well_formed";',
    "export const invariant =",
    '  "Every live booking references a staff member, a client, a service, and a parseable start and end, and starts strictly before it ends.";',
    'export const checkClass = "C5";',
    "",
    "export function run(data) {",
    LIVE_FILTER,
    "  const violations = [];",
    "  for (const b of live) {",
    "    const missing = ['staffId', 'clientId', 'serviceId', 'startsAt', 'endsAt'].filter(",
    "      (k) => !b[k],",
    "    );",
    "    if (missing.length) {",
    "      violations.push({ kind: 'missing_refs', booking: b.id, missing });",
    "      continue;",
    "    }",
    "    const s = Date.parse(b.startsAt);",
    "    const e = Date.parse(b.endsAt);",
    "    if (Number.isNaN(s) || Number.isNaN(e)) {",
    "      violations.push({ kind: 'unparseable_interval', booking: b.id });",
    "    } else if (s >= e) {",
    "      violations.push({ kind: 'bad_interval', booking: b.id });",
    "    }",
    "  }",
    "  return { name, pass: violations.length === 0, violations };",
    "}",
    "",
  ].join("\n"),
};

export const CHECK_FILES: CheckFile[] = [
  NO_DOUBLE_BOOKING,
  NON_NEGATIVE_PAYMENT,
  BOOKING_WELL_FORMED,
];

/** Fixtures: a clean dataset (all pass) and one with a planted double-booking. */
export const FIXTURES_SOURCE = [
  "// Sample datasets for the showcase pack.",
  "// `clean` satisfies every invariant. `withDefect` plants the exact failure the",
  "// spec promises Ada will catch: an overlapping booking for the same staff member.",
  "",
  "const staff = [",
  "  { id: 'staff_amy', name: 'Amy' },",
  "  { id: 'staff_lee', name: 'Lee' },",
  "];",
  "const clients = [",
  "  { id: 'cl_jo', name: 'Jo' },",
  "  { id: 'cl_max', name: 'Max' },",
  "  { id: 'cl_sam', name: 'Sam' },",
  "];",
  "const services = [",
  "  { id: 'sv_sleeve', name: 'Sleeve session', minutes: 120 },",
  "  { id: 'sv_touchup', name: 'Touch-up', minutes: 30 },",
  "  { id: 'sv_consult', name: 'Consultation', minutes: 30 },",
  "];",
  "",
  "export const clean = {",
  "  staff,",
  "  clients,",
  "  services,",
  "  bookings: [",
  "    { id: 'bk_1', staffId: 'staff_amy', clientId: 'cl_jo', serviceId: 'sv_sleeve', startsAt: '2026-06-10T14:00:00Z', endsAt: '2026-06-10T16:00:00Z', status: 'active' },",
  "    { id: 'bk_3', staffId: 'staff_lee', clientId: 'cl_sam', serviceId: 'sv_consult', startsAt: '2026-06-10T14:00:00Z', endsAt: '2026-06-10T14:30:00Z', status: 'active' },",
  "  ],",
  "  payments: [",
  "    { id: 'pay_1', bookingId: 'bk_1', amountCents: 15000, kind: 'deposit' },",
  "    { id: 'pay_2', bookingId: 'bk_3', amountCents: 5000, kind: 'deposit' },",
  "  ],",
  "};",
  "",
  "export const withDefect = {",
  "  staff,",
  "  clients,",
  "  services,",
  "  bookings: [",
  "    ...clean.bookings,",
  "    // bk_2 overlaps bk_1 on staff_amy (15:00-15:30 inside 14:00-16:00): a double-booking.",
  "    { id: 'bk_2', staffId: 'staff_amy', clientId: 'cl_max', serviceId: 'sv_touchup', startsAt: '2026-06-10T15:00:00Z', endsAt: '2026-06-10T15:30:00Z', status: 'active' },",
  "  ],",
  "  payments: clean.payments,",
  "};",
  "",
].join("\n");

export const VERIFY_SOURCE = [
  "// Runnable verification harness. Zero dependencies.",
  "//   node verify.mjs                 -> all checks against the clean fixture",
  "//   node verify.mjs --defect        -> against the planted-defect fixture",
  "//   node verify.mjs --data FILE.json-> against YOUR real dataset (the A8 use)",
  "//   add --json for machine-readable output",
  "import { readFileSync } from 'node:fs';",
  "import * as noDoubleBooking from './no-double-booking.mjs';",
  "import * as nonNegativePayment from './non-negative-payment.mjs';",
  "import * as bookingWellFormed from './booking-well-formed.mjs';",
  "import { clean, withDefect } from './fixtures.mjs';",
  "",
  "const checks = [noDoubleBooking, nonNegativePayment, bookingWellFormed];",
  "const useDefect = process.argv.includes('--defect');",
  "",
  "// Resolve the dataset: an external file if --data is given, else a bundled fixture.",
  "const dataArg = process.argv.indexOf('--data');",
  "let data;",
  "let source;",
  "if (dataArg !== -1 && process.argv[dataArg + 1]) {",
  "  const path = process.argv[dataArg + 1];",
  "  data = JSON.parse(readFileSync(path, 'utf8'));",
  "  source = path;",
  "} else {",
  "  data = useDefect ? withDefect : clean;",
  "  source = useDefect ? 'withDefect' : 'clean';",
  "}",
  "",
  "const results = checks.map((c) => {",
  "  const r = c.run(data);",
  "  return { name: r.name, pass: r.pass, violations: r.violations, invariant: c.invariant, checkClass: c.checkClass };",
  "});",
  "const passed = results.filter((r) => r.pass).length;",
  "const report = {",
  "  fixture: source,",
  "  total: results.length,",
  "  passed,",
  "  failed: results.length - passed,",
  "  results,",
  "};",
  "",
  "if (process.argv.includes('--json')) {",
  "  process.stdout.write(JSON.stringify(report, null, 2) + '\\n');",
  "} else {",
  "  for (const r of results) {",
  "    console.log((r.pass ? 'PASS' : 'FAIL') + '  [' + r.checkClass + '] ' + r.name);",
  "    if (!r.pass) for (const v of r.violations) console.log('    -> ' + JSON.stringify(v));",
  "  }",
  "  console.log('');",
  "  console.log(report.passed + '/' + report.total + ' passed (' + report.fixture + ')');",
  "}",
  "process.exit(report.failed > 0 ? 1 : 0);",
  "",
].join("\n");

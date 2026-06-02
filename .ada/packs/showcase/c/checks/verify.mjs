// Runnable verification harness. Zero dependencies.
//   node verify.mjs                 -> all checks against the clean fixture
//   node verify.mjs --defect        -> against the planted-defect fixture
//   node verify.mjs --data FILE.json-> against YOUR real dataset (the A8 use)
//   add --json for machine-readable output
import { readFileSync } from 'node:fs';
import * as noDoubleBooking from './no-double-booking.mjs';
import * as nonNegativePayment from './non-negative-payment.mjs';
import * as bookingWellFormed from './booking-well-formed.mjs';
import { clean, withDefect } from './fixtures.mjs';

const checks = [noDoubleBooking, nonNegativePayment, bookingWellFormed];
const useDefect = process.argv.includes('--defect');

// Resolve the dataset: an external file if --data is given, else a bundled fixture.
const dataArg = process.argv.indexOf('--data');
let data;
let source;
if (dataArg !== -1 && process.argv[dataArg + 1]) {
  const path = process.argv[dataArg + 1];
  data = JSON.parse(readFileSync(path, 'utf8'));
  source = path;
} else {
  data = useDefect ? withDefect : clean;
  source = useDefect ? 'withDefect' : 'clean';
}

const results = checks.map((c) => {
  const r = c.run(data);
  return { name: r.name, pass: r.pass, violations: r.violations, invariant: c.invariant, checkClass: c.checkClass };
});
const passed = results.filter((r) => r.pass).length;
const report = {
  fixture: source,
  total: results.length,
  passed,
  failed: results.length - passed,
  results,
};

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  for (const r of results) {
    console.log((r.pass ? 'PASS' : 'FAIL') + '  [' + r.checkClass + '] ' + r.name);
    if (!r.pass) for (const v of r.violations) console.log('    -> ' + JSON.stringify(v));
  }
  console.log('');
  console.log(report.passed + '/' + report.total + ' passed (' + report.fixture + ')');
}
process.exit(report.failed > 0 ? 1 : 0);

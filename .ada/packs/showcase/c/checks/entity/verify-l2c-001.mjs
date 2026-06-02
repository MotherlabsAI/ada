// Runnable verifier for L2C.001 — Nouns -> Entities.
//   node verify-l2c-001.mjs           clean data (expect all pass)
//   node verify-l2c-001.mjs --defect  planted defects (expect all 3 FAIL)
//   add --json for machine output
import * as ndb from './no-duplicate-entity-names.mjs';
import * as ped from './primary-entities-have-definitions.mjs';
import * as anp from './ambiguous-nouns-preserved.mjs';
import { clean, withDefect } from './fixtures.mjs';

const checks = [ndb, ped, anp];
const useDefect = process.argv.includes('--defect');
const data = useDefect ? withDefect : clean;
const results = checks.map((c) => c.run(data));
const passed = results.filter((r) => r.pass).length;
const report = { fixture: useDefect ? 'withDefect' : 'clean', total: results.length, passed, failed: results.length - passed, results };

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  for (const r of results) {
    console.log((r.pass ? 'PASS' : 'FAIL') + '  ' + r.name);
    if (!r.pass) for (const v of r.violations) console.log('    -> ' + JSON.stringify(v));
  }
  console.log('');
  console.log(report.passed + '/' + report.total + ' passed (' + report.fixture + ')');
}
process.exit(report.failed > 0 ? 1 : 0);

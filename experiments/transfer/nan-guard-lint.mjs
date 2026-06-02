// Static transfer lint. Induced from the same failure as a code-pattern rule:
// "a file that feeds Date.parse(...) into an ordering comparison must contain a
//  NaN guard (Number.isNaN / isNaN), or it is a latent NaN-mask."
// Heuristic (file-scoped, not full AST) — reported as such.
//   node nan-guard-lint.mjs <file...>
import { readFileSync } from "node:fs";

const files = process.argv.slice(2);
const findings = [];

for (const f of files) {
  let src;
  try { src = readFileSync(f, "utf8"); } catch { continue; }
  const usesParseInCompare =
    /Date\.parse\s*\([^)]*\)\s*(?:<|>|<=|>=)/.test(src) ||
    // also catch the common "const x = Date.parse(...)" then "x < y" idiom
    (/Date\.parse\s*\(/.test(src) && /\b(?:Start|End|start|end|s|e)\s*(?:<|>|<=|>=)/.test(src));
  const hasGuard = /Number\.isNaN|isNaN\s*\(/.test(src);
  if (usesParseInCompare && !hasGuard) {
    findings.push({ file: f.replace(/.*ada-context\//, ""), kind: "unguarded_date_parse_comparison" });
  }
}

console.log(JSON.stringify({ scanned: files.length, flagged: findings.length, findings }, null, 2));
process.exit(findings.length > 0 ? 1 : 0);

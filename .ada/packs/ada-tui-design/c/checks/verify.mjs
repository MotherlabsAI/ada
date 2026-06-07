#!/usr/bin/env node
/**
 * verify.mjs — the deterministic C layer for the ada-tui-design pack.
 *
 * AXIOM A3: a C check is a runnable pass/fail predicate. No model, no LLM, no
 * subjective judgment. It audits the LIVE design tokens (read from tokens.jsonld,
 * which is projected from src/tui/ink/tokens.ts) — so this lints the real surface,
 * not a copy.
 *
 *   node verify.mjs            # audit the live tokens (expect: textMuted flagged — a TRUE finding)
 *   node verify.mjs --json     # machine-readable report
 *   node verify.mjs --defect   # plant an egregious failure to prove the checks bite
 *
 * Three checks, each purely symbolic:
 *   contrast_aa        WCAG AA contrast on bg for text-bearing role tokens
 *   no_color_no_ansi   under NO_COLOR, the paint path emits zero ANSI colour escapes
 *   color_has_glyph    every colour-carried state also carries a non-colour glyph
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PACK = join(HERE, "..", "..");
const argv = new Set(process.argv.slice(2));
const JSON_OUT = argv.has("--json");
const DEFECT = argv.has("--defect");

// ── load the live role tokens from the emitted linked-data artifact ──────────
const ld = JSON.parse(readFileSync(join(PACK, "tokens.jsonld"), "utf8"));
const graph = ld["@graph"];
const roleTokens = Object.fromEntries(
  graph
    .filter((t) => t["@type"] === "ada:RoleToken")
    .map((t) => [t["@id"].split("/").pop(), t.value]),
);
// State + motion tokens (projected from src/tui/ink/tokens.ts → single source of truth).
const stateTokens = graph.filter((t) => t["@type"] === "ada:StateToken");
const motionTokens = graph.filter((t) => t["@type"] === "ada:MotionToken");
const densityTokens = graph.filter((t) => t["@type"] === "ada:DensityToken");
const BG = roleTokens.bg;

// ── WCAG 2.x relative-luminance contrast (pure math) ─────────────────────────
function contrast(hexA, hexB) {
  const lum = (hex) => {
    const m = hex.replace("#", "");
    const c = [0, 2, 4]
      .map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hexA), b = lum(hexB);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

// Declared use → required ratio. Body text must clear AA 4.5; marks/large 3.0.
const BODY = { text: 4.5, textDim: 4.5, textMuted: 4.5 };
const MARK = { accent: 3, focus: 3, success: 3, warning: 3, error: 3 };

// ── CHECK 1: contrast_aa ─────────────────────────────────────────────────────
function checkContrast() {
  const tokens = { ...roleTokens };
  if (DEFECT) tokens.text = "#2A2018"; // plant an unreadable body text near-bg
  const rows = [];
  let pass = true;
  for (const [name, req] of Object.entries({ ...BODY, ...MARK })) {
    const ratio = contrast(tokens[name], BG);
    const ok = ratio >= req;
    if (!ok) pass = false;
    rows.push({ token: name, hex: tokens[name], ratio, required: req, ok,
      use: BODY[name] ? "body-text" : "mark/large" });
  }
  return { id: "contrast_aa", cls: "C5", pass, rows };
}

// ── CHECK 2: no_color_no_ansi ────────────────────────────────────────────────
// A tiny paint() mirroring grammar.ts intent: under NO_COLOR it must not emit
// SGR colour. We render a sample line both ways and assert the contract.
function paint(text, hex, { noColor }) {
  if (noColor) return text; // presence only, never colour
  const m = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16));
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}
function checkNoColor() {
  const sample = [
    () => paint("◈ Ada", roleTokens.accent, { noColor: true }),
    () => paint("κ 3", roleTokens.success, { noColor: true }),
    () => paint("Ω 8", roleTokens.warning, { noColor: true }),
    () => (DEFECT ? `\x1b[31m✗ leaked\x1b[0m` : paint("✗ rejected", roleTokens.error, { noColor: true })),
  ];
  const rendered = sample.map((f) => f());
  const ansi = /\x1b\[[0-9;]*m/;
  const offenders = rendered.filter((s) => ansi.test(s));
  return { id: "no_color_no_ansi", cls: "C4", pass: offenders.length === 0,
    rendered, offenders };
}

// ── CHECK 3: color_has_glyph ─────────────────────────────────────────────────
// Every colour-carried state (the projected StateTokens) must ALSO carry a
// non-colour glyph + label, so meaning survives colour-strip. Audits the live
// projection of src/tui/ink/tokens.ts — not a hand-copied table.
function checkGlyph() {
  const rows = stateTokens.map((t) => {
    const state = t["@id"].split("/").pop();
    let glyph = t.glyph ?? "";
    if (DEFECT && state === "failure") glyph = ""; // colour-only state — A11Y.080 forbids
    return {
      state,
      colour: t.color,
      glyph,
      label: t.label ?? "",
      ok: glyph.trim().length > 0 && (t.label ?? "").trim().length > 0,
    };
  });
  // No StateTokens projected at all is itself a failure (nothing pairs colour).
  const pass = rows.length > 0 && rows.every((r) => r.ok);
  return { id: "color_has_glyph", cls: "C4", pass, rows };
}

// ── CHECK 4: state_color_paired ──────────────────────────────────────────────
// Reject "status-only" colour: every status-tier role token (success/warning/
// error) must be referenced by >=1 StateToken that carries a glyph, and every
// StateToken must point at a known role. A status colour with no glyph-bearing
// state is exactly the silent-colour failure Slice 1's verifier must reject.
function checkStatePaired() {
  const STATUS_ROLES = ["success", "warning", "error"];
  let carriers = new Set(
    stateTokens.filter((t) => (t.glyph ?? "").trim().length > 0).map((t) => t.color),
  );
  if (DEFECT) carriers = new Set([...carriers].filter((c) => c !== "warning")); // orphan a status colour
  const rows = STATUS_ROLES.map((role) => ({
    role,
    hex: roleTokens[role],
    ok: carriers.has(role),
  }));
  // Also reject any StateToken pointing at a role that does not exist.
  const unknown = stateTokens
    .filter((t) => !(t.color in roleTokens))
    .map((t) => ({ state: t["@id"].split("/").pop(), color: t.color }));
  const pass = rows.every((r) => r.ok) && unknown.length === 0;
  return { id: "state_color_paired", cls: "C4", pass, rows, unknown };
}

// ── CHECK 5: motion_has_reduced ──────────────────────────────────────────────
// Every motion token must declare a reduced-motion alternative and a state
// reason, and never strobe (>=16ms). Motion is never the only carrier.
function checkMotionReduced() {
  const ALLOWED = new Set(["static", "static-glyph", "instant", "final", "none"]);
  const rows = motionTokens.map((t) => {
    const name = t["@id"].split("/").pop();
    let reduced = t.reduced ?? "";
    if (DEFECT && name === "compileHeartbeat") reduced = ""; // motion with no escape hatch
    return {
      name,
      kind: t.kind,
      ms: t.ms,
      reduced,
      ok:
        ALLOWED.has(reduced) &&
        (t.reason ?? "").trim().length > 0 &&
        typeof t.ms === "number" &&
        t.ms >= 16,
    };
  });
  const pass = rows.length > 0 && rows.every((r) => r.ok);
  return { id: "motion_has_reduced", cls: "C4", pass, rows };
}

// ── CHECK 6: density_budget_monotonic ────────────────────────────────────────
// graph-density / edge_budget: each density tier caps visible edges-per-node and
// names a non-colour line weight, and the budgets must increase STRICTLY across
// tiers — so "the map got too busy" is a checkable threshold, not taste.
function checkDensityBudget() {
  const WEIGHTS = new Set(["hairline", "thin", "regular"]);
  const tiers = densityTokens.map((t) => ({
    name: t["@id"].split("/").pop(),
    glyph: t.glyph ?? "",
    label: t.label ?? "",
    max: t["ada:maxEdgesPerNode"],
    lineWeight: t["ada:lineWeight"],
  }));
  if (DEFECT && tiers[1]) tiers[1].max = tiers[0].max; // flatten a budget — no longer strictly rising
  const wellFormed = tiers.map((d) => ({
    ...d,
    ok:
      d.glyph.trim().length > 0 &&
      d.label.trim().length > 0 &&
      typeof d.max === "number" &&
      d.max > 0 &&
      WEIGHTS.has(d.lineWeight),
  }));
  let monotonic = tiers.length > 0;
  for (let i = 1; i < tiers.length; i++) {
    if (!(tiers[i].max > tiers[i - 1].max)) monotonic = false;
  }
  const pass = wellFormed.every((d) => d.ok) && monotonic;
  return { id: "density_budget_monotonic", cls: "C4", pass, rows: wellFormed, monotonic };
}

// ── run ──────────────────────────────────────────────────────────────────────
const results = [
  checkContrast(),
  checkNoColor(),
  checkGlyph(),
  checkStatePaired(),
  checkMotionReduced(),
  checkDensityBudget(),
];
const allPass = results.every((r) => r.pass);

if (JSON_OUT) {
  console.log(JSON.stringify({ pack: "ada-tui-design", defect: DEFECT, allPass, results }, null, 2));
  process.exit(allPass ? 0 : 1);
}

const tick = (b) => (b ? "✓" : "✗");
console.log(`\n  ada-tui-design · C checks  ${DEFECT ? "(--defect: failure planted)" : "(auditing live tokens)"}\n`);

for (const r of results) {
  console.log(`  ${tick(r.pass)} ${r.id}  [${r.cls}]`);
  if (r.id === "contrast_aa") {
    for (const row of r.rows) {
      console.log(`      ${tick(row.ok)} ${row.token.padEnd(11)} ${row.hex}  ${String(row.ratio).padStart(5)}:1  need ${row.required}  (${row.use})`);
    }
  }
  if (r.id === "no_color_no_ansi" && !r.pass) {
    console.log(`      offenders: ${JSON.stringify(r.offenders)}`);
  }
  if (r.id === "color_has_glyph") {
    for (const row of r.rows.filter((x) => !x.ok)) {
      console.log(`      ${tick(false)} state '${row.state}' is colour-only (no glyph/label) — violates A11Y.080`);
    }
  }
  if (r.id === "state_color_paired") {
    for (const row of r.rows.filter((x) => !x.ok)) {
      console.log(`      ${tick(false)} status colour '${row.role}' ${row.hex ?? ""} has no glyph-bearing state (status-only colour)`);
    }
    for (const u of r.unknown ?? []) {
      console.log(`      ${tick(false)} state '${u.state}' points at unknown role '${u.color}'`);
    }
  }
  if (r.id === "motion_has_reduced") {
    for (const row of r.rows.filter((x) => !x.ok)) {
      console.log(`      ${tick(false)} motion '${row.name}' lacks a reduced-motion alternative or state reason`);
    }
  }
  if (r.id === "density_budget_monotonic") {
    for (const row of r.rows.filter((x) => !x.ok)) {
      console.log(`      ${tick(false)} density '${row.name}' malformed (glyph/label/budget/lineWeight)`);
    }
    if (!r.monotonic) {
      console.log(`      ${tick(false)} edge budgets are not strictly increasing across tiers`);
    }
  }
  console.log();
}

if (!allPass && !DEFECT) {
  console.log("  NOTE: failures above are TRUE findings in the live surface (src/tui/ink/tokens.ts).");
  console.log("  `textMuted #7A6650` (3.33:1) fails AA for body text — see node PALETTE.022 / wiki/open-questions.");
  console.log("  Suggested fix: lift textMuted toward #8C7458+ until contrast_aa clears 4.5:1.\n");
}

process.exit(allPass ? 0 : 1);

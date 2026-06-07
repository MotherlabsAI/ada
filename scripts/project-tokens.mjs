#!/usr/bin/env node
/**
 * project-tokens.mjs — projects the live token contract (src/tui/ink/tokens.ts,
 * compiled to dist/) into the ada-tui-design pack's tokens.jsonld.
 *
 * WHY: the pack's C layer (c/checks/verify.mjs) audits tokens.jsonld. If that
 * artifact is hand-maintained it drifts from the real tokens — exactly the
 * "map drifts away from compiler law" failure Slice 1 exists to prevent. So the
 * jsonld is a PROJECTION, never authored: edit tokens.ts, run `pnpm build`, and
 * the linked-data artifact (and therefore the checks) follow automatically.
 *
 * Single source of truth = src/tui/ink/tokens.ts. Run after tsc (it imports the
 * compiled dist modules). Wired into `pnpm build`.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  tokens,
  stateTokens,
  confidenceTokens,
  recencyTokens,
  activityTokens,
  densityTokens,
  motionTokens,
} from "../dist/tui/ink/tokens.js";
import { COLOUR_HEX } from "../dist/core/grammar.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", ".ada", "packs", "ada-tui-design", "tokens.jsonld");
const BG = tokens.bg;

// ── WCAG 2.x relative-luminance contrast (pure math, matches verify.mjs) ──────
function contrast(hexA, hexB) {
  const lum = (hex) => {
    const m = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4]
      .map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(hexA), b = lum(hexB);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

// ── editorial annotations (tier + human role text) — documentation only ──────
const ROLE_META = {
  bg: ["base", "60% — the calm warm-dark field the eye rests on"],
  surface: ["base", "60% — raised field for panels/cards"],
  surfaceAlt: ["base", "60% — secondary raised field"],
  text: ["structure", "30% — primary body text"],
  textDim: ["structure", "30% — secondary text"],
  textMuted: ["structure", "30% — metadata, ids, dim lines"],
  border: ["structure", "30% — hairlines, the one rounded frame"],
  accent: ["accent", "10% — amber: the one thing that pops"],
  accentBright: ["accent", "10% — amber hover/move flash"],
  focus: ["accent", "10% — clay: the focused/cursor mark"],
  selection: ["accent", "10% — selected-row background tint"],
  success: ["status", "checks pass / candidates (κ)"],
  warning: ["status", "unknowns / residue (Ω)"],
  error: ["status", "failure-if-missing"],
};
const PIGMENT_META = {
  terracotta: "brand identity / active area",
  plum: "secondary identity (mascot, compile heartbeat)",
  clay: "warm area hue",
  amber: "warm area hue / warning",
  sage: "cool-neutral area hue",
  green: "check ok",
  cyan: "followable edge / link",
  slate: "compiles-to / structural (AA-fixed)",
  deep_blue: "area hue (AA-large fixed)",
  rose: "failure",
};
// roles used as TEXT clear AA at 4.5; mark/large roles need 3.0.
const TEXT_ROLES = new Set(["text", "textDim", "textMuted"]);

// ── build the @graph ─────────────────────────────────────────────────────────
const roleNodes = Object.entries(tokens).map(([name, value]) => {
  const [tier, role] = ROLE_META[name] ?? ["custom", ""];
  const ratio = contrast(value, BG);
  const node = {
    "@id": `ada:token/role/${name}`,
    "@type": "ada:RoleToken",
    value,
    tier,
    role,
  };
  // contrast is only meaningful for foreground roles, not the base fields.
  if (tier !== "base" && name !== "selection" && name !== "border") {
    node.contrastOnBg = ratio;
    node["ada:wcagAA"] = ratio >= (TEXT_ROLES.has(name) ? 4.5 : 3);
  }
  return node;
});

const pigmentNodes = Object.entries(PIGMENT_META)
  .filter(([name]) => name in COLOUR_HEX)
  .map(([name, role]) => ({
    "@id": `ada:token/pigment/${name}`,
    "@type": "ada:PigmentToken",
    value: COLOUR_HEX[name],
    role,
  }));

// All four state-shaped groups project to ada:StateToken so the same verifier
// loop (color_has_glyph / state_color_paired) audits the colour↔non-colour
// pairing for every semantic dimension — none is an un-audited surface.
const STATE_GROUPS = {
  state: stateTokens,
  confidence: confidenceTokens,
  recency: recencyTokens,
  activity: activityTokens,
};
const stateNodes = Object.entries(STATE_GROUPS).flatMap(([group, table]) =>
  Object.entries(table).map(([name, s]) => ({
    "@id": `ada:token/${group}/${name}`,
    "@type": "ada:StateToken",
    "ada:group": group,
    glyph: s.glyph,
    label: s.label,
    color: s.color,
    weight: s.weight,
  })),
);

const densityNodes = Object.entries(densityTokens).map(([name, d]) => ({
  "@id": `ada:token/density/${name}`,
  "@type": "ada:DensityToken",
  glyph: d.glyph,
  label: d.label,
  "ada:maxEdgesPerNode": d.maxEdgesPerNode,
  "ada:lineWeight": d.lineWeight,
}));

const motionNodes = Object.entries(motionTokens).map(([name, m]) => ({
  "@id": `ada:token/motion/${name}`,
  "@type": "ada:MotionToken",
  kind: m.kind,
  ms: m.ms,
  reduced: m.reduced,
  reason: m.reason,
}));

const doc = {
  "@context": {
    "@vocab": "https://motherlabs.dev/ns/ada-design#",
    dtcg: "https://www.w3.org/community/design-tokens/#",
    id: "@id",
    type: "@type",
    value: "ada:value",
    role: "ada:role",
    tier: "ada:tier",
    contrastOnBg: "ada:contrastOnBg",
    glyph: "ada:glyph",
    label: "ada:label",
    color: "ada:color",
    weight: "ada:weight",
    group: "ada:group",
    kind: "ada:kind",
    ms: "ada:ms",
    reduced: "ada:reduced",
    reason: "ada:reason",
  },
  "ada:provenance":
    "PROJECTED from src/tui/ink/tokens.ts by scripts/project-tokens.mjs — do not hand-edit; run `pnpm build`.",
  "@graph": [
    ...roleNodes,
    ...pigmentNodes,
    ...stateNodes,
    ...densityNodes,
    ...motionNodes,
  ],
};

writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");
console.log(
  `project-tokens: ${roleNodes.length} role · ${pigmentNodes.length} pigment · ${stateNodes.length} state · ${densityNodes.length} density · ${motionNodes.length} motion → ${OUT}`,
);

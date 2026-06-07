import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tokens,
  TOKEN_FALLBACK_16,
  stateTokens,
  motionTokens,
  confidenceTokens,
  recencyTokens,
  activityTokens,
  densityTokens,
  type TokenRole,
  type StateToken,
} from "./tokens.js";

/** WCAG 2.x relative-luminance contrast ratio between two #rrggbb hexes. */
function wcagContrast(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const m = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4]
      .map((i) => parseInt(m.slice(i, i + 2), 16) / 255)
      .map((v) =>
        v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
      );
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const a = lum(hexA);
  const b = lum(hexB);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Red-channel dominance (or grey) = warm/earth. A cool/blue role would have b > r. */
function isWarmOrNeutral(hex: string): boolean {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Warm: red is the strongest (or tied) channel. Allow near-grey (small spread).
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return r >= b || spread <= 18;
}

test("every token is a 6-digit hex", () => {
  for (const [role, hex] of Object.entries(tokens)) {
    assert.match(hex, /^#[0-9a-fA-F]{6}$/, `${role} must be #rrggbb`);
  }
});

test("all token roles are warm/earth — no cool/blue accent", () => {
  for (const [role, hex] of Object.entries(tokens)) {
    // error is a warm-rose; success is a muted green that is allowed as status.
    if (role === "success") continue;
    assert.ok(
      isWarmOrNeutral(hex),
      `${role} (${hex}) must be warm/earth (blue is forbidden)`,
    );
  }
});

test("the 60/30/10 roles all exist", () => {
  const base: TokenRole[] = ["bg", "surface", "surfaceAlt"];
  const structure: TokenRole[] = ["text", "textDim", "textMuted", "border"];
  const accent: TokenRole[] = ["accent", "accentBright", "focus", "selection"];
  const status: TokenRole[] = ["success", "warning", "error"];
  for (const r of [...base, ...structure, ...accent, ...status]) {
    assert.ok(r in tokens, `missing role ${r}`);
  }
});

test("base roles are dark and text roles are light (legible contrast)", () => {
  const lum = (hex: string) => {
    const m = hex.replace("#", "");
    return (
      0.3 * parseInt(m.slice(0, 2), 16) +
      0.59 * parseInt(m.slice(2, 4), 16) +
      0.11 * parseInt(m.slice(4, 6), 16)
    );
  };
  assert.ok(lum(tokens.bg) < 60, "bg should be a dark field");
  assert.ok(lum(tokens.text) > 160, "text should be light");
  assert.ok(
    lum(tokens.text) - lum(tokens.bg) > 100,
    "text must sit clearly above the base",
  );
});

test("every role has a 16-colour fallback", () => {
  for (const role of Object.keys(tokens) as TokenRole[]) {
    assert.ok(TOKEN_FALLBACK_16[role], `no fallback for ${role}`);
  }
});

test("every state token pairs a colour role with a non-colour carrier", () => {
  // Color is never load-bearing: each semantic state must ALSO carry a glyph and
  // a label, and point at a real role token. Guards A11Y.080 / color_has_glyph.
  for (const [name, s] of Object.entries(stateTokens)) {
    assert.ok(s.glyph.trim().length > 0, `state '${name}' has no glyph`);
    assert.ok(s.label.trim().length > 0, `state '${name}' has no label`);
    assert.ok(
      s.color in tokens,
      `state '${name}' colour '${s.color}' is not a role token`,
    );
    assert.ok(
      ["normal", "bold", "dim"].includes(s.weight),
      `state '${name}' weight '${s.weight}' invalid`,
    );
  }
});

test("no status colour is status-only — each is carried by a glyph state", () => {
  // The verifier rejects "status-only" colours. Enforce it at the contract:
  // every status-tier role (success/warning/error) is referenced by >=1 state
  // token that carries a glyph, so the state survives colour-strip.
  const statusRoles: TokenRole[] = ["success", "warning", "error"];
  const carried = new Set<TokenRole>(
    Object.values(stateTokens).map((s) => s.color),
  );
  for (const role of statusRoles) {
    assert.ok(
      carried.has(role),
      `status colour '${role}' has no glyph-bearing state`,
    );
  }
});

test("every motion token declares a reduced-motion alternative", () => {
  // Slice 1 acceptance: motion tokens include reduced-motion alternatives.
  const allowed = ["static", "static-glyph", "instant", "final", "none"];
  for (const [name, m] of Object.entries(motionTokens)) {
    assert.ok(
      allowed.includes(m.reduced),
      `motion '${name}' reduced '${m.reduced}' not in ${allowed.join("/")}`,
    );
  }
});

test("every motion has a state reason and a calm cadence (>=16ms)", () => {
  // every_motion_has_a_state_reason; calm_motion: never sub-16ms strobing.
  for (const [name, m] of Object.entries(motionTokens)) {
    assert.ok(
      m.reason.trim().length > 0,
      `motion '${name}' has no state reason`,
    );
    assert.ok(
      m.ms >= 16,
      `motion '${name}' cadence ${m.ms}ms is too fast (strobe)`,
    );
  }
});

test("every semantic-state group pairs colour with a non-colour carrier", () => {
  // The spine rule across ALL StateToken groups (state/confidence/recency/activity):
  // colour is never load-bearing — each entry must carry a glyph, a label, a real
  // role colour, and a luminance weight, so the dimension survives colour-strip.
  const groups: Record<string, Record<string, StateToken>> = {
    confidence: confidenceTokens,
    recency: recencyTokens,
    activity: activityTokens,
  };
  for (const [group, table] of Object.entries(groups)) {
    for (const [name, s] of Object.entries(table)) {
      assert.ok(s.glyph.trim().length > 0, `${group}.${name} has no glyph`);
      assert.ok(s.label.trim().length > 0, `${group}.${name} has no label`);
      assert.ok(
        s.color in tokens,
        `${group}.${name} colour '${s.color}' is not a role token`,
      );
      assert.ok(
        ["normal", "bold", "dim"].includes(s.weight),
        `${group}.${name} weight '${s.weight}' invalid`,
      );
    }
  }
});

test("confidence is a glyph ramp, not colour-only", () => {
  // The level must be recoverable from the glyph alone (distinct glyphs per level),
  // so NO_COLOR readers still see certain vs probable vs tentative.
  const glyphs = Object.values(confidenceTokens).map((c) => c.glyph);
  assert.equal(
    new Set(glyphs).size,
    glyphs.length,
    "confidence glyphs must be distinct so the ramp survives colour-strip",
  );
});

test("density tiers are a monotonic edge budget with non-colour carriers", () => {
  // graph-density / edge_budget: each tier caps edges-per-node and names a line
  // weight (the non-colour carrier). Budgets must increase strictly across tiers
  // so "too busy" is a checkable threshold, not taste.
  const allowedWeights = ["hairline", "thin", "regular"];
  const tiers = Object.values(densityTokens);
  for (const [name, d] of Object.entries(densityTokens)) {
    assert.ok(d.glyph.trim().length > 0, `density '${name}' has no glyph`);
    assert.ok(d.label.trim().length > 0, `density '${name}' has no label`);
    assert.ok(
      d.maxEdgesPerNode > 0,
      `density '${name}' edge budget must be positive`,
    );
    assert.ok(
      allowedWeights.includes(d.lineWeight),
      `density '${name}' lineWeight '${d.lineWeight}' invalid`,
    );
  }
  for (let i = 1; i < tiers.length; i++) {
    assert.ok(
      tiers[i]!.maxEdgesPerNode > tiers[i - 1]!.maxEdgesPerNode,
      "density edge budgets must increase strictly across tiers",
    );
  }
});

test("text-bearing roles meet WCAG AA (4.5:1) on bg", () => {
  // textMuted carries "metadata, ids, dim lines" — it is TEXT, so it must clear
  // the 4.5:1 body floor, not just the 3:1 large/mark floor. Guards PALETTE.022.
  for (const role of ["text", "textDim", "textMuted"] as TokenRole[]) {
    const ratio = wcagContrast(tokens[role], tokens.bg);
    assert.ok(
      ratio >= 4.5,
      `${role} (${tokens[role]}) = ${ratio.toFixed(2)}:1, below AA 4.5 for body text`,
    );
  }
});

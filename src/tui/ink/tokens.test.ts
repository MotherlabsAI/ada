import { test } from "node:test";
import assert from "node:assert/strict";
import { tokens, TOKEN_FALLBACK_16, type TokenRole } from "./tokens.js";

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

/**
 * ASCII identity for the Ada shell — wordmark + mascot. Kept as data so it's trivial to
 * swap/iterate. Wordmark: the chosen "gradient-tall" ADA (block letters), rendered with a
 * top→bottom terracotta→plum ramp by the Welcome screen.
 */

/** The block "ADA" (6 rows). The Welcome screen colours these with a vertical gradient. */
export const WORDMARK: string[] = [
  " █████╗   ██████╗   █████╗ ",
  "██╔══██╗  ██╔══██╗ ██╔══██╗",
  "███████║  ██║  ██║ ███████║",
  "██╔══██║  ██║  ██║ ██╔══██║",
  "██║  ██║  ██████╔╝ ██║  ██║",
  "╚═╝  ╚═╝  ╚═════╝  ╚═╝  ╚═╝",
];

/** The "context" tag that sits below the wordmark. */
export const WORDMARK_TAG = "              c o n t e x t";

/** Compact wordmark for narrow terminals. */
export const WORDMARK_NARROW: string[] = [
  "█▀█ █▀▄ █▀█",
  "█▀█ █▄▀ █▀█",
  "··· context",
];

/** N hex colours ramping linearly from `from` to `to` — for the vertical gradient. */
export function gradient(n: number, from: string, to: string): string[] {
  const rgb = (h: string) => {
    const m = h.replace("#", "");
    return [
      parseInt(m.slice(0, 2), 16),
      parseInt(m.slice(2, 4), 16),
      parseInt(m.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = rgb(from);
  const [r2, g2, b2] = rgb(to);
  const hx = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0 : i / (n - 1);
    return `#${hx(r1! + (r2! - r1!) * t)}${hx(g1! + (g2! - g1!) * t)}${hx(b1! + (b2! - b1!) * t)}`;
  });
}

/**
 * Rotating-star ambient glyph — a Claude-style cycle. The Welcome screen steps
 * through these ~1/180ms in the accent colour: a small, calm motion near the
 * banner that says "alive" without strobing.
 */
export const STAR_FRAMES = ["✶", "✷", "✸", "✹", "✺"] as const;

/** The star glyph for animation step `step` (wraps). */
export function starFrame(step: number): string {
  const n = STAR_FRAMES.length;
  return STAR_FRAMES[((step % n) + n) % n]!;
}

/**
 * The banner's animated earth gradient. The wordmark's vertical ramp slowly
 * SHIFTS its endpoints through terracotta → clay → amber and back, so the block
 * ADA breathes warm colour over time (≈1 step/250ms from the Welcome screen).
 *
 * `step` drives a triangle wave 0→1→0 over `period` steps; at phase `t` the ramp
 * runs from a warm anchor to the blended pigment, giving a calm there-and-back
 * cycle that never leaves the terracotta family. Pure: same step → same colours.
 */
export function bannerGradient(
  rows: number,
  step: number,
  pigments: { terracotta: string; clay: string; amber: string },
  period = 24,
): string[] {
  const lerpHex = (from: string, to: string, t: number) => {
    const rgb = (h: string) => {
      const m = h.replace("#", "");
      return [
        parseInt(m.slice(0, 2), 16),
        parseInt(m.slice(2, 4), 16),
        parseInt(m.slice(4, 6), 16),
      ] as const;
    };
    const [r1, g1, b1] = rgb(from);
    const [r2, g2, b2] = rgb(to);
    const hx = (v: number) => Math.round(v).toString(16).padStart(2, "0");
    return `#${hx(r1 + (r2 - r1) * t)}${hx(g1 + (g2 - g1) * t)}${hx(b1 + (b2 - b1) * t)}`;
  };
  // Triangle wave 0→1→0 over `period` steps: calm there-and-back, no jump.
  const half = period / 2;
  const pos = ((step % period) + period) % period;
  const t = pos <= half ? pos / half : (period - pos) / half;
  // Bottom anchor walks terracotta → clay → amber → clay → terracotta.
  const top = lerpHex(pigments.terracotta, pigments.amber, t);
  const bot = lerpHex(pigments.clay, pigments.amber, 1 - t * 0.5);
  return gradient(rows, top, bot);
}

/** Candidate mascots (small). Pick one; easy to replace. */
export const MASCOTS: Record<string, string[]> = {
  owl: ["╭◜◝╮", "(• •)", "╰━━╯"],
  robot: ["┌─◷─┐", "│o o│", "└┯━┯┘"],
  cat: ["╱\\_/\\", "( o.o)", " > ^ <"],
  weaver: ["  ◇  ", " ╱│╲ ", "◦ ◦ ◦"],
  eye: ["╭─────╮", "│  ◉  │", "╰─────╯"],
};

export const DEFAULT_MASCOT = "eye";

/** The eye with its lid shut — the blink frame. Same 7×3 footprint as the open eye. */
const EYE_BLINK: string[] = ["╭─────╮", "│  ═  │", "╰─────╯"];

export function mascot(name?: string): string[] {
  return MASCOTS[name ?? DEFAULT_MASCOT] ?? MASCOTS[DEFAULT_MASCOT]!;
}

/**
 * A single animation frame for the mascot. The eye blinks (◉ → ═) when `blink` is
 * true; every other mascot is static, so this collapses to `mascot()` for them.
 */
export function mascotFrame(
  name: string | undefined,
  blink: boolean,
): string[] {
  const key = name ?? DEFAULT_MASCOT;
  if (key === "eye" && blink) return EYE_BLINK;
  return MASCOTS[key] ?? MASCOTS[DEFAULT_MASCOT]!;
}

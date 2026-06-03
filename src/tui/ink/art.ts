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

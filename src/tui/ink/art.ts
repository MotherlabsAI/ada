/**
 * ASCII identity for the Ada shell — wordmark + mascot. Kept as data so it's trivial to
 * swap/iterate (the mascot is Alex's identity choice; these are candidates to pick from).
 */

/** "ADA" in box-drawing, with a spaced "context" tag. 3 rows. */
export const WORDMARK: string[] = [
  "╔═╗ ╔╦╗ ╔═╗",
  "╠═╣ ║ ║ ╠═╣   c o n t e x t",
  "╩ ╩ ╚╩╝ ╩ ╩",
];

/** Candidate mascots (5 cols × 3 rows). Pick one; easy to replace. */
export const MASCOTS: Record<string, string[]> = {
  owl: ["╭◜◝╮", "(• •)", "╰━━╯"],
  robot: ["┌─◷─┐", "│o o│", "└┯━┯┘"],
  cat: ["╱\\_/\\", "( o.o)", " > ^ <"],
  weaver: ["  ◇  ", " ╱│╲ ", "◦ ◦ ◦"],
};

export const DEFAULT_MASCOT = "owl";

export function mascot(name?: string): string[] {
  return MASCOTS[name ?? DEFAULT_MASCOT] ?? MASCOTS[DEFAULT_MASCOT]!;
}

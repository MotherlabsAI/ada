/**
 * Obsidian wikilink emission (FREEZE.md §4 P5, Steal 6-b).
 *
 * A compiled pack must open in Obsidian as a populated knowledge graph, while the
 * same directory stays readable by Claude Code (which consumes content regardless of
 * link syntax). Obsidian resolves `[[X]]` to a note named `X.md` OR a note whose YAML
 * frontmatter `aliases:` contains `X`.
 *
 * RESOLUTION SCHEME (chosen — the most robust, per the task): every note carries a
 * stable Obsidian alias in YAML frontmatter, and every cross-link targets that alias.
 *  - Node notes (`nodes/<CLUSTER>/<NNN-slug>/wiki.md`) all share the basename `wiki.md`,
 *    so a basename scheme cannot disambiguate them. Instead each node note declares
 *    `aliases: ["<id>", "<label>"]` and is linked by its node id (`[[ATT.005|Label]]`).
 *  - Wiki section pages (`wiki/<slug>.md`) declare an alias equal to their slug without
 *    the `.md` extension (e.g. `glossary`) and are linked by that slug.
 *
 * The id (`ATT.005`) and the slug (`glossary`) are the link TARGETS; they contain no
 * `[ ] | # ^`, so they always resolve. The human label is the optional display text
 * after the pipe. Pure, deterministic (AXIOM A1).
 */

/** Characters Obsidian forbids inside a `[[target]]`. */
const ILLEGAL_TARGET = /[[\]|#^]/g;

/** Characters that would terminate or split a wikilink if left in the display text. */
const ILLEGAL_DISPLAY = /[[\]|]/g;

/**
 * Sanitize a string into a safe wikilink target. Node ids and wiki slugs are already
 * safe; this only guards against a malformed id ever corrupting the link syntax.
 */
export function safeTarget(target: string): string {
  return target.replace(ILLEGAL_TARGET, " ").trim();
}

/** Sanitize display text so it cannot close or split the wikilink. */
function safeDisplay(label: string): string {
  return label.replace(ILLEGAL_DISPLAY, " ").trim();
}

/**
 * An Obsidian wikilink. `[[target]]` when no distinct label is given, else
 * `[[target|label]]`. The target must match a note basename or a frontmatter alias.
 */
export function wikilink(target: string, label?: string): string {
  const t = safeTarget(target);
  if (!label || label === target) return `[[${t}]]`;
  return `[[${t}|${safeDisplay(label)}]]`;
}

/** Slug without its trailing `.md`, used as a wiki page's stable alias/target. */
export function pageTarget(slug: string): string {
  return safeTarget(slug.replace(/\.md$/i, ""));
}

/**
 * A YAML frontmatter block declaring Obsidian aliases (and optional tags). Emitted at
 * the very top of a note so Obsidian indexes the note under each alias. The strings are
 * double-quoted (valid YAML, escapes apostrophes/colons/em-dashes safely).
 */
export function frontmatter(aliases: string[], tags: string[] = []): string {
  const quote = (s: string) =>
    `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  // De-dupe while preserving order; drop empties.
  const seen = new Set<string>();
  const uniq = aliases
    .map((a) => a.trim())
    .filter((a) => a && !seen.has(a) && (seen.add(a), true));
  const lines = ["---", "aliases:", ...uniq.map((a) => `  - ${quote(a)}`)];
  if (tags.length) {
    lines.push("tags:", ...tags.map((t) => `  - ${quote(t)}`));
  }
  lines.push("---", "");
  return lines.join("\n");
}

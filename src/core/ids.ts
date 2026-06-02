/** Id / slug helpers. Pure, deterministic (AXIOM A1). */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/** "L2C.001" -> "L2C" */
export function clusterOf(id: string): string {
  const dot = id.indexOf(".");
  return dot === -1 ? id : id.slice(0, dot);
}

/** "L2C.001" -> "001" */
export function indexOfId(id: string): string {
  const dot = id.indexOf(".");
  return dot === -1 ? "000" : id.slice(dot + 1);
}

/** Directory name for a node: "001-nouns-to-entities". */
export function nodeDirName(id: string, label: string): string {
  // Fall back to a placeholder so an unslugifiable label never yields "001-".
  return `${indexOfId(id)}-${slugify(label) || "node"}`;
}

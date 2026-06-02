/** Deterministic structural proxies for node-capsule quality (AXIOM A3: C, not model). */

const BANNED = [
  /\bquality you can trust\b/i,
  /\bbest practices\b/i,
  // Buzzword VERB forms of "leverage" only. The noun (as in "high-leverage",
  // "highest-leverage decision") is legitimate domain language; the filler is the
  // verb ("leveraging best practices", "leverage our synergies").
  /\bleverages\b/i,
  /\bleveraged\b/i,
  /\bleveraging\b/i,
  /(?<![-\w])leverage\s+(?:the|a|an|our|your|its|their|on)\b/i,
  /\bworld[- ]class\b/i,
  /\bseamless(ly)?\b/i,
  /\bcutting[- ]edge\b/i,
  /\bgame[- ]chang/i,
  /\bsynerg/i,
  /\bhelps? (users|them|you) a lot\b/i,
  /\bis (very )?important\b/i,
];

/**
 * Quoted spans are the node CITING an example (often an anti-pattern it is
 * teaching against, e.g. "...not 'Quality You Can Trust Since 1998'"), not the
 * author asserting filler. Strip double-quoted material before linting so a good
 * node that names a banned slogan as a negative example is not itself rejected.
 */
function stripQuoted(text: string): string {
  return text.replace(/"[^"]*"/g, " ");
}

export function hasBannedGenericPhrase(text: string): boolean {
  const authorial = stripQuoted(text);
  return BANNED.some((re) => re.test(authorial));
}

/** Counts concrete specificity signals: numbers/units, named mechanisms, proper-ish nouns. */
export function specificityScore(text: string): number {
  let score = 0;
  // Any numeric signal: a bare digit, a written sub-second/sub-minute, or a "<N" bound.
  const hasNumber =
    /\d/.test(text) ||
    /\bsub-(second|minute)\b/i.test(text) ||
    /<\s?\d/.test(text);
  if (hasNumber) score += 1;
  // A number bound to a unit — incl. compact forms (2.6s, 200ms, <1s) and written sub-second.
  if (
    /(<\s?)?\d+(\.\d+)?\s?(ms|s|px|%|min|hr|x)\b/i.test(text) ||
    /\bsub-(second|minute)\b/i.test(text)
  )
    score += 1;
  // A named mechanism: a classic domain noun after a capitalized term, OR a
  // possessive/multi-word proper-noun mechanism (e.g. "Google's local pack",
  // "ChatGPT's entity matcher"). Real specificity often names the actor, not a "theory".
  const namedMechanism =
    /[A-Z][a-z]+(?:['’]s)?\b.*\b(theory|effect|law|pattern|gap|budget|system|gate|pack|matcher|window|protocol|action)\b/i.test(
      text,
    ) || /[A-Z][a-zA-Z]+['’]s\s+[a-z]+\b/.test(text);
  if (namedMechanism) score += 1;
  // Clause density ~ concreteness: commas, semicolons, or em-dashes.
  const clauseMarks = (text.match(/[,;—]/g) ?? []).length;
  if (clauseMarks >= 2) score += 1;
  return score;
}

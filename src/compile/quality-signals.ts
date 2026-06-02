/** Deterministic structural proxies for node-capsule quality (AXIOM A3: C, not model). */

const BANNED = [
  /\bquality you can trust\b/i,
  /\bbest practices\b/i,
  /\bleverage(s|d|ing)?\b/i,
  /\bworld[- ]class\b/i,
  /\bseamless(ly)?\b/i,
  /\bcutting[- ]edge\b/i,
  /\bgame[- ]chang/i,
  /\bsynerg/i,
  /\bhelps? (users|them|you) a lot\b/i,
  /\bis (very )?important\b/i,
];

export function hasBannedGenericPhrase(text: string): boolean {
  return BANNED.some((re) => re.test(text));
}

/** Counts concrete specificity signals: numbers/units, named mechanisms, proper-ish nouns. */
export function specificityScore(text: string): number {
  let score = 0;
  if (/\d/.test(text)) score += 1; // any number
  if (/\d+\s?(ms|s|px|%|min|hr|x)\b/i.test(text)) score += 1; // number with a unit
  if (
    /[A-Z][a-z]+(?:'s)?\b.*\b(theory|effect|law|pattern|gap|budget|system)\b/i.test(
      text,
    )
  )
    score += 1; // named mechanism
  const commas = (text.match(/,/g) ?? []).length; // clause density ~ concreteness
  if (commas >= 2) score += 1;
  return score;
}

export const name = "non_negative_payment";
export const invariant =
  "Every payment amount is a finite, non-negative integer in minor units; a refund must use kind 'refund' with a strictly positive amount.";
export const checkClass = "C5";

export function run(data) {
  const violations = [];
  for (const p of data.payments || []) {
    if (
      typeof p.amountCents !== 'number' ||
      !Number.isFinite(p.amountCents) ||
      !Number.isInteger(p.amountCents) ||
      p.amountCents < 0
    ) {
      violations.push({
        kind: 'invalid_amount',
        payment: p.id,
        amountCents: p.amountCents,
      });
      continue;
    }
    // Enforce the second clause of the invariant, not just the sign.
    if (p.kind === 'refund' && !(p.amountCents > 0)) {
      violations.push({
        kind: 'nonpositive_refund',
        payment: p.id,
        amountCents: p.amountCents,
      });
    }
  }
  return { name, pass: violations.length === 0, violations };
}

# ◇ ● ∴ ⇒ ATT.004 — Salience

## ⟡ Summary
Salience on a service homepage is a zero-sum budget, not an additive property: the pre-attentive system allocates a fixed pool of attention in the first ~200ms purely on raw contrast (luminance, color, size, motion) before any reading, so every element you make "pop" steals salience from the proof-of-trust + booking-CTA pair that must win inside the 2.6s impression window. The trade craft is to engineer exactly three salience peaks — headline value-prop, star-rating/review-count chip, booking CTA — on an otherwise flat field, and to DELIBERATELY de-salience the logo, nav, and decorative hero photo so the trust+action peak has no rivals. The classic flattening failure is a rotating hero slider + chat bubble + cookie banner + "Call Now" button all firing at once; motion (the slider) is the worst offender because it captures pre-attentive attention involuntarily and cannot be suppressed by intent. This is enforceable: lint rejects auto-rotating carousels above the fold, counts high-contrast/animated elements (>N fails), and verifies the CTA holds the single highest contrast ratio against a near-monochrome page. On mobile the budget shrinks — the fold holds ~half the elements — so the three-peak rule tightens to two, and the open trade is whether the phone-call or online-booking CTA holds the lone peak, decided by how the business actually takes jobs.

## ∴ Why it matters
If salience is spread evenly the visitor's pre-attentive system finds no anchor, defaults to the F-pattern failure-scan, and bounces before the booking path is ever seen. Concentrating the salience budget is the single highest-leverage attention decision on the page.

## ! Failure if missing
Hero competes with slider, chat widget, and nav for the same pre-attentive contrast; nothing wins; visitor scans, finds no anchor in 2.6s, and bounces without seeing the booking CTA.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: excavated_from_intent

## ⊢ Compiles to
- graph
- wiki
- c

## κ Checkability
Class **C2** — rubric/LLM. Has deterministic check candidates.

Candidate checks:
- `Deterministic count of high-contrast/animated elements above the fold (>N fails)`
- `Static contrast-ratio measurement of CTA vs page background`
- `Presence/absence of auto-rotating carousel in markup`

## Ω Residue / Unknowns
- The specific trade in this niche — whether phone-call CTA or online-booking CTA should hold the single salience peak (depends on how the business actually takes jobs)
- Whether the audience skews mobile, where the salience budget is even smaller and the fold is ~half the elements

## ↔ Links

# ◇ ● ∵ κ ⇒ ATT.013 — Visual Hierarchy / Scale

## ⟡ Summary
Visual hierarchy is the explicit ranking that forces the eye to read importance in your order; on a service homepage the load-bearing tool is SCALE-CONTRAST, not absolute size — a real typographic leap (think H1:body ratio >=3x, not 18px vs 16px) so the relevance-confirming value prop is read first, trust chip second, CTA third. The non-obvious insight: the F-pattern is a FAILURE STATE, not a target layout — NN/g's own follow-up shows it emerges when hierarchy is weak and the eye gives up and skims the left gutter. So "designing for the F-pattern" is backwards; you build steep hierarchy precisely to PREVENT the F-scan. For a single-focus conversion homepage the intentional structure is the Z-pattern: brand top-left, phone/CTA top-right, diagonal to the hero value prop, resting bottom-right on the booking action. The hierarchy must survive the mobile collapse: at 375px the three tiers stack, the hero image is usually demoted or removed (real owner/van photo can raise trust; stock is a leak), and tier-3 booking needs a sticky CTA so it stays reachable without scrolling back.

## ∴ Why it matters
Hierarchy is what converts the salience budget (ATT.004) into a READING ORDER. Without a steep scale leap the eye defaults to the F-failure-scan and the value prop, trust, and CTA are read in the wrong order or not at all. It's the difference between a designed page and a skimmed one.

## ! Failure if missing
Flat type scale and even weighting trigger the F-pattern failure-scan; eye skims the left gutter, the centered/right-aligned CTA and trust chip go unseen, conversion path is never read top-to-bottom.

## ∵ Evidence
- Truth class: ∵ source
- Source status: grounded_in_domain_knowledge

## ⊢ Compiles to
- graph
- wiki
- c
- claude
- blueprint

## κ Checkability
Class **C3** — deterministic. Has deterministic check candidates.

Candidate checks:
- `Deterministic H1:body font-size ratio threshold from rendered CSS`
- `Sticky-CTA presence at mobile breakpoint in markup/CSS`
- `Single-H1 check; heading-level order validity`
- `Contrast-ratio tiering between the three elements`

## Ω Residue / Unknowns
- Whether a hero image helps or hurts for this specific service (a real photo of the owner/van can raise trust; stock imagery is a leak)
- Exact mobile fold height across the target audience's device mix

## ↔ Links
- **Parents:** ATT.004, ATT.005
- **Exports to:** CLAUDE.md, CONTEXT.md

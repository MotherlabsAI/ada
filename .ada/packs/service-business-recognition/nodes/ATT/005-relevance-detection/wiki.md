# ◇ ● ∴ ⇒ ATT.005 — Relevance Detection

## ⟡ Summary
A sub-second relevance gate fires before a single word is read: "Am I in the right place for what I need, here, now?" For local-service buyers it tests three tokens that must clear the fold without scrolling — SERVICE (named in the customer's words, not the trade's jargon), PLACE (city/neighborhood, doubling as the "near me" geo signal), and SITUATION-FIT (emergency vs scheduled, residential vs commercial). The non-obvious move: relevance is scored against the query the visitor just typed, so the H1 must echo the searcher's own language — "Emergency Plumber in Kelowna — Same-Day," not "Quality You Can Trust Since 1998." The slogan fails because it carries zero matchable tokens; the visitor cannot confirm fit and bounces. The deeper point is mechanism convergence: the same place+service+intent tokens a human uses to confirm fit are the exact entities Google's local pack ranks on and ChatGPT's entity-matcher binds the page to. One headline decision satisfies three judges at once — which is also why it is the single cheapest, highest-yield fix on the page. The trap: situation-fit is not assumable. Pick "emergency" when the buyer's real dominant mode is "planned" and the token actively repels the right visitor.

## ∴ Why it matters
Relevance detection is the gate before salience even matters — a perfectly salient CTA on a page that fails the 'right place?' check still bounces. Echoing query language is the cheapest, highest-yield headline decision and the only one that simultaneously serves human, Google, and LLM.

## ! Failure if missing
Headline is a brand slogan with no service/place/intent tokens; visitor cannot confirm fit in <1s, assumes wrong page, bounces; Google and ChatGPT also fail to bind the page to the local query.

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
- `Deterministic check: H1 contains a service term AND a place term (token presence)`
- `Schema areaServed/serviceType present and matches H1 tokens`
- `Absence of banned slogan phrases in H1 (lint list)`

## Ω Residue / Unknowns
- The exact searcher vocabulary for this trade and region (requires keyword/PAA mining, not assumable)
- Whether the buyer's dominant situation is emergency or planned — changes the situation-fit token entirely

## ↔ Links
- **Parents:** ATT.004

# ◌ ● Ω κ ⇒ UNK.005 — Compliance and consent as a hard gate: review solicitation, tracking consent, and local licensing claims can sink the business

## ⟡ Summary
The user framed three goals as growth; each is actually regulated speech or instrumented data collection where the naive build's default is a fineable offense. (1) Reviews: the FTC Consumer Reviews and Testimonials Rule (in force since Oct 21, 2024; civil penalties up to ~$53k per violation) makes review gating unlawful — soliciting only satisfied customers, suppressing sub-4-star reviews, or incentivizing a specific sentiment. Yet "more reviews to rank and convert" is exactly what an unconstrained build automates with a "leave us a 5-star review" prompt. Compliant pattern: solicit ALL customers identically, disclose any incentive, surface negatives — baked into the request flow, not bolted on. (2) Tracking: the call-tracking/analytics from UNK.004 trigger consent duties BEFORE the first tracked session is legal — two-party-consent recording states (e.g. CA, FL, PA), plus cookie/CCPA/GDPR gates — so consent must block on script load order, not run alongside it. (3) Identity claims: "licensed/insured/certified" badges are deceptive unless true and current per the trade's regulator. The cross-cutting failure mode: the same automation that maximizes growth is what trips each tripwire, so compliance must be a hard gate inside each feature's spec, not a separate review pass.

## ∴ Why it matters
A growth tactic that violates the FTC reviews rule or call-recording/consent law converts the site from an asset into a liability — fines and platform removal erase any ranking gain.

## ! Failure if missing
Automated 'leave us a 5-star review' gating draws an FTC warning/penalty; call recording without consent breaks two-party-consent law; an unverified 'licensed/certified' claim is deceptive — each can shut the channel or the business.

## ∵ Evidence
- Truth class: Ω residue
- Source status: open_question

## ⊢ Compiles to
- graph
- wiki
- c
- claude
- blueprint

## κ Checkability
Class **C3** — deterministic. Has deterministic check candidates.

Candidate checks:
- `C3: assert review-request copy contains no sentiment-conditional/gating phrasing (banned-pattern lint) and applies to all customers (flow config check)`
- `C3: assert tracking/recording scripts do not execute before consent is granted (load-order/consent-gate assertion)`
- `C2: assert displayed credential strings map to an owner-provided evidence record (audited, not auto-verifiable)`

## Ω Residue / Unknowns
- Target jurisdiction's call-recording consent regime (one-party vs two-party) and privacy law (GDPR/CCPA/other)
- Whether the business intends to offer review incentives at all (changes required disclosures)
- The specific trade regulator's rules on advertising licensure/certification in the operating region

## ↔ Links
- **Parents:** UNK.003, UNK.004
- **Exports to:** CLAUDE.md, CONTEXT.md

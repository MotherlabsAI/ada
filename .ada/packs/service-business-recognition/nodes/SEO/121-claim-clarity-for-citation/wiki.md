# ◇ ● ∴ ⇒ SEO.121 — Claim Clarity for Citation

## ⟡ Summary
Answer engines cite only claims they can ground: statements specific enough to attach to your URL with low contradiction risk from other sources. The local-service failure mode is vague brag-copy ("top-quality service, fast response, competitive pricing") — unverifiable, unattributable, and byte-identical to every competitor, so it is unciteable. Claim clarity converts puffery into grounded, attributable facts: "licensed and insured since 2009 (WA contractor lic. #ABC123)," "average on-site arrival 47 min within Kelowna city limits," "flat-rate $89 diagnostic, waived if you book the repair." The mechanism: specificity is citation currency. A number, named credential, dated fact, or bounded guarantee is a discrete, low-risk thing to quote; an adjective is nothing the model can stand behind. The non-obvious layer most copy guidance misses: each clear claim must be paired with its evidence locus (license registry, review profile, warranty doc) so the model AND a skeptical human land on the same corroboration — co-located evidence is what raises grounding confidence above the citation threshold, not the claim alone. For local services this is doubly leveraged: the credentials that ground a claim (state license #, service-radius minutes, flat-rate pricing) are exactly the trust signals that close the booking, so one rewrite serves both the extractor and the human conversion.

## ∴ Why it matters
Models down-rank or skip claims they cannot verify because hallucinating a false claim is the expensive error they are tuned to avoid. Clear, grounded claims are the only ones that survive into a cited answer.

## ! Failure if missing
Copy reads fine to humans but gives AI nothing quotable; the business is described in generic terms or omitted, and conversion suffers because prospects see no differentiated, trustable specifics.

## ∵ Evidence
- Truth class: ∴ inference
- Source status: excavated_from_intent

## ⊢ Compiles to
- graph
- wiki
- c
- claude
- blueprint

## κ Checkability
Class **C2** — rubric/LLM. Has deterministic check candidates.

Candidate checks:
- `puffery-term lint: flag banned vague adjectives ('best','top-quality','affordable','fast','leading') without an adjacent number/credential (deterministic wordlist, proxy)`
- `claim-evidence pairing: assert each flagged claim has an adjacent citation/link or data attribute (deterministic structural check)`
- `numeric/credential density: count grounded tokens (numbers, license patterns, dates) per page vs threshold (deterministic proxy, not semantic truth)`

## Ω Residue / Unknowns
- Which specific claims are actually true and legally safe to publish (license numbers, response times, guarantees) — requires owner-supplied facts
- Whether quantified claims (e.g., arrival times) can be substantiated if challenged

## ↔ Links
- **Parents:** META.05, SEO.133
- **Exports to:** CLAUDE.md, CONTEXT.md

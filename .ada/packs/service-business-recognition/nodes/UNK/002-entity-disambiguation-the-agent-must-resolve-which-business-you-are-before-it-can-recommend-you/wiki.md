# ◌ ● Ω κ ⇒ UNK.002 — Entity disambiguation: the agent must resolve WHICH business you are before it can recommend you

## ⟡ Summary
"Get recognized by ChatGPT" sounds like a content problem. It is first an identity-resolution problem, and that gate is where local trades fail before content ever matters. An AI will not stake a recommendation on a business it cannot collapse to one canonical entity — and local service businesses are the worst case for collapse: identical names across towns ("Acme Plumbing"), franchise-vs-independent overlap, an owner's personal name shared with another local, a rebrand, or a drifted service area. Resolution confidence is built from two signals that must agree: NAP consistency across the web, and a sameAs graph (GBP, Wikidata, Facebook, LinkedIn, vertical directories) where independent sources cross-confirm one identity. The non-obvious mechanism: ChatGPT's local layer does not resolve places from your site — it resolves through canonical-profile providers (Foursquare/Places-backed) and only enriches from your site. So your on-site identity is the subordinate record. When it disagrees with the profile provider — a second phone number, a suite that drifted, an old address in the footer — confidence drops below threshold and the model does the safe thing: it omits you, or recommends the same-category competitor it CAN resolve cleanly. The failure is silent. You do not get a wrong answer you can see; you get absent from an answer you never watched. Fix the cheap, deterministic half first (one source-of-truth NAP rendered byte-identical site-wide, LocalBusiness JSON-LD with a stable @id and a non-empty sameAs[], areaServed bounding you to the right locality), because that is assertable in CI. Resolution to the right entity by a live model is observational and model-version dependent — you control the inputs to confidence, never the verdict.

## ∴ Why it matters
An entity the model cannot resolve to one canonical identity is an entity it will not stake a recommendation on; disambiguation is the precondition for every downstream visibility win.

## ! Failure if missing
AI cites a competitor or a wrong/duplicate listing, merges your business with a same-named one in another city, or omits you entirely because it cannot confidently tell which 'Acme Plumbing' you are.

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
- `C3: assert a single @id and a non-empty sameAs[] in LocalBusiness JSON-LD; assert NAP string is byte-identical across all rendered pages (deterministic)`
- `C3: assert phone/address in JSON-LD equals the GBP record via API diff`
- `C1: whether ChatGPT/Gemini actually resolve to the right entity is observational and model-version dependent`

## Ω Residue / Unknowns
- Whether a same-named or duplicate listing already exists in the target market that will collide
- Whether the business has (or qualifies for) a Wikidata/notability anchor, or must rely solely on directory sameAs
- Exact set of canonical-profile providers a given AI uses for the target vertical and country

## ↔ Links
- **Parents:** UNK.001
- **Exports to:** CLAUDE.md, CONTEXT.md

# ◇ ● ∵ κ ⇒ SEO.112 — NAP Consistency

## ⟡ Summary
For a local service business, NAP (Name, Address, Phone) is the primary key the entity graph joins on, not a contact detail. Google, ChatGPT, and Perplexity don't "trust" a business; they triangulate it across the site, Google Business Profile, Yelp, Apple Maps, BBB, and data aggregators (Data Axle, Neustar/Localeze, Foursquare). A single divergence — a suite number, an old phone, "Mon-Fri 9-5" on site vs "Mon-Sat 8-6" on Yelp — forces a fuzzy matcher under uncertainty to either pick one record at random or suppress that field to avoid hallucinating. The non-obvious part: byte-identical formatting matters more than people assume. "Ste 200" vs "Suite 200", "(250) 555-0100" vs "250-555-0100", "St." vs "Street" all read as candidate conflicts, so define a canonical NAP string once and emit it verbatim into the footer, the LocalBusiness schema, the GBP, and every citation. The phone is the sharpest trap: a single global tracked-or-untracked decision is mandatory, because per-channel call-tracking numbers (a DID swapped by Google Ads or a CallRail dynamic-insertion script) are the most common silent NAP-poisoner — they break entity identity by design and are invisible in a manual page audit because the swap happens client-side after render. Corollary: schema telephone and the rendered footer can pass a byte-diff yet still diverge at the aggregator tier, so the audit must reach the off-site listings, not just the built site.

## ∴ Why it matters
NAP is the join key that lets an AI merge five disconnected web records into one confident entity it will name in an answer. Inconsistency directly lowers citation probability because the model resolves ambiguity by omission.

## ! Failure if missing
The business exists as several low-confidence half-entities; AI assistants either cite a competitor with cleaner data or state the business's hours/address as 'unverified', and local-pack ranking suffers from conflicting signals.

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
- `grep all rendered NAP instances on the built site and assert byte-equality with the canonical constant (deterministic)`
- `assert schema telephone/address fields === canonical config values (deterministic JSON compare)`
- `fetch GBP/Yelp/Apple records via API and string-diff against canonical (deterministic where APIs exist; partial coverage)`

## Ω Residue / Unknowns
- Whether a call-tracking number is desired (breaks NAP identity by design) or a single static number is acceptable
- Which off-site directories the business is already listed on and whether those listings are owner-controlled
- The legally correct business name (DBA vs registered entity vs brand)

## ↔ Links
- **Parents:** META.05
- **Exports to:** CLAUDE.md, CONTEXT.md

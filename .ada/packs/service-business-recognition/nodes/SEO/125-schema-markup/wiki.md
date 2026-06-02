# ◇ ● ∵ κ ⇒ SEO.125 — Schema Markup

## ⟡ Summary
For a local service business, schema is the machine-readable assertion of entity identity that lets Google and AI assistants resolve "who and what is this source" without NLP guesswork. Load-bearing types: a SPECIFIC LocalBusiness subtype (Plumber, Electrician, HVACBusiness — not bare LocalBusiness), with name/address/telephone bound byte-for-byte to the canonical NAP constant (SEO.112), plus geo, areaServed, openingHoursSpecification, priceRange; one Service node per offering linked to the business; and AggregateRating/Review only where first-party and policy-compliant (self-serving review markup is restricted). The single highest-leverage, most-overlooked property is sameAs — an array of authoritative URLs (GBP, Wikidata, LinkedIn, Yelp, Facebook, BBB) that merges your scattered records into one confident entity; it does in structured data exactly the disambiguation job NAP does in prose. Post-2023 reality: FAQPage and HowTo rich results were retired for most sites, so emitting FAQPage chasing visual rich results is a misread — schema's value now is entity grounding and AI-citation confidence, not blue-link decoration. This is the most deterministically verifiable node in the cluster: required-property presence, type validity, NAP-binding equality, and sameAs reachability are all CI-checkable with zero subjective judgment.

## ∴ Why it matters
Clean entity schema with sameAs measurably raises AI-citation likelihood because the model can resolve the source's identity confidently; it is the structured backbone that NAP, claims, and reviews all bind to.

## ! Failure if missing
The site is just unstructured text the AI must guess at; entity resolution stays low-confidence, local rich features (map pack data, knowledge panel) don't populate, and citation probability drops versus schema-clean competitors.

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
Class **C5** — static/db. Has deterministic check candidates.

Candidate checks:
- `Schema.org / Google Rich Results validation of every emitted JSON-LD block, asserting zero errors (deterministic, automatable in CI)`
- `required-property presence: assert LocalBusiness has name/address/telephone/geo/areaServed/openingHours (deterministic JSON schema check)`
- `NAP-binding integrity: assert schema name/address/telephone === canonical NAP constant (deterministic compare)`
- `sameAs presence + URL well-formedness + reachability (deterministic)`

## Ω Residue / Unknowns
- The correct LocalBusiness subtype for this specific trade (affects type validity)
- Which sameAs profiles actually exist and are owner-controlled
- Whether reviews/ratings are first-party and policy-compliant to mark up (self-serving review markup is restricted)

## ↔ Links
- **Parents:** META.05, SEO.112
- **Exports to:** CLAUDE.md, CONTEXT.md

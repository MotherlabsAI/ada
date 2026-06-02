# ◇ ● ∴ κ ⇒ SEO.124 — Chunk Coherence for Agent Retrieval

## ⟡ Summary
Answer engines never rank your page; their retriever slices it into fixed-length windows (~100 tokens, sliding, overlapping) that ignore your H2 and paragraph boundaries, embeds each slice, and ranks slices. Chunk coherence is the discipline of guaranteeing that wherever the blade falls, the slice is still a complete, citable thought. The trap that kills service-business pages: the question sits in an H2, the answer is three paragraphs down, and a back-reference two sentences in ("it", "they", "this service", "the company") points across the cut — so the lifted slice is ambiguous, never names the business or the city, and a competitor with co-located Q+A+entity wins the citation even though your page is more complete. Engineer coherence by co-residence: force the question phrase, the answer, the entity name, the city, and the one citable number ("$149", "same-day", "24/7") into the same ~100-token window; resolve every pronoun and definite-NP back-reference inline; never let a heading break fall between a question and its answer's first sentence. This is the retrieval-side twin of answer atoms (SEO.118): atoms are how you author a chunk the retriever can lift whole. The asymmetry that makes this high-leverage for local services — local intent is dense with the entity and city that MUST appear in-slice, yet templated service pages scatter them across header, hero, and footer, so the one window the retriever lifts is exactly the one that names neither. Verify deterministically, not by reading: slide a 100-token window across the tokenized DOM and assert each target answer span carries question-cue + entity + city + number inside one window; lint for unresolved referents inside answer blocks; assert no H2/H3 boundary splits a Q from its answer. Caveat: exact window size/overlap differs across AI Overviews, Perplexity, and ChatGPT and drifts — engineer to the tightest plausible window so you survive all of them.

## ∴ Why it matters
Citation happens at the chunk level under fixed-window chunking. If your answer doesn't survive an arbitrary cut, it is invisible to the answer engine no matter how well the page ranks.

## ! Failure if missing
Retrievers lift fragmented or pronoun-broken slices that fail to mention the business or resolve the question; the engine cites a cleaner-chunked competitor even when your page is more complete.

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
Class **C3** — deterministic. Has deterministic check candidates.

Candidate checks:
- `sliding-window simulation: tokenize page, slide a 100-token window, assert each target answer span contains question-cue + entity + city + number within one window (deterministic)`
- `intra-chunk coreference lint: flag unresolved pronouns/definite NPs inside answer blocks (deterministic regex over a referent list, proxy)`
- `heading-break check: assert no H2/H3 boundary falls between a question heading and its answer's first sentence (deterministic DOM check)`

## Ω Residue / Unknowns
- The exact chunk size/overlap each target engine (AI Overviews vs Perplexity vs ChatGPT) uses — public values are approximate and drift
- Whether the chosen page-builder/CMS lets answer blocks render as atomic, non-fragmented units

## ↔ Links
- **Parents:** META.05, SEO.118
- **Exports to:** CLAUDE.md, CONTEXT.md

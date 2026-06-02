# ◇ ● ∴ ⇒ SEO.118 — Answer Atom: What It Is

- cluster: SEO · depth: L4 · truth: ∴ inference
- checkability: C2 (rubric/LLM)
- compiles to: graph, wiki, c, claude, blueprint

**Summary.** An answer atom is a single self-contained passage (~40-110 words, one retriever chunk) that fully answers one specific query with zero dependence on surrounding paragraphs. The unit AEO actually optimizes is the atom, not the page — the page is just a container of independently-liftable answers, each targeting one real query. For a local service business, the highest-value atoms are operational facts framed as answers, not "about us" prose: "Does [Business] offer 24/7 emergency [service] in [city]? Yes — we dispatch a licensed technician to [neighborhoods] within [X] hours, including weekends." Non-obvious rule: write each atom so it survives being ripped out and pasted into a chat answer verbatim. That means the entity name and city must appear INSIDE the atom — no "we," "here," or "this service" — because by the time the assistant quotes you it has lost all page context and any deictic reference resolves to nothing. The deictic-pronoun ban is the operational core, and it's checkable: a regex asserting no first-person/deictic tokens inside an atom block is a deterministic proxy for self-containment. This reframes a service page from "a description" into "a set of standalone answers," each mapped query → atom → page anchor for downstream FAQ/schema and internal linking.

**Why.** AI answer engines retrieve and cite at the passage level, not the page level. If your facts are smeared across paragraphs that only make sense together, none of them is liftable, so you get read but never cited.

**Failure if missing.** Pages rank but are never quoted by ChatGPT/Perplexity/AI Overviews; the model summarizes a competitor whose facts were packaged as standalone answers.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.

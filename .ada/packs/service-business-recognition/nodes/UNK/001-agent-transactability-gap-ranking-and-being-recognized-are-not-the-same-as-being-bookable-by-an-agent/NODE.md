# ◌ ● Ω ⇒ UNK.001 — Agent transactability gap: ranking and being recognized are not the same as being bookable by an agent

- cluster: UNK · depth: L3 · truth: Ω residue
- checkability: C2 (rubric/LLM)
- compiles to: graph, wiki, c

**Summary.** The intent treats "recognized by ChatGPT/agents" and "converts into bookings" as two goals; in the 2026 agentic-booking regime they collapse into one. An agent that recognizes you but cannot transact with you yields zero bookings — and worse, books the competitor it CAN transact with. When ChatGPT Agent or Google AI Mode acts, it needs a machine-readable booking surface (Reserve with Google / GBP booking action, a Calendly-class link, or a documented booking endpoint), real-time availability, and a phone that gets answered. A human-only contact form is an agentic dead end. The failure is silent and the worst kind to debug: you rank, you get cited, the agent reaches your site, hits a form it can't complete or a "call us" with no answer, and routes the user elsewhere — leaving the owner with traffic, no bookings, and a wrong diagnosis ("our SEO is broken"). The leak is at the last inch, invisible in every analytics view that stops at the visit. The user said "recognized" (presentation) when the market now pays for "transactable" (action) — the single most under-specified seam in the intent. Concretely it compiles to: a booking-surface decision node, schema.org LocalBusiness with potentialAction=ReserveAction/OrderAction targeting that surface, a real-time availability source (not hand-edited hours) wired in, and an agent-completable form (stable field names, ARIA labels, no captcha on the happy path) with a structured fallback endpoint. Cheapest deterministic guard: assert ReserveAction exists in the JSON-LD and its target URL returns 200 — but note that whether real agents *choose* to transact stays observational, and which surface a given trade's customers' agents invoke (Reserve with Google vs Booksy vs raw endpoint) varies by vertical and region.

**Why.** Without a machine-readable booking path, every dollar spent on ranking and entity recognition leaks at the last inch — the agent arrives and cannot close, so visibility converts to nothing.

**Failure if missing.** Site ranks and gets cited by ChatGPT, but agents that try to book hit an unparseable form or unanswered phone and book a competitor; the owner sees traffic with no bookings and blames SEO.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.

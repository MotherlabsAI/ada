# ◌ ● Ω κ ⇒ UNK.004 — Conversion instrumentation: 'converts into bookings' is unmeasurable without call + form + agent attribution wired from day one

- cluster: UNK · depth: L4 · truth: Ω residue
- checkability: C3 (deterministic)
- compiles to: graph, wiki, c, claude, blueprint

**Summary.** For a local service business the dominant conversion is a phone call, and the instant a visitor leaves the page to dial, standard web analytics goes blind — so "convert attention into bookings" is unmeasurable unless call tracking, form events, chat capture, and agent-session tagging are wired from day one, before any ranking/AEO/ads spend can be judged. The non-obvious trap: dynamic number insertion (DNI) swaps the on-page phone number per visitor to attribute web sessions, but that directly collides with the NAP/entity-consistency requirement (UNK.002) that one identical number appear everywhere. Resolve it by reserving ONE canonical NAP number for schema, GBP, and citations and confining DNI to the on-page display number for tracked web sessions only — never letting the swap pool touch the canonical number. Second trap: a "booking" is not a conversion event; the unit must be a revenue-tagged qualified booking (service type, city, new-vs-existing, booked-or-not, revenue won) pushed back to a CRM, or the attribution data is noise that cannot separate which channel actually paid. Bake conversion taxonomy (form_submit, click_to_call, chat_start, booking_confirmed) and a likely-agent-traffic heuristic into the templates as dataLayer hooks; deferring this makes every downstream optimization retroactively unfalsifiable, since you cannot re-attribute calls that were never tracked.

**Why.** If you can't attribute bookings to source, you can't tell whether ranking, AI recognition, or ads paid off — the entire 'converts attention into bookings' goal becomes unfalsifiable and untunable.

**Failure if missing.** Owner spends on SEO/AEO/ads with no idea what works; phone-call bookings (the majority) are invisible; DNI naively swaps the number everywhere and silently corrupts NAP/entity consistency.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.

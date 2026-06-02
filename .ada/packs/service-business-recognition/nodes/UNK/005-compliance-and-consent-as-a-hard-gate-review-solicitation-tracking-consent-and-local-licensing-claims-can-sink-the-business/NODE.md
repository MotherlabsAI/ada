# ◌ ● Ω κ ⇒ UNK.005 — Compliance and consent as a hard gate: review solicitation, tracking consent, and local licensing claims can sink the business

- cluster: UNK · depth: L4 · truth: Ω residue
- checkability: C3 (deterministic)
- compiles to: graph, wiki, c, claude, blueprint

**Summary.** The user framed three goals as growth; each is actually regulated speech or instrumented data collection where the naive build's default is a fineable offense. (1) Reviews: the FTC Consumer Reviews and Testimonials Rule (in force since Oct 21, 2024; civil penalties up to ~$53k per violation) makes review gating unlawful — soliciting only satisfied customers, suppressing sub-4-star reviews, or incentivizing a specific sentiment. Yet "more reviews to rank and convert" is exactly what an unconstrained build automates with a "leave us a 5-star review" prompt. Compliant pattern: solicit ALL customers identically, disclose any incentive, surface negatives — baked into the request flow, not bolted on. (2) Tracking: the call-tracking/analytics from UNK.004 trigger consent duties BEFORE the first tracked session is legal — two-party-consent recording states (e.g. CA, FL, PA), plus cookie/CCPA/GDPR gates — so consent must block on script load order, not run alongside it. (3) Identity claims: "licensed/insured/certified" badges are deceptive unless true and current per the trade's regulator. The cross-cutting failure mode: the same automation that maximizes growth is what trips each tripwire, so compliance must be a hard gate inside each feature's spec, not a separate review pass.

**Why.** A growth tactic that violates the FTC reviews rule or call-recording/consent law converts the site from an asset into a liability — fines and platform removal erase any ranking gain.

**Failure if missing.** Automated 'leave us a 5-star review' gating draws an FTC warning/penalty; call recording without consent breaks two-party-consent law; an unverified 'licensed/certified' claim is deceptive — each can shut the channel or the business.

See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.

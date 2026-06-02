/**
 * Calibration set for the node-quality rubric. The rubric's regression suite.
 *
 * IMPRESSIVE_EXEMPLARS are lifted VERBATIM from real compiled nodes in
 * .ada/packs/service-business-recognition/graph.json (ATT.004, ATT.005,
 * COPY.055, SEO.124, UNK.001). NodeCapsule -> NodeSpec field mapping:
 *   summary/whyItMatters/failureIfMissing = localContext.*
 *   compilesTo = role.compileTargets,  checkClass = checkability.class,
 *   cCandidates = checkability.candidates,  unknowns = epistemics.unknowns,
 *   parents = worldLinks.parents,  cluster = id prefix before the dot.
 * fromPrompt is not stored on the capsule; it is reconstructed here from the
 * pack's root intent (SEED.md) — the fragments each node traces back to.
 *
 * GENERIC_EXEMPLARS are deliberately vague rewrites of the same labels that
 * MUST be rejected. Together they prove the rubric separates good from generic.
 */
import type { NodeSpec } from "./assemble.js";

export const IMPRESSIVE_EXEMPLARS: NodeSpec[] = [
  {
    id: "ATT.004",
    label: "Salience",
    cluster: "ATT",
    depth: "L3",
    summary:
      "Salience on a service homepage is a zero-sum budget, not an additive property: the pre-attentive system allocates a fixed pool of attention in the first ~200ms purely on raw contrast (luminance, color, size, motion) before any reading, so every element you make \"pop\" steals salience from the proof-of-trust + booking-CTA pair that must win inside the 2.6s impression window. The trade craft is to engineer exactly three salience peaks — headline value-prop, star-rating/review-count chip, booking CTA — on an otherwise flat field, and to DELIBERATELY de-salience the logo, nav, and decorative hero photo so the trust+action peak has no rivals. The classic flattening failure is a rotating hero slider + chat bubble + cookie banner + \"Call Now\" button all firing at once; motion (the slider) is the worst offender because it captures pre-attentive attention involuntarily and cannot be suppressed by intent. This is enforceable: lint rejects auto-rotating carousels above the fold, counts high-contrast/animated elements (>N fails), and verifies the CTA holds the single highest contrast ratio against a near-monochrome page. On mobile the budget shrinks — the fold holds ~half the elements — so the three-peak rule tightens to two, and the open trade is whether the phone-call or online-booking CTA holds the lone peak, decided by how the business actually takes jobs.",
    whyItMatters:
      "If salience is spread evenly the visitor's pre-attentive system finds no anchor, defaults to the F-pattern failure-scan, and bounces before the booking path is ever seen. Concentrating the salience budget is the single highest-leverage attention decision on the page.",
    failureIfMissing:
      "Hero competes with slider, chat widget, and nav for the same pre-attentive contrast; nothing wins; visitor scans, finds no anchor in 2.6s, and bounces without seeing the booking CTA.",
    fromPrompt: [
      "converts attention into bookings"
    ],
    compilesTo: [
      "graph",
      "wiki",
      "c"
    ],
    checkClass: "C2",
    cCandidates: [
      "Deterministic count of high-contrast/animated elements above the fold (>N fails)",
      "Static contrast-ratio measurement of CTA vs page background",
      "Presence/absence of auto-rotating carousel in markup"
    ],
    unknowns: [
      "The specific trade in this niche — whether phone-call CTA or online-booking CTA should hold the single salience peak (depends on how the business actually takes jobs)",
      "Whether the audience skews mobile, where the salience budget is even smaller and the fold is ~half the elements"
    ],
    truth: "inference",
    parents: [],
  },
  {
    id: "ATT.005",
    label: "Relevance Detection",
    cluster: "ATT",
    depth: "L3",
    summary:
      "A sub-second relevance gate fires before a single word is read: \"Am I in the right place for what I need, here, now?\" For local-service buyers it tests three tokens that must clear the fold without scrolling — SERVICE (named in the customer's words, not the trade's jargon), PLACE (city/neighborhood, doubling as the \"near me\" geo signal), and SITUATION-FIT (emergency vs scheduled, residential vs commercial). The non-obvious move: relevance is scored against the query the visitor just typed, so the H1 must echo the searcher's own language — \"Emergency Plumber in Kelowna — Same-Day,\" not \"Quality You Can Trust Since 1998.\" The slogan fails because it carries zero matchable tokens; the visitor cannot confirm fit and bounces. The deeper point is mechanism convergence: the same place+service+intent tokens a human uses to confirm fit are the exact entities Google's local pack ranks on and ChatGPT's entity-matcher binds the page to. One headline decision satisfies three judges at once — which is also why it is the single cheapest, highest-yield fix on the page. The trap: situation-fit is not assumable. Pick \"emergency\" when the buyer's real dominant mode is \"planned\" and the token actively repels the right visitor.",
    whyItMatters:
      "Relevance detection is the gate before salience even matters — a perfectly salient CTA on a page that fails the 'right place?' check still bounces. Echoing query language is the cheapest, highest-yield headline decision and the only one that simultaneously serves human, Google, and LLM.",
    failureIfMissing:
      "Headline is a brand slogan with no service/place/intent tokens; visitor cannot confirm fit in <1s, assumes wrong page, bounces; Google and ChatGPT also fail to bind the page to the local query.",
    fromPrompt: [
      "ranks in Google",
      "recognized by ChatGPT/agents",
      "converts attention into bookings"
    ],
    compilesTo: [
      "graph",
      "wiki",
      "c"
    ],
    checkClass: "C2",
    cCandidates: [
      "Deterministic check: H1 contains a service term AND a place term (token presence)",
      "Schema areaServed/serviceType present and matches H1 tokens",
      "Absence of banned slogan phrases in H1 (lint list)"
    ],
    unknowns: [
      "The exact searcher vocabulary for this trade and region (requires keyword/PAA mining, not assumable)",
      "Whether the buyer's dominant situation is emergency or planned — changes the situation-fit token entirely"
    ],
    truth: "inference",
    parents: [
      "ATT.004"
    ],
  },
  {
    id: "COPY.055",
    label: "H1 Contract",
    cluster: "COPY",
    depth: "L4",
    summary:
      "For a local service business the H1 is not a slogan, it is a three-part contract: WHAT (the service noun) + WHERE (the geo) + WHO-it's-for or the quantified differentiator. \"Emergency Plumbing in Kelowna — On-Site in 90 Minutes\" is a contract the page can pay off; \"Quality You Can Trust\" is a promise nothing downstream can honour. The non-obvious move: this one string is read by three different machines at once, and most operators optimize for only the first. (1) Google's local relevance matcher needs the service+geo tokens to confirm the page answers \"[service] near me\". (2) An LLM entity extractor (ChatGPT/Perplexity, asked \"who does X in Y\") lifts the H1 near-verbatim as the clean entity+geo citation — abstract value-words give it nothing to quote. (3) The arriving human, three seconds from bouncing, is doing message-match: the H1 has to echo the exact query they typed in the ad or search box, or they conclude they're in the wrong place. The keyword matcher, the entity extractor, and the skeptical human are mutually reinforcing readers — a generic H1 fails all three simultaneously, so bounce and irrelevance compound into lost rank AND lost bookings from the same defect. Practical consequence: one contract per money page (per service-area), with the differentiator quantified (speed, hours, guarantee) rather than asserted — and where no genuine differentiator exists, compete on the tightest service+geo specificity available rather than reaching for an abstraction.",
    whyItMatters:
      "The H1 is the single highest-leverage string on the site: it gates the bounce decision, supplies the strongest on-page relevance signal for local rank, and is the most-quoted span when an LLM summarises 'who provides this service here'. Get it generic and all three downstream systems degrade at once.",
    failureIfMissing:
      "Without a contract H1 the page reads as a generic brochure: Google can't confirm service+location match, LLMs have no clean entity+geo string to cite, and a visitor arriving from a specific query feels the page didn't answer them and leaves. Bounce and irrelevance compound into both lost rank and lost bookings.",
    fromPrompt: [
      "ranks in Google",
      "recognized by ChatGPT/agents",
      "converts attention into bookings",
      "gives Claude Code enough context to build the thing properly"
    ],
    compilesTo: [
      "graph",
      "wiki",
      "c",
      "claude",
      "blueprint"
    ],
    checkClass: "C2",
    cCandidates: [
      "C3: assert exactly one <h1> element exists on each page (DOM count == 1)",
      "C3: H1 text contains the page's declared service noun AND the declared geo token (substring/entity match against the page's frontmatter)",
      "C2: rubric score that the differentiator is concrete/quantified, not an abstract value-word ('trust', 'quality', 'excellence') — flagged against a banned-abstraction list"
    ],
    unknowns: [
      "The exact service noun + city tokens for this specific business (not yet supplied)",
      "Whether the business has a genuine quantified differentiator (speed, guarantee, hours) or must compete on geo+service alone",
      "Whether ad/search query intent is known well enough to message-match the H1 per traffic source"
    ],
    truth: "inference",
    parents: [],
  },
  {
    id: "SEO.124",
    label: "Chunk Coherence for Agent Retrieval",
    cluster: "SEO",
    depth: "L5",
    summary:
      "Answer engines never rank your page; their retriever slices it into fixed-length windows (~100 tokens, sliding, overlapping) that ignore your H2 and paragraph boundaries, embeds each slice, and ranks slices. Chunk coherence is the discipline of guaranteeing that wherever the blade falls, the slice is still a complete, citable thought. The trap that kills service-business pages: the question sits in an H2, the answer is three paragraphs down, and a back-reference two sentences in (\"it\", \"they\", \"this service\", \"the company\") points across the cut — so the lifted slice is ambiguous, never names the business or the city, and a competitor with co-located Q+A+entity wins the citation even though your page is more complete. Engineer coherence by co-residence: force the question phrase, the answer, the entity name, the city, and the one citable number (\"$149\", \"same-day\", \"24/7\") into the same ~100-token window; resolve every pronoun and definite-NP back-reference inline; never let a heading break fall between a question and its answer's first sentence. This is the retrieval-side twin of answer atoms (SEO.118): atoms are how you author a chunk the retriever can lift whole. The asymmetry that makes this high-leverage for local services — local intent is dense with the entity and city that MUST appear in-slice, yet templated service pages scatter them across header, hero, and footer, so the one window the retriever lifts is exactly the one that names neither. Verify deterministically, not by reading: slide a 100-token window across the tokenized DOM and assert each target answer span carries question-cue + entity + city + number inside one window; lint for unresolved referents inside answer blocks; assert no H2/H3 boundary splits a Q from its answer. Caveat: exact window size/overlap differs across AI Overviews, Perplexity, and ChatGPT and drifts — engineer to the tightest plausible window so you survive all of them.",
    whyItMatters:
      "Citation happens at the chunk level under fixed-window chunking. If your answer doesn't survive an arbitrary cut, it is invisible to the answer engine no matter how well the page ranks.",
    failureIfMissing:
      "Retrievers lift fragmented or pronoun-broken slices that fail to mention the business or resolve the question; the engine cites a cleaner-chunked competitor even when your page is more complete.",
    fromPrompt: [
      "recognized by ChatGPT/agents",
      "gives Claude Code enough context to build the thing properly"
    ],
    compilesTo: [
      "graph",
      "wiki",
      "c",
      "claude",
      "blueprint"
    ],
    checkClass: "C3",
    cCandidates: [
      "sliding-window simulation: tokenize page, slide a 100-token window, assert each target answer span contains question-cue + entity + city + number within one window (deterministic)",
      "intra-chunk coreference lint: flag unresolved pronouns/definite NPs inside answer blocks (deterministic regex over a referent list, proxy)",
      "heading-break check: assert no H2/H3 boundary falls between a question heading and its answer's first sentence (deterministic DOM check)"
    ],
    unknowns: [
      "The exact chunk size/overlap each target engine (AI Overviews vs Perplexity vs ChatGPT) uses — public values are approximate and drift",
      "Whether the chosen page-builder/CMS lets answer blocks render as atomic, non-fragmented units"
    ],
    truth: "inference",
    parents: [
      "META.05",
      "SEO.118"
    ],
  },
  {
    id: "UNK.001",
    label: "Agent transactability gap: ranking and being recognized are not the same as being bookable by an agent",
    cluster: "UNK",
    depth: "L3",
    summary:
      "The intent treats \"recognized by ChatGPT/agents\" and \"converts into bookings\" as two goals; in the 2026 agentic-booking regime they collapse into one. An agent that recognizes you but cannot transact with you yields zero bookings — and worse, books the competitor it CAN transact with. When ChatGPT Agent or Google AI Mode acts, it needs a machine-readable booking surface (Reserve with Google / GBP booking action, a Calendly-class link, or a documented booking endpoint), real-time availability, and a phone that gets answered. A human-only contact form is an agentic dead end. The failure is silent and the worst kind to debug: you rank, you get cited, the agent reaches your site, hits a form it can't complete or a \"call us\" with no answer, and routes the user elsewhere — leaving the owner with traffic, no bookings, and a wrong diagnosis (\"our SEO is broken\"). The leak is at the last inch, invisible in every analytics view that stops at the visit. The user said \"recognized\" (presentation) when the market now pays for \"transactable\" (action) — the single most under-specified seam in the intent. Concretely it compiles to: a booking-surface decision node, schema.org LocalBusiness with potentialAction=ReserveAction/OrderAction targeting that surface, a real-time availability source (not hand-edited hours) wired in, and an agent-completable form (stable field names, ARIA labels, no captcha on the happy path) with a structured fallback endpoint. Cheapest deterministic guard: assert ReserveAction exists in the JSON-LD and its target URL returns 200 — but note that whether real agents *choose* to transact stays observational, and which surface a given trade's customers' agents invoke (Reserve with Google vs Booksy vs raw endpoint) varies by vertical and region.",
    whyItMatters:
      "Without a machine-readable booking path, every dollar spent on ranking and entity recognition leaks at the last inch — the agent arrives and cannot close, so visibility converts to nothing.",
    failureIfMissing:
      "Site ranks and gets cited by ChatGPT, but agents that try to book hit an unparseable form or unanswered phone and book a competitor; the owner sees traffic with no bookings and blames SEO.",
    fromPrompt: [
      "recognized by ChatGPT/agents",
      "converts attention into bookings"
    ],
    compilesTo: [
      "graph",
      "wiki",
      "c"
    ],
    checkClass: "C2",
    cCandidates: [
      "C3: assert potentialAction/ReserveAction exists in JSON-LD and its target URL returns 200 (deterministic schema + HTTP check)",
      "C2: headless-agent smoke test attempts a booking end-to-end and asserts a confirmation state — checkable but brittle across agent versions",
      "C1: whether real ChatGPT/Gemini agents actually choose to transact is observational, not a fixed predicate"
    ],
    unknowns: [
      "Which booking surface the target vertical's customers' agents actually invoke (Reserve with Google vs vertical platforms like Booksy vs raw endpoint) — varies by trade and region",
      "Whether the business has any real-time availability source at all, or runs on manual phone scheduling",
      "Whether an open, agent-facing booking protocol/standard will stabilize before launch or stay fragmented per-agent"
    ],
    truth: "residue",
    parents: [],
  },
];

export const GENERIC_EXEMPLARS: NodeSpec[] = [
  {
    id: "GEN.1",
    label: "Attention",
    cluster: "GEN",
    depth: "L3",
    summary:
      "Attention is important and you should capture it using best practices.",
    whyItMatters:
      "It matters a lot.",
    failureIfMissing:
      "Users leave.",
    fromPrompt: [],
    compilesTo: [],
    checkClass: "C2",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
  {
    id: "GEN.2",
    label: "Relevance",
    cluster: "GEN",
    depth: "L3",
    summary:
      "Make sure the page is relevant to your visitors and leverages world-class messaging.",
    whyItMatters:
      "Relevance is very important for conversions.",
    failureIfMissing:
      "The site underperforms.",
    fromPrompt: [],
    compilesTo: [],
    checkClass: "C2",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
  {
    id: "GEN.3",
    label: "Headline",
    cluster: "GEN",
    depth: "L4",
    summary:
      "Write a compelling, seamless headline that delivers quality you can trust.",
    whyItMatters:
      "A good headline helps users a lot.",
    failureIfMissing:
      "Engagement drops.",
    fromPrompt: [],
    compilesTo: [],
    checkClass: "C2",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
  {
    id: "GEN.4",
    label: "Discovery",
    cluster: "GEN",
    depth: "L5",
    summary:
      "Be discoverable by search and AI by following cutting-edge best practices.",
    whyItMatters:
      "Discoverability is important.",
    failureIfMissing:
      "Nobody finds you.",
    fromPrompt: [],
    compilesTo: [],
    checkClass: "C5",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
  {
    id: "GEN.5",
    label: "Bookings",
    cluster: "GEN",
    depth: "L3",
    summary:
      "Turn visitors into bookings by creating synergy and a game-changing experience.",
    whyItMatters:
      "Bookings are the goal and this is very important.",
    failureIfMissing:
      "Revenue suffers.",
    fromPrompt: [],
    compilesTo: [],
    checkClass: "C2",
    cCandidates: [],
    unknowns: [],
    truth: "inference",
    parents: [],
  },
];

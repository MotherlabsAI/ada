import { test } from "node:test";
import assert from "node:assert/strict";
import { assemblePackGated, type NodeSpec } from "../compile/assemble.js";
import { nodeWiki, projectWiki } from "./wiki.js";
import { wikilink, pageTarget, frontmatter, safeTarget } from "./obsidian.js";

// ── A small, real multi-node fixture with a parent → child link (ATT.004 → ATT.005)
// strong enough to clear the rubric gate (these mirror the impressive exemplars). ──

const PARENT: NodeSpec = {
  id: "ATT.004",
  label: "Attention Budget",
  cluster: "ATT",
  depth: "L4",
  summary:
    "The visitor arrives with a sub-second, depleting attention budget; the page must spend it in priority order or lose the read. The non-obvious move is to treat the first viewport as a fixed budget and rank every element by its marginal contribution to the one decision the visitor came to make, cutting anything that does not earn its pixels. The trap: designers spend the budget on brand throat-clearing (logo, slogan, hero video) before the visitor has confirmed they are in the right place, so the budget is exhausted before the load-bearing claim is even rendered.",
  whyItMatters:
    "Every downstream conversion inherits whether the first viewport spent attention on the load-bearing claim or on decoration. Get the budget order wrong and a perfectly written CTA never gets seen.",
  failureIfMissing:
    "The fold leads with decoration; the visitor's attention is spent before the value claim renders; they bounce believing the page had nothing for them.",
  fromPrompt: ["converts attention into bookings", "skeptical builder"],
  compilesTo: ["graph", "wiki", "c"],
  checkClass: "C2",
  cCandidates: [
    "Deterministic check: first-viewport DOM contains the value claim element before any decorative hero element (order check)",
  ],
  unknowns: ["The exact pixel budget for the chosen design system's fold"],
  truth: "inference",
  parents: [],
};

const CHILD: NodeSpec = {
  id: "ATT.005",
  label: "Relevance Detection",
  cluster: "ATT",
  depth: "L3",
  summary:
    'A sub-second relevance gate fires before a single word is read: "Am I in the right place for what I need, here, now?" The non-obvious move is that relevance is scored against the query the visitor just typed, so the H1 must echo the searcher\'s own language — "Emergency Plumber in Kelowna — Same-Day," not "Quality You Can Trust Since 1998." The slogan fails because it carries zero matchable tokens. The deeper point is mechanism convergence: the same place+service+intent tokens a human uses to confirm fit are the exact entities Google\'s local pack ranks on and an LLM entity-matcher binds the page to. The trap: situation-fit is not assumable — pick "emergency" when the buyer\'s real mode is "planned" and the token repels the right visitor.',
  whyItMatters:
    "Relevance detection is the gate before salience even matters — a perfectly salient CTA on a page that fails the 'right place?' check still bounces. Echoing query language is the cheapest, highest-yield headline decision.",
  failureIfMissing:
    "Headline is a brand slogan with no service/place/intent tokens; visitor cannot confirm fit in <1s, assumes wrong page, bounces; Google and the LLM also fail to bind the page to the local query.",
  fromPrompt: ["ranks in Google", "recognized by ChatGPT/agents"],
  compilesTo: ["graph", "wiki", "c"],
  checkClass: "C2",
  cCandidates: [
    "Deterministic check: H1 contains a service term AND a place term (token presence)",
    "Absence of banned slogan phrases in H1 (lint list)",
  ],
  unknowns: [
    "The exact searcher vocabulary for this trade and region (requires keyword/PAA mining, not assumable)",
  ],
  truth: "inference",
  parents: ["ATT.004"],
};

function build() {
  const { model } = assemblePackGated(
    "obsidian-fixture",
    "a marketing site that converts skeptical visitors",
    [PARENT, CHILD],
  );
  return model;
}

// Cross-link wikilinks: matches [[target]] or [[target|label]], capturing the target.
const WIKILINK = /\[\[([^\]|#^]+)(?:\|[^\]]*)?\]\]/g;
// A relative-path markdown link to a .md file — the OLD form we must not emit for cross-links.
const MD_FILE_LINK = /\]\([^)]*\.md(?:#[^)]*)?\)/g;

function targets(md: string): string[] {
  const out: string[] = [];
  for (const m of md.matchAll(WIKILINK)) out.push(m[1]!.trim());
  return out;
}

// ── helper unit tests ──────────────────────────────────────────────────────────────

test("wikilink emits [[target]] and [[target|label]] forms", () => {
  assert.equal(wikilink("ATT.005"), "[[ATT.005]]");
  assert.equal(
    wikilink("ATT.005", "Relevance Detection"),
    "[[ATT.005|Relevance Detection]]",
  );
  // label identical to target collapses to the bare form
  assert.equal(wikilink("glossary", "glossary"), "[[glossary]]");
});

test("wikilink targets/labels are sanitized so syntax can never break", () => {
  assert.equal(safeTarget("A]B|C#D^E"), "A B C D E".replace(/\s+/g, " "));
  // an illegal char in the display half does not split the link
  assert.ok(!wikilink("ID", "a|b").includes("|b]]"));
});

test("frontmatter declares aliases as a YAML list", () => {
  const fm = frontmatter(["ATT.005", "Relevance Detection"], ["ATT"]);
  assert.ok(fm.startsWith("---\n"));
  assert.ok(fm.includes("aliases:"));
  assert.ok(fm.includes('  - "ATT.005"'));
  assert.ok(fm.includes('  - "Relevance Detection"'));
  assert.ok(fm.includes("tags:"));
});

// ── node note: frontmatter alias + cross-links as wikilinks ──────────────────────────

test("node note carries a frontmatter alias (its id) and links parents via wikilink", () => {
  const model = build();
  const child = model.graph.nodes.find((n) => n.id === "ATT.005")!;
  const md = nodeWiki(child);

  // alias by node id so [[ATT.005]] resolves regardless of the wiki.md basename
  assert.ok(md.includes("aliases:"));
  assert.ok(md.includes('  - "ATT.005"'));

  // the Links section links to the parent via a wikilink, not a comma-joined id
  assert.ok(md.includes("[[ATT.004"), "child must link parent via [[...]]");
  // no relative-path .md cross-links anywhere in the node note
  assert.equal(
    md.match(MD_FILE_LINK),
    null,
    "node note must not use ](*.md) cross-links",
  );
});

// ── the index links to nodes and sections via wikilinks ──────────────────────────────

test("wiki index links to nodes and to sections via wikilinks (graph connects)", () => {
  const model = build();
  const index = model.wiki.find((w) => w.slug === "index.md")!.markdown;

  // sections are wikilinks now (no ](glossary.md))
  assert.equal(
    index.match(MD_FILE_LINK),
    null,
    "index must not use ](*.md) section links",
  );
  assert.ok(
    index.includes("[[glossary"),
    "index links the glossary section by slug",
  );

  // index → nodes: at least one node id appears as a wikilink target
  const idx = targets(index);
  assert.ok(
    idx.some((t) => model.graph.nodes.some((n) => n.id === t)),
    "index must link at least one node via [[id]]",
  );
});

// ── THE ACCEPTANCE BAR: every emitted [[target]] resolves; zero dangling wikilinks ──

test("zero dangling wikilinks across the whole pack", () => {
  const model = build();

  // The set of every target Obsidian can resolve: node ids, node labels, and the
  // alias/slug of every emitted wiki page.
  const resolvable = new Set<string>();
  for (const n of model.graph.nodes) {
    resolvable.add(n.id);
    resolvable.add(n.label);
  }
  for (const w of model.wiki) {
    resolvable.add(pageTarget(w.slug));
    resolvable.add(w.title);
  }

  // Collect every wikilink from every node note and every wiki page.
  const docs: string[] = [
    ...model.graph.nodes.map((n) => nodeWiki(n)),
    ...model.wiki.map((w) => w.markdown),
  ];

  const dangling: string[] = [];
  let total = 0;
  for (const md of docs) {
    for (const t of targets(md)) {
      total += 1;
      if (!resolvable.has(t)) dangling.push(t);
    }
  }

  assert.ok(total > 0, "the pack must emit at least one wikilink");
  assert.deepEqual(dangling, [], `dangling wikilinks: ${dangling.join(", ")}`);
});

test("graph connectivity: child note → parent note resolves to an existing node", () => {
  const model = build();
  const child = model.graph.nodes.find((n) => n.id === "ATT.005")!;
  const links = targets(nodeWiki(child));
  assert.ok(
    links.includes("ATT.004"),
    "child must link its parent ATT.004 by a resolvable wikilink target",
  );
  assert.ok(
    model.graph.nodes.some((n) => n.id === "ATT.004"),
    "the parent node exists in the pack",
  );
});

// projectWiki + writer must still produce valid markdown for Claude Code: the
// wikilinks are plain text, content is unchanged. Smoke: index still has the heading.
test("pack stays legible for Claude Code (heading + content preserved)", () => {
  const model = build();
  const pages = projectWiki(model.graph, model.seed);
  const index = pages.find((w) => w.slug === "index.md")!.markdown;
  assert.ok(index.includes("# "), "index keeps its markdown heading");
  assert.ok(index.includes("## Sections"));
});

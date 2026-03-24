# motherlabs.ai — SEO, AEO, and Indexing Strategy

**Authority:** defines how motherlabs.ai gets found, cited, and ranked — across traditional search,
AI answer engines, and developer discovery channels.
Derived from: BRAND.md, GROWTH.md, research on AEO + SEO best practices (2025–2026).

This document covers three distinct but interdependent disciplines:

- **SEO** — getting indexed and ranked in traditional search
- **AEO** — getting cited by AI answer engines (Google AI Overviews, Perplexity, ChatGPT)
- **Indexing** — the technical foundation both depend on

All three must work together. Skipping the technical foundation breaks both SEO and AEO.

---

## The Landscape in 2026

**40% of information-seeking queries now begin in an AI interface** (Gartner, January 2026).
Google AI Overview citations from top-10 ranked pages dropped from 76% to 38% between mid-2025
and early 2026 — AI systems increasingly cite pages that do NOT rank in traditional top-10.

Implication: SEO and AEO are separating. You must optimize for both independently.
A page that ranks #1 does not automatically get cited by AI. A page that gets cited by AI
does not automatically rank #1. Both require their own strategy.

---

## Part 1 — Technical Foundation

Everything else depends on this being correct. Do this before content strategy.

### 1.1 Crawlability

Google cannot index what it cannot crawl. Three things break crawlability:

- Incorrect `robots.txt` blocking Googlebot
- Canonical tags pointing to wrong URLs
- JavaScript-rendered content Google can't execute

Astro with static output avoids the JS rendering problem. Still verify:

```
robots.txt must NOT block:
  User-agent: Googlebot
  Disallow: /

robots.txt should allow everything (or not exist — no robots.txt = all allowed)
```

### 1.2 URL Consistency — The Single Most Important Technical Rule

John Mueller (Google Search Advocate, 2025): _"Consistency is the biggest technical SEO factor."_

The URL in your internal links must exactly match:

- The URL in your canonical tag
- The URL in your sitemap
- The URL in your structured data

One mismatch across these four = Google sees two different pages = diluted signals.

Concrete rule for motherlabs.ai:

```
Internal links:     https://motherlabs.ai/ada
Canonical:         <link rel="canonical" href="https://motherlabs.ai/ada" />
Sitemap:           <url><loc>https://motherlabs.ai/ada</loc></url>
Structured data:   "url": "https://motherlabs.ai/ada"
```

No trailing slashes. No http. No www unless canonical is www. Pick one and apply everywhere.

### 1.3 Sitemap

Install `@astrojs/sitemap` — generates `/sitemap-xml` on every build automatically.

```bash
pnpm --filter @motherlabs/website add @astrojs/sitemap
```

`astro.config.mjs`:

```js
import sitemap from "@astrojs/sitemap";
export default defineConfig({
  site: "https://motherlabs.ai",
  integrations: [sitemap()],
});
```

Submit to Google Search Console after every new page is published.

### 1.4 Core Web Vitals

Table stakes in 2026. Astro static output starts strong — verify:

| Metric                          | Target  | What it measures                       |
| ------------------------------- | ------- | -------------------------------------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | When the biggest visible element loads |
| INP (Interaction to Next Paint) | < 200ms | Responsiveness to user input           |
| CLS (Cumulative Layout Shift)   | < 0.1   | Visual stability — no elements jumping |

Run `pnpm build && npx lighthouse dist/index.html` locally before shipping.
The compile block in the hero (text only, no images) should score well. No external fonts loaded
synchronously. No render-blocking scripts.

### 1.5 Structured Data (JSON-LD)

JSON-LD is Google's preferred format — `<script type="application/ld+json">` in `<head>`.
It does not touch visible HTML. Easy to update. Strong signal.

Structured data increases AI Overview selection rate by **+73%** (2025 data).

**Required: SoftwareApplication schema on every page**

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Ada",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Linux",
  "url": "https://motherlabs.ai",
  "author": {
    "@type": "Person",
    "name": "Alex",
    "url": "https://motherlabs.ai/lab"
  },
  "description": "Ada closes the intent gap — the documented distance between what you describe and what AI builds. Structured requirements elicitation before Claude Code starts.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

**Add: FAQPage schema on homepage** — FAQs feed directly into AI Overview citations.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Ada by Motherlabs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ada is a requirements elicitation and context engineering tool for AI-driven software development. It closes the intent gap — the documented distance between natural language intent and what an AI agent builds. Ada produces CLAUDE.md, agents, and hooks: the structured context Claude Code reads every session."
      }
    },
    {
      "@type": "Question",
      "name": "How is Ada different from MEMORY.md?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MEMORY.md is retrospective — Claude Code writes it after observing sessions. Ada is prospective — it structures your intent before building starts. One records what happened. One encodes what you mean."
      }
    },
    {
      "@type": "Question",
      "name": "What does Ada produce?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ada produces three artifacts: CLAUDE.md (a lean context file Claude Code injects on every message turn), agents/ (specialized agents scoped to bounded contexts), and hooks/ (247 deterministic guards that enforce constraints at tool boundaries). Together they form the three-tier context architecture validated by peer-reviewed research."
      }
    },
    {
      "@type": "Question",
      "name": "What is the intent gap?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The intent gap is the documented distance between informal natural language requirements and precise program behavior. Named in academic literature (arxiv 2603.17150, Microsoft Research, March 2026). Natural language is inherently ambiguous — AI acts on its interpretation, not yours. The gap compounds as you build. Ada closes it by formalizing intent before the first file is written."
      }
    }
  ]
}
```

**Add: Organization schema on /lab**

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Motherlabs",
  "url": "https://motherlabs.ai",
  "description": "One-person AI lab. Ada is its product.",
  "foundingDate": "2024",
  "founder": {
    "@type": "Person",
    "name": "Alex"
  }
}
```

### 1.6 Page Titles and Meta Descriptions

Every page needs a distinct title containing the key differentiating phrase.
Google uses `<title>` as its primary classification signal for what the page is about.

| Page     | Title                                                                    | Meta Description                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`      | `Ada — close the intent gap before Claude Code starts \| Motherlabs`     | `Ada structures your intent into CLAUDE.md, agents, and hooks before building starts. The documented intent gap between what you describe and what gets built — Ada closes it.` |
| `/ada`   | `Ada — requirements elicitation and context engineering for Claude Code` | `Ada practices context engineering: structured elicitation → 8-stage compilation → three-tier context architecture. CLAUDE.md + agents + hooks. Built by Motherlabs.`           |
| `/lab`   | `Motherlabs — the lab that built Ada`                                    | `One-person AI lab. ~400 iterations since late 2024. Ada is what came out of it.`                                                                                               |
| `/start` | `Get started with Ada — install and first compilation`                   | `Install Ada in one command. Run your first compilation. Get CLAUDE.md, agents, and hooks for your project.`                                                                    |

### 1.7 Open Graph Tags

Required for Twitter/X, LinkedIn, Slack link previews. These are AEO signals when shared
in communities that Perplexity and other AI search engines crawl.

```html
<meta property="og:title" content="Ada — close the intent gap" />
<meta
  property="og:description"
  content="Structured requirements elicitation before Claude Code starts. The intent gap is documented. Ada closes it."
/>
<meta property="og:type" content="website" />
<meta property="og:url" content="https://motherlabs.ai" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Ada — Motherlabs" />
```

No og:image until there is a real, meaningful image. Placeholder images produce bad previews.
The terminal output block rendered as SVG is acceptable. A product screenshot is not.

### 1.8 Site Architecture — Flat

Pages accessible ≤3 clicks from homepage. Flat architecture distributes authority evenly
and makes crawling efficient.

Current structure (correct):

```
/ (homepage)
├── /ada
├── /lab
└── /start
```

When blog/docs are added:

```
/
├── /ada
├── /lab
├── /start
└── /writing
    ├── /writing/the-intent-gap
    ├── /writing/context-engineering-explained
    └── /writing/claude-md-architecture
```

No deeper than 2 levels. `/writing/category/post` = 3 levels = too deep.

### 1.9 llms.txt

A plain-text file at `https://motherlabs.ai/llms.txt` — Markdown-formatted map of
site resources for AI crawlers. Proposed by Jeremy Howard (2024). Over 844,000 sites
have implemented it (October 2025). Anthropic, Cloudflare, Stripe use it.

**Current status:** No proven correlation with AI citations. Not yet natively supported
by OpenAI, Google, or Anthropic in their primary AI products (as of 2025).

**Should Ada implement it?** Yes. Reasons:

- Low effort (one static file)
- Signals intent to be AI-readable
- Early movers benefit disproportionately if/when support arrives
- Anthropic's own docs site uses it — aligns with Claude Code's ecosystem

```markdown
# Motherlabs — Ada

> Ada closes the intent gap — structured requirements elicitation before Claude Code starts.
> Produces CLAUDE.md, agents, and hooks. Context engineering for AI-driven software development.

## Key pages

- [Homepage](https://motherlabs.ai/): what Ada is and why the intent gap matters
- [Ada product page](https://motherlabs.ai/ada): requirements elicitation, context engineering, three-tier architecture
- [Lab](https://motherlabs.ai/lab): Motherlabs origin — one person, ~400 iterations
- [Get Started](https://motherlabs.ai/start): installation and first compilation

## Optional extended context

- [llms-full.txt](https://motherlabs.ai/llms-full.txt)
```

---

## Part 2 — SEO (Traditional Search)

### 2.1 The Intent Gap Problem — Ada's SEO Position

The cold-start problem: Google associates "motherlabs" with a cannabis company and a UK
science accelerator. Neither is building developer tooling. Their advantage is age, not
relevance to the queries Ada's audience asks.

Do not compete on "motherlabs" generically. Compete on the specific queries Ada owns.

### 2.2 Topical Authority — The Dominant SEO Strategy in 2026

Google prioritizes topical authority — depth and coherence of coverage on a specific subject —
over individual page optimization. Content clusters drive ~30% more organic traffic and hold
rankings 2.5x longer than standalone pages (HireGrowth, 2025 analysis).

**Ada's pillar topic:** `the intent gap in AI-driven software development`

This is a named academic concept (arxiv 2603.17150). It is the specific problem Ada solves.
Everything Ada writes should orbit this topic.

**Pillar page:** `/ada` — comprehensive treatment of the intent gap, what causes it,
why existing tools don't close it, how Ada does.

**Cluster pages** (each linking back to /ada, /ada linking to each):

| Cluster topic                        | Target query                                                 | Why Ada can rank                                      |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------- |
| What is CLAUDE.md and why it matters | "what is CLAUDE.md" / "how to write CLAUDE.md"               | Ada produces it — exact vocabulary match              |
| The CLAUDE.md token budget           | "CLAUDE.md too long" / "CLAUDE.md best practices"            | Research-backed answer, Ada solves it architecturally |
| Hooks for Claude Code                | "claude code hooks" / "deterministic enforcement claude"     | Ada produces 247 hooks — specific claim               |
| Context engineering explained        | "context engineering LLM" / "what is context engineering"    | Formal discipline, Ada practices it                   |
| Requirements elicitation for AI      | "requirements elicitation AI tool"                           | Academic term, Ada is the implementation              |
| The vibe-to-agentic gap              | "vibe coding vs agentic coding" / "claude code context loss" | Formal research gap Ada fills                         |
| CLAUDE.md vs MEMORY.md               | "MEMORY.md vs CLAUDE.md" / "claude code persistent context"  | The retrospective/prospective distinction             |
| /init limitations                    | "claude /init doesn't work new project"                      | Ada fills the pre-code gap /init cannot               |

Each cluster page: 800–1,500 words, one specific question answered completely,
links to pillar (/ada), links to 2-3 related clusters, links to get-started (/start).

### 2.3 Queries Ada Can Own — Prioritized

**Tier 1 — Own immediately (low competition, exact vocabulary match):**

- "motherlabs ai"
- "motherlabs ada"
- "intent gap Claude Code"
- "CLAUDE.md generator from intent"

**Tier 2 — Build toward (specific, growing query, minimal competition):**

- "context engineering for Claude Code"
- "requirements elicitation AI software"
- "how to write CLAUDE.md for new project"
- "claude code loses context between sessions fix"
- "CLAUDE.md vs MEMORY.md difference"

**Tier 3 — Long game (high value, established competition):**

- "context engineering"
- "claude code CLAUDE.md"
- "requirements elicitation tool"
- "vibe coding to agentic coding"

**Never target:**

- "AI coding tool" — too broad, too competitive
- "Claude Code alternative" — Ada is not an alternative, it's a prerequisite
- "CLAUDE.md best practices" without a unique angle

### 2.4 Internal Linking Rules

Every page links to: the pillar it belongs to + 2-3 related pages + /start.
The pillar (/ada) links back to: all cluster pages it spawned.

Anchor text rule: descriptive, contains the target query phrase.

- Good: "how the intent gap compounds across sessions"
- Bad: "click here" / "read more" / "learn about Ada"

Orphaned pages (no incoming internal links) are invisible to Googlebot.
Every page published must receive at least one internal link from an existing page.

### 2.5 GitHub as SEO Surface

The GitHub repository is a high-authority domain (github.com). Content on GitHub
ranks in Google independently of the main site. Optimize:

- **Repository name:** `ada` — simple, exact match for the tool name
- **Repository description:** "Ada closes the intent gap — context engineering for Claude Code. Structured elicitation → CLAUDE.md + agents + hooks."
- **Topics:** `claude-code`, `context-engineering`, `requirements-elicitation`, `CLAUDE.md`, `ai-agents`, `llm-context`, `intent-gap`
- **README.md first 200 words:** contain the key phrases Google indexes
- **CLAUDE.md in repo root:** visible artifact — "how did this get generated?" is the hook
- **Stars/forks:** social proof + GitHub internal ranking signal

---

## Part 3 — AEO (Answer Engine Optimization)

AEO is optimizing to be cited by AI answer engines: Google AI Overviews, Perplexity,
ChatGPT, Claude.ai. These systems select content differently from how Google ranks pages.

### 3.1 The Seven Citation Factors (2025 research)

Ranked by measured impact on AI Overview citation probability:

| Factor                         | Impact                           | What it means for Ada                                                                                            |
| ------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Authoritative citations        | +132%                            | Link to arxiv papers — Ada's research foundation is citable                                                      |
| Structured data markup         | +73%                             | JSON-LD implemented (Part 1)                                                                                     |
| Semantic completeness          | 4.2× if scored 8.5+/10           | Answer the entire question on one page — no "read more"                                                          |
| E-E-A-T signals                | 96% of cited content             | Experience, Expertise, Authoritativeness, Trust                                                                  |
| Entity Knowledge Graph density | 4.8× with 15+ connected entities | Mention: Claude Code, Anthropic, CLAUDE.md, context engineering, requirements elicitation — all on the same page |
| Real-time factual verification | +89%                             | Link to verifiable sources (Anthropic docs, arxiv, GitHub issues)                                                |
| Vector embedding alignment     | r=0.84                           | Use the exact vocabulary AI systems are trained on                                                               |

### 3.2 Semantic Completeness — The Highest-Leverage AEO Factor

A page that answers a question completely, without requiring the reader to go elsewhere,
is semantically complete. AI systems strongly prefer complete answers over partial ones.

For each target query, the page must answer:

1. What is [X]?
2. Why does [X] matter?
3. How does [X] work?
4. What is [X] compared to [Y]? (the comparison the reader is already wondering)
5. What do I do next?

The FAQ schema (Part 1) is the structured implementation of semantic completeness.
Each question in the FAQ should be a query Ada can own. The answer must be complete.

### 3.3 E-E-A-T for Ada's Context

Experience: "Built by one person. ~400 iterations since late 2024." — specific, verifiable.
Expertise: Citations to academic papers (arxiv 2603.17150, 2602.20478, 2507.13334).
Authoritativeness: The GitHub repository — inspectable, real, high-authority domain.
Trust: Honest limitations stated explicitly ("not zero distance, less" / "capturing ~70% of requirements is an unsolved research problem — Ada has a coherence gate").

Every page that targets a high-value query should have:

- One author attribution (even just "Motherlabs")
- One citation to a verifiable external source
- A date or version signal (when was this written/updated)

### 3.4 Platform-Specific Citation Sources

Different AI engines weight different content sources:

**Perplexity:**

- Reddit: 46.7% of top-10 cited sources
- YouTube: 13.9%
- Developer blogs: strong signal
- Action: Post in r/ClaudeAI, r/LocalLLaMA with the exact vocabulary Ada wants cited.
  The post content — not the motherlabs.ai URL — is what Perplexity crawls.

**Google AI Overviews:**

- Prioritizes structured data, E-E-A-T, semantic completeness
- Strong preference for pages with explicit schema markup
- Cited pages earn +35% organic clicks, +91% paid clicks vs non-cited
- Action: JSON-LD implemented, FAQ schema on homepage and /ada.

**ChatGPT:**

- Bing-indexed content (ChatGPT uses Bing for web search)
- High-authority domains (GitHub, dev.to, Medium)
- Action: Publish on dev.to and Medium with links back to motherlabs.ai.

**Claude.ai:**

- Anthropic's training data and Bing web search
- Action: GitHub repo with clear README, Anthropic community posts if accessible.

### 3.5 The Academic Papers as AEO Leverage

Ada can cite arxiv papers on every page that discusses the intent gap or context engineering.
This provides:

- E-E-A-T: expertise signal — the claim is backed by peer-reviewed research
- Citation density: verifiable sources increase AI Overview selection probability by +132%
- Entity density: linking to Microsoft Research, arxiv, Anthropic creates Knowledge Graph connections

Per-page citation pattern:

> "The intent gap — the distance between natural language intent and program behavior —
> is documented in academic research. Microsoft Research named it a grand challenge
> in March 2026 ([arxiv 2603.17150](https://arxiv.org/abs/2603.17150))."

This is not just credibility. It is an AEO strategy.

### 3.6 The Video Demo as AEO Content

YouTube is Perplexity's second-largest citation source (13.9%). When the video demo ships:

- Title must contain the target query: "Ada closes the intent gap — from plain language to deployed product in 30 minutes"
- Description: first 200 words must contain: intent gap, context engineering, CLAUDE.md, requirements elicitation, Claude Code
- Chapters: timestamped — AI systems extract chapter text as searchable content
- Tags: all target vocabulary
- Link in description: motherlabs.ai, GitHub repo

### 3.7 Community as AEO Infrastructure

Community posts (Reddit, HN, dev.to) are cited by AI engines independently of the main site.
They are AEO surfaces in their own right.

**When to post:**

- HN "Show HN" — one shot, do it when the product is polished and the video demo exists
- Reddit r/ClaudeAI — the context loss discussion is ongoing; Ada answers a documented pain point
- dev.to — "Why I built Ada: the intent gap that /init can't solve" — technical, verifiable

**What to say:** Use the exact vocabulary: intent gap, context engineering, CLAUDE.md token budget,
requirements elicitation. These phrases are what AI systems extract and index.

**What not to say:** Internal vocabulary (postcodes, entropy, governor gate). These don't exist
in the AI training corpus — they produce zero AEO signal.

---

## Part 4 — Execution Priority

### Immediate (before next deploy)

1. Add `@astrojs/sitemap` — generates sitemap automatically
2. Implement JSON-LD (SoftwareApplication + FAQPage) in Layout.astro
3. Fix page titles to contain target phrases (see table in Part 1)
4. Add Open Graph tags to Layout.astro
5. Verify canonical tag on every page = sitemap URL = internal link URL
6. Create `public/llms.txt` with site map
7. Submit to Google Search Console — request indexing on all 4 URLs

### Month 1 (first content)

8. Write /ada as pillar page — complete treatment of the intent gap
   - 1,500+ words, FAQ schema, citations to arxiv papers, links to all clusters
9. Write first cluster post: "What is CLAUDE.md and why does it exist?"
   - Targets: "what is CLAUDE.md", "how to write CLAUDE.md"
   - Links back to /ada
10. Optimize GitHub repo: description, topics, README first 200 words
11. Post on dev.to: "The intent gap in Claude Code — and why /init can't fix it"
    - Links to motherlabs.ai and GitHub repo

### Month 2 (authority building)

12. Write second cluster: "Why CLAUDE.md must stay under 200 lines"
    - Cites: best practices articles + arxiv 2601.11564 (context degradation research)
13. Write third cluster: "What context engineering actually is"
    - Cites: arxiv 2507.13334 (Context Engineering Survey, 1,400 papers)
14. Post in r/ClaudeAI with the context loss framing
15. Publish video demo → YouTube optimization → submit to Search Console

### Month 3+ (compound)

16. 8-12 cluster posts orbiting the intent gap pillar
17. HN "Show HN" when product + video are polished
18. Build citations via community posts referencing the arxiv papers
19. Monthly update to the pillar page with new research or product developments

---

## What Not to Do

- Buy backlinks — Google penalty risk, would set back 6+ months
- Keyword-stuff pages — spam classification
- Create thin content faster than good content — 1 excellent cluster > 5 thin ones
- Change URLs after publishing — destroys ranking signals, break inbound links
- Use og:image as placeholder — bad previews damage social sharing AEO value
- Claim AI Overview position before earning it — AEO requires semantic completeness first

---

## Key Numbers to Know

| Signal                              | Value                               | Source                 |
| ----------------------------------- | ----------------------------------- | ---------------------- |
| 40% of queries start in AI          | Searches now begin in AI interface  | Gartner, Jan 2026      |
| AI Overview top-10 overlap          | 38% of cited pages also rank top-10 | Early 2026 data        |
| Structured data boost               | +73% AI selection rate              | 2025 AEO research      |
| Citation authority boost            | +132% AI visibility                 | 2025 AEO research      |
| Semantic completeness boost         | 4.2× if 8.5+/10 score               | 2025 AEO research      |
| CLAUDE.md token budget              | 150–200 lines before degradation    | Practitioner consensus |
| Content cluster traffic             | +30% vs standalone pages            | HireGrowth 2025        |
| Rankings held longer                | 2.5× vs standalone                  | HireGrowth 2025        |
| Reddit share of Perplexity sources  | 46.7%                               | 2025 research          |
| YouTube share of Perplexity sources | 13.9%                               | 2025 research          |

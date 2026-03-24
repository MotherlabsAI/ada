# motherlabs.ai — SEO Strategy

Derived from: SITE_CONTEXT.md
Status: Operational — execute immediately after launch.

---

## The Problem

Google currently associates "motherlabs" with two unrelated entities:

- A cannabis company
- A UK science accelerator

motherlabs.ai is brand new. Google has no signals yet to associate "Motherlabs"
with Ada, semantic compilers, or developer tooling. This is a cold-start problem,
not a penalty. Time + signals solves it.

---

## Phase 1 — Get Indexed (Week 1)

**Google Search Console**

1. Go to search.google.com/search-console
2. Add property: `https://motherlabs.ai`
3. Verify ownership via DNS TXT record (add to Porkbun, same place as ALIAS/CNAME)
   OR via HTML file upload to Cloudflare Pages public folder
4. Submit sitemap: `https://motherlabs.ai/sitemap-xml`
   (Astro generates this automatically with `@astrojs/sitemap` integration)
5. Request indexing on each URL manually:
   - https://motherlabs.ai/
   - https://motherlabs.ai/ada
   - https://motherlabs.ai/lab
   - https://motherlabs.ai/start

**Add Astro sitemap integration**

```bash
pnpm --filter @motherlabs/website add @astrojs/sitemap
```

Then in `astro.config.mjs`:

```js
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://motherlabs.ai',
  integrations: [sitemap()],
  ...
})
```

This generates `/sitemap-xml` automatically on every build.

**Expected result:** Pages indexed within 3–7 days of Search Console submission.

---

## Phase 2 — Signal What the Site Is (Week 1–2)

**Title and meta description optimization**

Google uses `<title>` and `<meta name="description">` as primary classification signals.

Current risk: if titles are generic ("Home | Motherlabs") Google won't know
what Motherlabs is. Each page title must contain the key differentiating phrase.

Target title patterns:

- Homepage: `Motherlabs — Ada, the semantic compiler for governed software`
- /ada: `Ada — semantic compiler by Motherlabs`
- /lab: `The Lab — Motherlabs origin and methodology`
- /start: `Get Started with Ada — Motherlabs`

Target description patterns (150–160 chars, accurate, no keyword stuffing):

- Homepage: `Ada translates your intent into governed software execution.
Built by Motherlabs — one person, ~400 iterations, the real thing.`

**Structured data (JSON-LD)**

Add `<script type="application/ld+json">` to Layout.astro with:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Ada",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "macOS, Linux, Windows",
  "author": {
    "@type": "Organization",
    "name": "Motherlabs",
    "url": "https://motherlabs.ai"
  },
  "description": "Ada is a semantic compiler that translates human intent into governed software execution."
}
```

This tells Google explicitly that Ada is a developer tool, not a cannabis brand.

---

## Phase 3 — Build Signals (Month 1–2)

These create the backlinks and mentions that establish domain authority.

**Owned channels (do these first — free, immediate)**

- Post on X/Twitter: "Built motherlabs.ai — this is what Ada is" + link
- Post on LinkedIn with the same framing
- Add motherlabs.ai to your GitHub profile
- Add motherlabs.ai to your Porkbun/registrar profile if public

**Community signals (high value)**

- Hacker News "Show HN" — title: "Show HN: Ada, a semantic compiler for governed software"
  Do this only when the site and product are polished. One shot.
- Product Hunt — launch when Ada CLI is ready to ship, not before
- dev.to / Hashnode post: "Why I built a compiler instead of a chatbot"
  (this is genuine writing, not marketing — matches the tone)

**Directory listings (low effort, real signal)**

- There's This Thing: ttt.studio
- Indie Hackers (post your product)
- Open Source Alternatives (if Ada has open source components)

---

## Phase 4 — Target Specific Queries (Month 2+)

The cannabis company and UK accelerator own "motherlabs" generically.
Don't compete on the bare keyword — compete on the qualified query.

**Queries where we should rank first:**

- "motherlabs ai" — our domain wins this soon after indexing
- "motherlabs ada compiler" — only one entity has this
- "ada semantic compiler" — blog/content strategy needed
- "motherlabs.ai" — direct domain search, wins immediately

**Queries to build toward (longer term):**

- "semantic compiler for software"
- "govern claude code output"
- "intent to blueprint compiler"

Content that builds these: one good technical post per month is more valuable
than 10 thin SEO articles. Write about what Ada actually does.

---

## Realistic Timeline

| Timeline  | What happens                                                                    |
| --------- | ------------------------------------------------------------------------------- |
| Day 1–3   | Sitemap submitted, Search Console verified                                      |
| Day 3–7   | Pages indexed, appear in results for "motherlabs.ai" exact match                |
| Week 2–4  | "motherlabs ai" query starts showing correct result                             |
| Month 1–2 | Community posts create first backlinks, domain authority starts building        |
| Month 3–6 | Outranking old "motherlabs" results for qualified queries                       |
| Month 6+  | "motherlabs" generic query — possible, not guaranteed, depends on link velocity |

**The honest reality:** You cannot force Google to demote established results.
You can build signals faster than they grow. The cannabis company is not actively
building developer tooling content — their advantage is age, not relevance to the
queries that matter to Ada's audience.

---

## Do Not

- Buy backlinks or use link farms — Google penalizes this, it would set back months
- Keyword-stuff pages — Google classifies it as spam
- Create thin "SEO content" — one excellent post > 20 mediocre ones
- Change the site structure frequently — URL stability is a ranking signal

---

## Implementation Priority

1. Install `@astrojs/sitemap` ← do this in the next code session
2. Update page titles to match target patterns above
3. Add JSON-LD structured data to Layout.astro
4. Verify Search Console and submit sitemap
5. Post on X and GitHub profile — same day as step 4
6. Write one HN post when the product is ready to ship

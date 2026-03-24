# motherlabs.ai — Technical Stack Decision

Derived from: SITE_CONTEXT.md + SITE_IA.md

---

## Decision: Astro 5 + Tailwind CSS + Cloudflare Pages

---

## Rationale

### Why Astro

motherlabs.ai is a content-first marketing site with 4 pages and no dynamic data.
Astro is the correct tool for this:

- Zero JS by default — pages are static HTML; JS is added per-component only where
  needed (e.g. mobile nav toggle, copy-to-clipboard on /start)
- MDX support built-in — content can be written in markdown if needed
- Component model is familiar (JSX-like) — Claude Code generates Astro components well
- Build output is optimized HTML/CSS/JS with no framework runtime shipped to the browser
- TypeScript strict mode supported out of the box
- Fast to scaffold, fast to iterate, zero configuration overhead

Next.js 15 would work but carries significant overhead for a 4-page static site:
React runtime, hydration complexity, App Router nuance. Overkill.

SvelteKit is excellent but has less training data coverage in Claude Code compared to
Astro/React — iteration would be slower.

### Why Tailwind CSS v4

- Utility-first matches a solo builder working in Claude Code — no context switching
  between component files and style files
- Design system is expressed in the markup itself — easier to iterate in place
- v4 uses native CSS cascade layers, no postcss config needed
- Works natively with Astro

### Why Cloudflare Pages

- Free tier is generous (unlimited requests, 500 builds/month)
- Git-based deploys (push to main → live in ~30s)
- Edge deployment by default — fast globally with no config
- Cloudflare Workers available later if Ada's backend needs an API endpoint on the
  same domain (e.g. /api/start or a contact form handler)
- Simpler than Vercel for a purely static site with no server functions
- motherlabs.ai domain can be managed in Cloudflare DNS in one place

Vercel is also fine. If Alex already has a Vercel account and prefers it,
switch. The site will work on either. Cloudflare is the default.

---

## What Is NOT included (and why)

- **CMS (Contentful, Sanity, etc.)** — 4 pages of content, updated by one person.
  A CMS adds a whole system for a problem that doesn't exist yet. Copy lives in
  `.astro` files or `.mdx` files. When content volume warrants it, add a CMS then.

- **Authentication** — no logged-in state on the marketing site.

- **Database** — no persistent data. Contact form submissions can go to a Cloudflare
  Worker that emails or posts to a webhook. No DB.

- **React** — Astro supports React components via `@astrojs/react` if needed for
  a specific interactive component (e.g. a terminal animation). But the default is
  Astro components only. Don't add React until a specific component requires it.

- **Animation library (Framer Motion, GSAP)** — Design direction calls for subtle,
  purposeful motion. CSS transitions handle this. No animation library at this stage.

- **Testing framework** — Not justified for a 4-page marketing site. Browser preview
  - deploy preview covers correctness adequately. If the site grows, add Playwright then.

- **Storybook** — Same rationale. One person, 4 pages. Not needed.

- **Internationalization** — English only. If Ada goes multilingual, address then.

---

## Project Location

Within the existing monorepo: `apps/website/`

This follows the monorepo pattern already established by `packages/*`.
A standalone repo (`motherlabs-site`) is also valid but adds repo management overhead.
Default: `apps/website/` in the `ada-claude` monorepo.

If Alex prefers a separate repo, create it — the stack decision is unchanged.

---

## pnpm Workspace Integration

Add `apps/*` to `pnpm-workspace.yaml` if not already present.
The website package name: `@motherlabs/website`.
Build command: `pnpm --filter @motherlabs/website build`
Dev command: `pnpm --filter @motherlabs/website dev`

---

## TypeScript Configuration

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

Matches the strict mode posture of the rest of the monorepo.

---

## Deploy Configuration (Cloudflare Pages)

`wrangler.toml` or Cloudflare dashboard:

- Build command: `pnpm build`
- Build output directory: `dist`
- Node.js version: 18 (matches monorepo constraint)
- Branch: `main` → production, `ada/bootstrap` and feature branches → preview URLs

---

## Summary Table

| Concern           | Choice                  | Rationale                           |
| ----------------- | ----------------------- | ----------------------------------- |
| Framework         | Astro 5                 | Static-first, zero JS default, fast |
| Styling           | Tailwind CSS v4         | Utility-first, no context switching |
| Hosting           | Cloudflare Pages        | Edge, free tier, same DNS as domain |
| Content authoring | .astro / .mdx files     | No CMS needed at this scale         |
| TypeScript        | strict mode             | Matches monorepo posture            |
| Testing           | deploy preview + review | Adequate for 4-page static site     |
| Location          | apps/website/           | Monorepo consistency                |

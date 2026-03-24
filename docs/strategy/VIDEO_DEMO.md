# Ada — Video Demo Strategy

**Authority:** defines approach, structure, and content for Ada's first public demo video.
All production decisions derive from this document.

---

## Purpose

Demonstrate Ada end-to-end — plain language intent to deployed working product —
in approximately 30 minutes.

The video must show:

1. Ada's elicitation in action — questions visible, answers in plain language
2. The compiled output (`CLAUDE.md`) readable on screen
3. Claude Code building from that output without manual guidance per file
4. A deployed product with immediate visual verification
5. The GitHub repo as inspectable proof of artifact quality

---

## What to Build

**A self-hosted web analytics dashboard** — Plausible Analytics alternative.

Plausible Analytics: $9–19/month hosted. Privacy-first. No cookies. GDPR compliant.
The target audience knows Plausible. Many have hit the paywall.

### Why this build

**Visual verification is immediate and personal:**
Deploy the dashboard. Visit motherlabs.ai in another tab.
The pageview appears in the dashboard in real time.
The viewer sees: described → built → working → verified.
No explanation needed. No reading code needed.

**Complexity is correctly scoped:**
Multiple interconnected concerns: data ingestion, storage, frontend charts,
tracking script (runs on external sites), dashboard auth layer.
Enough complexity that an ambiguous brief produces wrong architecture.
Enough that Ada's structure is visibly load-bearing.
Simple enough to finish and deploy in 30 minutes.

**The paid → free moment is immediate:**
Before: $9–19/month. After: self-hosted, free, owned.
This is the payoff that makes people share the video.

**GitHub output is immediately useful:**
Anyone watching can fork the repo and have free analytics on their site.
The repo is the secondary viral artifact — not the video, the repository.

---

## The Brief Alex Gives Ada

Delivered in plain language. No technical vocabulary.

> "I want to build a self-hosted web analytics tool.
> Privacy-first. No cookies. Similar to Plausible Analytics.
> I need to track pageviews, unique visitors, referrers, and top pages.
> A dashboard I can log into to see the data.
> A script tag I can add to any website to start tracking."

Ada surfaces what it needs to know from this.
Alex answers in plain language.
No framework, database, or architecture is specified in the brief.

---

## Video Structure

| Timestamp | What happens                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| 0:00      | Terminal open. Alex reads the brief aloud, types it into Ada.                                                          |
| 0–5:00    | Elicitation. Ada's questions on screen. Alex answers plainly. Show that no technical vocabulary is required to answer. |
| 5–8:00    | Ada compiles. `CLAUDE.md` opens on screen. Read key sections aloud — show it is coherent and maps to the brief.        |
| 8–10:00   | Hand off to Claude Code. CLAUDE.md already in context. Claude Code begins.                                             |
| 10–25:00  | Claude Code builds. Show key decisions — not every file. Show it following Ada's structure without detours.            |
| 25–28:00  | Deploy. Live URL appears.                                                                                              |
| 28–30:00  | Dashboard open in one tab. motherlabs.ai open in another. Pageview appears live. Pull up GitHub repo. Done.            |

---

## Verification Criteria

The video succeeds if:

- The deployed product visually matches the plain language brief
- The `CLAUDE.md` is readable on screen and clearly derived from the brief
- No moment requires the viewer to understand Ada's internals to see that it worked
- The paid → free value is visible without narration
- The GitHub repo is clean, structured, and immediately forkable

---

## GitHub Repository Requirements

The repository produced by this demo must include:

- `CLAUDE.md` — Ada's output, visible in repo root, proof of compilation
- Clean commit history showing the build progression
- A tracking script that works by adding one `<script>` tag
- Working deploy instructions — one command
- `README.md` that references Ada and links to motherlabs.ai

The repo is a marketing artifact as much as a code artifact.
It must be as clean as the video.

---

## What the Demo Proves

**About Ada:** you described something in plain language. Ada structured it.
Claude Code built it correctly without you managing the architecture per file.

**About the output:** the `CLAUDE.md` in the repo is readable. You can see
what Ada decided and trace it back to the original brief.

**About the value:** a paid tool is now free and self-hosted.
Built in 30 minutes. Starting from a plain language description.

These three things together are the argument for Ada.
No slide deck needed.

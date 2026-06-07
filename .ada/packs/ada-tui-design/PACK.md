# Ada TUI Surface — UI/UX Design Context Pack

> The recursively-excavated design problem space for Ada's own terminal surface — the
> calm, premium, earth-toned sister to Claude Code. Every node traces to live code
> (`src/tui/ink/`) or the research dossier (`docs/SURFACE-DESIGN.md`); subjective taste
> is human-gated (A4) and open questions are honest residue (Ω). One accent on calm
> neutrals, one focal point per screen, one moving thing at a time, a frame that never jumps.

- Nodes: **51** · Edges: **77** · Checks: **3** · Residue: **8**
- Areas: ROOT, IDENT, PALETTE, LAYOUT, MOTION, NAV, FLOW, STATE, A11Y, VOICE, UNK

## Layout

- `SEED.md` — root intent, known/unknown context, constraints
- `wiki/` — readable memory (start at `index.md`)
- `nodes/` — one folder per design capsule (`wiki.md` + `edges.yaml` + `export.yaml`)
- `graph.yaml` / `graph.json` / `graph.jsonld` — the world model (YAML, JSON, linked-data)
- `tokens.yaml` / `tokens.jsonld` — the design-token contract (60/30/10 roles + pigments + glyphs)
- `c/` — deterministic checks (`node c/checks/verify.mjs`)
- `exports/claude/CLAUDE.md` — the governed context an executor uses to build/refactor the surface
- `compile.mjs` — the reproducible compiler (re-run to regenerate the pack byte-for-byte)

## Formats (this is a multi-format compilation)

| format       | files                                                                                         | purpose                                                                   |
| ------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Markdown** | `SEED.md`, `PACK.md`, `wiki/*`, `nodes/**/wiki.md`, `c/C.md`, `exports/**`                    | readable memory + governed context                                        |
| **YAML**     | `graph.yaml`, `tokens.yaml`, `nodes/**/edges.yaml`, `nodes/**/export.yaml`, `c/registry.yaml` | structured, diff-friendly model                                           |
| **JSON-LD**  | `graph.jsonld`, `tokens.jsonld`                                                               | linked-data projection (`@context` vocab `motherlabs.dev/ns/ada-design#`) |
| **JSON**     | `graph.json`, `manifest.json`                                                                 | machine consumption                                                       |
| **Runnable** | `c/checks/verify.mjs`                                                                         | the deterministic floor                                                   |

## Start here

- `wiki/index.md` — the map + high-value nodes
- `wiki/data-model.md` — the token table (with measured contrast — the live defect is visible)
- `wiki/open-questions.md` — the unknown-unknowns (Ω)
- `node c/checks/verify.mjs` — see the design-lint catch a real accessibility defect

Provenance: Excavated from one intent by the Ada design compiler; every node truth-classed
(∵ source / ∴ inferred / Ω residue) with a `from` pointer (A2). Exploratory layer (A1).

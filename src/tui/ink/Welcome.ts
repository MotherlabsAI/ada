/**
 * Welcome — the COMPILED home screen. One full-window layout, calm, earth-toned:
 *
 *   ┌ banner (animated ADA wordmark + rotating star + blinking eye + greeting) ┐
 *   │  LEFT: arrow-nav menu          │  RIGHT: context sidebar                  │
 *   │  ◆ Compile an idea             │   what the highlighted item does +       │
 *   │  ◆ Open a pack                 │   relevant context (recent packs)        │
 *   │  …                             │                                          │
 *   │  YOUR PROJECTS — packs on disk with node/κ/Ω counts                       │
 *   └ live, context-sensitive key hints ──────────────────────────────────────┘
 *
 * Recognition over recall: the actions are SHOWN (not a memorized command list),
 * the sidebar narrates the focused item, and the key hints are the 3–5 keys that
 * matter right now. Colour is chrome via the earth-tone role `tokens`; meaning
 * colour (pack identity) still uses the pigment `theme`.
 *
 * MOTION (all earth-toned — the 10% accent is the only thing that moves):
 *   (a) the banner gradient slowly ramps terracotta→clay→amber and back (~250ms/step);
 *   (b) a rotating star ✶✷✸✹✺ near the banner (~180ms/step);
 *   (c) a quick ease/flash when the menu selection moves;
 *   (d) the eye blink (open ~3.8s / shut ~140ms).
 * EVERY timer is unref'd so `node --test` never hangs — in a TTY Ink's stdin
 * handle keeps the loop alive, so the animations still run.
 *
 * Authored as `.ts` with createElement (the repo excludes `.tsx`).
 */
import { createElement as h, useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { theme, tokens } from "./theme.js";
import { WORDMARK, bannerGradient } from "./art.js";
import type { PackSummary } from "./usePack.js";

/** The line under the wordmark — letter-tracked like a mark, centered under ADA. */
const SLOGAN = "C L A R I T Y   Y O U   C A N   S H I P";

/** A home action. `describe` is the one-line the sidebar shows when it's focused. */
export interface MenuItem {
  id: "compile" | "interview" | "browse" | "settings";
  label: string;
  describe: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "compile",
    label: "Compile an idea",
    describe: "Turn a sentence of intent into a governed context pack.",
  },
  {
    id: "interview",
    label: "Interview (ctx init)",
    describe: "Answer a few questions so Ada captures what you expect first.",
  },
  {
    id: "browse",
    label: "Resume last",
    describe:
      "Jump back into your most recent pack and pick up where you left off.",
  },
  {
    id: "settings",
    label: "Settings",
    describe: "Keys, colour, and shell preferences.",
  },
];

export interface WelcomeProps {
  /** The active/most-recent pack slug (highlighted; the default Open/Browse target). */
  slug: string;
  // Active-pack stats are accepted (spread from statusCounts) but the hero renders
  // per-pack figures from `packs`, not these — so they're optional, not load-bearing.
  nodes?: number;
  checks?: number;
  checkable?: number;
  gated?: number;
  residue?: number;
  clusters?: number;
  cols: number;
  rows: number;
  /** Packs on disk, for the "your projects" panel + the sidebar's recent list. */
  packs?: PackSummary[];
  /** A transient action hint (Compile / Interview / Settings) shown above the keys. */
  notice?: string | null;
  mascotName?: string;
  /** Open a pack's graph (Open / Browse). */
  onOpenPack?: (slug: string) => void;
  /** Compile flow (for now: a hint or the graph). */
  onCompile?: () => void;
  /** Interview flow → hint to run `ada ctx init`. */
  onInterview?: () => void;
  /** Settings → hint / key status. */
  onSettings?: () => void;
  /** Quit the shell. */
  onQuit?: () => void;
}

export function Welcome(p: WelcomeProps) {
  const app = useApp();
  const packs = p.packs ?? [];

  // ── State. NO idle motion (Motion Contract: no ornamental pulsing, no motion
  // without a state change). The only motion on this screen is the one-shot ease
  // when the cursor MOVES — visible cause, short duration. No timers run at rest.
  const [selected, setSelected] = useState(0); // focused menu row
  const [moved, setMoved] = useState(false); // brief ease when the cursor just moved
  const [pane, setPane] = useState<"menu" | "projects">("menu"); // which column has focus
  const [projCursor, setProjCursor] = useState(0); // focused project row

  // Selection-move ease: a single ~120ms brighten the instant focus moves, then
  // it settles. Cause = your keystroke; nothing animates on its own.
  useEffect(() => {
    if (!moved) return;
    const t = setTimeout(() => setMoved(false), 120);
    (t as { unref?: () => void }).unref?.();
    return () => clearTimeout(t);
  }, [moved]);

  // How many project rows are reachable (matches the render slice below).
  const visibleProjects = Math.min(packs.length, p.cols < 90 ? 4 : 8);

  const dispatch = (item: MenuItem) => {
    switch (item.id) {
      case "compile":
        p.onCompile?.();
        break;
      case "browse":
        // "Resume last" → open the most-recent pack straight away. (To pick a
        // different one, ⇥ / → into the projects column — that IS the chooser.)
        if (visibleProjects > 0) {
          p.onOpenPack?.(packs[0]!.slug);
        } else {
          p.onOpenPack?.(p.slug);
        }
        break;
      case "interview":
        p.onInterview?.();
        break;
      case "settings":
        p.onSettings?.();
        break;
    }
  };

  useInput((input, key) => {
    if (input === "q") return (p.onQuit ?? app.exit)();

    // ⇥ toggles which column has focus — the whole screen is navigable, not just one menu.
    if (key.tab) {
      setPane((pn) =>
        pn === "menu" ? (visibleProjects > 0 ? "projects" : "menu") : "menu",
      );
      setMoved(true);
      return;
    }

    if (pane === "projects") {
      if (key.leftArrow || key.escape) {
        setPane("menu");
        setMoved(true);
        return;
      }
      if (key.downArrow) {
        setProjCursor((i) => (i + 1) % visibleProjects);
        setMoved(true);
        return;
      }
      if (key.upArrow) {
        setProjCursor((i) => (i - 1 + visibleProjects) % visibleProjects);
        setMoved(true);
        return;
      }
      if (key.return) {
        const pk = packs[projCursor];
        if (pk) p.onOpenPack?.(pk.slug);
        return;
      }
      return;
    }

    // pane === "menu"
    if (key.rightArrow && visibleProjects > 0) {
      setProjCursor(0);
      setPane("projects");
      setMoved(true);
      return;
    }
    if (key.downArrow) {
      setSelected((i) => (i + 1) % MENU_ITEMS.length);
      setMoved(true);
      return;
    }
    if (key.upArrow) {
      setSelected((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
      setMoved(true);
      return;
    }
    if (key.return) {
      const item = MENU_ITEMS[selected];
      if (item) dispatch(item);
      return;
    }
  });

  // ── geometry: sane at ~100×40, degrades at 80×24. ──
  const narrow = p.cols < 90;
  // Short terminals: drop decorative blank rows so the banner top isn't clipped.
  const compact = p.rows < 32;
  const gapRow = (key: string) => (compact ? null : h(Text, { key }, " "));
  // A STATIC vertical gradient (step 0) — a coherent mark, not an animation.
  const grad = bannerGradient(WORDMARK.length, 0, {
    terracotta: theme.terracotta,
    clay: theme.clay,
    amber: theme.amber,
  });
  const focusItem = MENU_ITEMS[selected]!;

  // ── masthead: the ADA wordmark + tracked slogan, CENTERED across the surface ──
  const masthead = h(
    Box,
    { key: "masthead", flexDirection: "column", alignItems: "center" },
    h(
      Box,
      { flexDirection: "column", alignItems: "center" },
      ...WORDMARK.map((l, i) =>
        h(Text, { key: "w" + i, color: grad[i], bold: true }, l),
      ),
    ),
    h(Text, { key: "tag", color: tokens.textMuted }, SLOGAN),
  );

  // ── greeting: a single warm line, left-aligned under the masthead ──
  const greeting = h(
    Box,
    { key: "greet", marginTop: compact ? 0 : 1 },
    h(
      Text,
      { key: "hi", color: tokens.text, bold: true },
      "Welcome back, Alex",
    ),
  );

  // ── left: the things Ada can do for you (recognition over recall) ──
  // Focus lives in exactly one column; the active column's header brightens and
  // its cursor lights, the other dims — structure carries focus, not a colour panel
  // (structure_before_color; red is reserved for blockers, so no tinted card).
  const menuActive = pane === "menu";
  const menu = h(
    Box,
    {
      key: "menu",
      flexDirection: "column",
      flexShrink: 0,
      width: 32,
      marginRight: narrow ? 0 : 3,
    },
    h(
      Text,
      {
        key: "mh",
        color: menuActive ? tokens.text : tokens.textMuted,
        bold: true,
      },
      "MAKE & OPEN",
    ),
    gapRow("mg"),
    ...MENU_ITEMS.map((item, i) => {
      const sel = i === selected;
      const lit = sel && menuActive; // the cursor — only on the active column
      return h(
        Text,
        {
          key: "i" + i,
          backgroundColor: lit ? tokens.selection : undefined,
          color: lit
            ? moved // one-shot ease the instant you move; settles to accent
              ? tokens.accentBright
              : tokens.accent
            : sel
              ? tokens.textMuted // keeps your place while focus is on projects
              : tokens.textDim,
          bold: lit,
        },
        `${lit ? "❯" : " "} ◆ ${item.label}`,
      );
    }),
  );

  // ── right: your projects, at a glance — scope + WHERE THE OPEN WORK IS ──
  // This screen drives one decision: "which pack needs me?" So each row reads in
  // plain words the eye recognizes without decoding — `N nodes` and `N areas` =
  // scope; `N open` (residue, amber + bold) = unresolved gaps that pull your
  // attention; `clear` (dim) = nothing open. The old `κ N` was dropped: it was a
  // constant check-registry count, identical on every pack, so it could not
  // inform the choice — and a glyph the eye must decode is the opposite of native.
  type Row = ReturnType<typeof h> | null;
  const slugW = narrow ? 20 : 26;
  const projectRows: Row[] = [
    h(
      Text,
      {
        key: "ph",
        color: !menuActive ? tokens.text : tokens.textMuted,
        bold: true,
      },
      "PROJECTS",
    ),
    gapRow("pg"),
  ];
  if (packs.length) {
    packs.slice(0, narrow ? 4 : 8).forEach((pk, i) => {
      const active = pk.slug === p.slug;
      const open = pk.residue;
      // The cursor: the focused row when this column has focus (one-shot ease on move).
      const lit = !menuActive && i === projCursor;
      const slugColour = lit
        ? moved
          ? tokens.accentBright
          : tokens.accent
        : active
          ? theme.terracotta
          : tokens.textDim;
      const caret = lit ? "❯" : active ? "›" : " ";
      projectRows.push(
        h(
          Box,
          { key: "pr" + i, flexDirection: "row" },
          h(
            Box,
            { width: slugW, marginRight: 2, flexShrink: 0 },
            h(
              Text,
              {
                backgroundColor: lit ? tokens.selection : undefined,
                color: slugColour,
                bold: lit || active,
                wrap: "truncate-end",
              },
              `${caret} ◈ ${pk.slug}`,
            ),
          ),
          h(
            Text,
            {
              backgroundColor: lit ? tokens.selection : undefined,
              wrap: "truncate-end",
            },
            h(
              Text,
              { color: tokens.textMuted },
              `${pk.nodes} nodes · ${pk.clusters} clusters · `,
            ),
            open > 0
              ? h(Text, { color: tokens.accent, bold: true }, `${open} open`)
              : h(Text, { color: tokens.textMuted }, "clear"),
          ),
        ),
      );
    });
  } else {
    projectRows.push(
      h(
        Text,
        { key: "pr-none", color: tokens.textMuted },
        "  no packs yet — Compile an idea",
      ),
    );
  }
  const projects = h(
    Box,
    {
      key: "projects",
      flexDirection: "column",
      flexGrow: 1,
    },
    ...projectRows.filter(Boolean),
  );

  // ── one-line narration: what ⏎ does right now, for whatever has focus ──
  const focusPack = !menuActive ? packs[projCursor] : undefined;
  const describeText = focusPack
    ? `open ${focusPack.slug} — read its tree to verify, then hand it to your agents`
    : focusItem.describe;
  const describe = h(
    Text,
    { key: "describe", color: tokens.textDim },
    "› " + describeText,
  );

  // ── bottom: live, context-sensitive key hints (3–5 keys that matter now) ──
  const hints = !menuActive
    ? "↑/↓ pick · ⏎ open · ⇥ back · / all commands · q quit"
    : focusItem.id === "compile"
      ? "↑/↓ move · ⏎ compile · → projects · / all commands · q quit"
      : focusItem.id === "browse"
        ? "↑/↓ move · ⏎ resume last · → projects · / all commands · q quit"
        : "↑/↓ move · ⏎ pick · → projects · / all commands · q quit";

  const height = Math.max(8, p.rows - 1);
  // Actions LEFT, projects RIGHT — the two things you choose between, side by
  // side, so the horizontal space carries content instead of sitting empty.
  const middle = h(
    Box,
    {
      key: "middle",
      flexDirection: narrow ? "column" : "row",
      marginTop: compact ? 0 : 1,
    },
    menu,
    projects,
  );

  const footer: ReturnType<typeof h>[] = [];
  if (p.notice) {
    footer.push(
      h(Text, { key: "notice", color: tokens.accent }, "⇒ " + p.notice),
    );
  }
  footer.push(h(Text, { key: "hints", color: tokens.textMuted }, hints));

  return h(
    Box,
    { flexDirection: "column", height, paddingX: 1 },
    h(
      Box,
      { flexGrow: 1, flexDirection: "column" },
      masthead,
      greeting,
      middle,
      gapRow("dgap"),
      describe,
    ),
    ...footer,
  );
}

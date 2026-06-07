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
import { WORDMARK, bannerGradient, starFrame } from "./art.js";
import type { PackSummary } from "./usePack.js";

/** The line under the wordmark — the brand promise, not a category label. */
const SLOGAN = "clarity you can ship";

/** A home action. `describe` is the one-line the sidebar shows when it's focused. */
export interface MenuItem {
  id: "compile" | "open" | "interview" | "browse" | "settings";
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
    id: "open",
    label: "Open a pack",
    describe: "Open the graph for a pack you've already compiled.",
  },
  {
    id: "interview",
    label: "Interview (ctx init)",
    describe: "Answer a few questions so Ada captures what you expect first.",
  },
  {
    id: "browse",
    label: "Browse / resume",
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

  // ── Motion state. Each interval is unref'd so `node --test` never hangs. ──
  const [gradStep, setGradStep] = useState(0); // banner gradient ramp
  const [starStep, setStarStep] = useState(0); // rotating star
  const [selected, setSelected] = useState(0); // focused menu row
  const [moved, setMoved] = useState(false); // brief flash when selection moves
  const [pane, setPane] = useState<"menu" | "projects">("menu"); // which column has focus
  const [projCursor, setProjCursor] = useState(0); // focused project row

  // (a) banner gradient ramp ~250ms/step and (b) star ~180ms/step — both unref'd.
  useEffect(() => {
    const grad = setInterval(() => setGradStep((s) => s + 1), 250);
    const star = setInterval(() => setStarStep((s) => s + 1), 180);
    (grad as { unref?: () => void }).unref?.();
    (star as { unref?: () => void }).unref?.();
    return () => {
      clearInterval(grad);
      clearInterval(star);
    };
  }, []);

  // (c) selection-move ease: flash `moved` true for one short beat, then clear.
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
      case "open":
      case "browse":
        // One pack → open it straight away (nothing to choose). Several → move
        // focus INTO the projects column so you pick the exact one, not an
        // implicit "first". (⇥ or → also cross into it directly.)
        if (visibleProjects === 1) {
          p.onOpenPack?.(packs[0]!.slug);
        } else if (visibleProjects > 1) {
          setProjCursor(0);
          setPane("projects");
          setMoved(true);
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
  const grad = bannerGradient(WORDMARK.length, gradStep, {
    terracotta: theme.terracotta,
    clay: theme.clay,
    amber: theme.amber,
  });
  const focusItem = MENU_ITEMS[selected]!;

  // ── masthead: the ADA wordmark + slogan, CENTERED across the surface ──
  const masthead = h(
    Box,
    { key: "masthead", flexDirection: "column", alignItems: "center" },
    h(
      Box,
      { flexDirection: "row" },
      h(
        Box,
        { flexDirection: "column" },
        ...WORDMARK.map((l, i) =>
          h(Text, { key: "w" + i, color: grad[i], bold: true }, l),
        ),
      ),
      h(
        Text,
        { key: "star", color: tokens.accentBright },
        "  " + starFrame(starStep),
      ),
    ),
    h(Text, { key: "tag", color: tokens.accent }, SLOGAN),
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
  // its cursor lights, the other dims — so it's always clear what ↑/↓ will move.
  const menuActive = pane === "menu";
  // The focus LAMP: the one cursor breathes accent↔accentBright on the shared
  // banner clock (~1s, half-duty). The only "where focus is" motion on this screen
  // (calm_motion: one moving thing, and it names a state). No new timer — reuses
  // gradStep, so the unref'd-interval contract is untouched.
  const lampLit = gradStep % 4 < 2;
  const menu = h(
    Box,
    {
      key: "menu",
      flexDirection: "column",
      flexShrink: 0,
      width: 32,
      marginRight: narrow ? 0 : 3,
      paddingX: 1,
      // The focused column gets a bark panel behind it (common-region grouping):
      // the eye locks onto the active group instantly, and it fills the dark field.
      backgroundColor: menuActive ? tokens.surface : undefined,
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
      const lit = sel && menuActive; // the cursor "lamp" — only on the active pane
      return h(
        Text,
        {
          key: "i" + i,
          backgroundColor: lit ? tokens.selection : undefined,
          color: lit
            ? moved || lampLit
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
      "YOUR PROJECTS",
    ),
    gapRow("pg"),
  ];
  if (packs.length) {
    packs.slice(0, narrow ? 4 : 8).forEach((pk, i) => {
      const active = pk.slug === p.slug;
      const open = pk.residue;
      // The lit lamp: the focused row when this column has focus — it breathes
      // on the shared clock (lampLit), the one "where focus is" motion here.
      const lit = !menuActive && i === projCursor;
      const slugColour = lit
        ? moved || lampLit
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
      paddingX: 1,
      backgroundColor: !menuActive ? tokens.surface : undefined,
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
    : focusItem.id === "open" || focusItem.id === "browse"
      ? "↑/↓ move · → / ⏎ projects · / all commands · q quit"
      : focusItem.id === "compile"
        ? "↑/↓ move · ⏎ compile · → projects · / all commands · q quit"
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

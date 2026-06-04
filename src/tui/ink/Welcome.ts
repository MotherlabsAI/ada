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
import {
  WORDMARK,
  WORDMARK_TAG,
  bannerGradient,
  starFrame,
  mascotFrame,
  DEFAULT_MASCOT,
} from "./art.js";
import type { PackSummary } from "./usePack.js";

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
  nodes: number;
  checks: number;
  residue: number;
  clusters: number;
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

  // ── Motion state. Each interval/timeout is unref'd (see arm/armInterval). ──
  const [blink, setBlink] = useState(false);
  const [gradStep, setGradStep] = useState(0); // banner gradient ramp
  const [starStep, setStarStep] = useState(0); // rotating star
  const [selected, setSelected] = useState(0); // focused menu row
  const [moved, setMoved] = useState(false); // brief flash when selection moves

  // (d) eye blink — setTimeout chain, unref'd.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const arm = (fn: () => void, ms: number) => {
      timer = setTimeout(fn, ms);
      (timer as { unref?: () => void }).unref?.();
    };
    const open = () => {
      setBlink(false);
      arm(close, 3800);
    };
    const close = () => {
      setBlink(true);
      arm(open, 140);
    };
    arm(close, 3800);
    return () => clearTimeout(timer);
  }, []);

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

  const dispatch = (item: MenuItem) => {
    switch (item.id) {
      case "compile":
        p.onCompile?.();
        break;
      case "open":
      case "browse":
        p.onOpenPack?.(packs[0]?.slug ?? p.slug);
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
  const m = mascotFrame(p.mascotName, blink);
  const eyeColour =
    (p.mascotName ?? DEFAULT_MASCOT) === "eye" ? tokens.accent : tokens.focus;
  const focusItem = MENU_ITEMS[selected]!;

  // ── banner ──
  const banner = h(
    Box,
    { key: "banner", flexDirection: "column" },
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
    h(Text, { key: "tag", color: tokens.textMuted }, WORDMARK_TAG),
    gapRow("gap"),
    h(
      Box,
      { key: "greet", flexDirection: "row" },
      h(
        Box,
        { flexDirection: "column", marginRight: 2 },
        ...m.map((l, i) => h(Text, { key: "m" + i, color: eyeColour }, l)),
      ),
      h(
        Box,
        { flexDirection: "column" },
        h(
          Text,
          { key: "hi", color: tokens.text, bold: true },
          "Welcome back, Alex",
        ),
        h(
          Text,
          { key: "sub", color: tokens.textDim },
          "a semantic compiler for context",
        ),
      ),
    ),
  );

  // ── left: arrow-nav menu ──
  const menu = h(
    Box,
    {
      key: "menu",
      flexDirection: "column",
      flexShrink: 0,
      width: 34,
      marginRight: narrow ? 0 : 3,
    },
    h(Text, { key: "mh", color: tokens.textMuted }, "WHAT DO YOU WANT TO DO"),
    gapRow("mg"),
    ...MENU_ITEMS.map((item, i) => {
      const sel = i === selected;
      return h(
        Text,
        {
          key: "i" + i,
          backgroundColor: sel ? tokens.selection : undefined,
          color: sel
            ? moved
              ? tokens.accentBright
              : tokens.accent
            : tokens.textDim,
          bold: sel,
        },
        `${sel ? "❯" : " "} ◆ ${item.label}`,
      );
    }),
  );

  // ── right: context sidebar (what the focused item does + recent packs) ──
  const recent = packs.slice(0, 5);
  type Row = ReturnType<typeof h> | null;
  const sidebarRows: Row[] = [
    h(Text, { key: "sh", color: tokens.textMuted }, "CONTEXT"),
    gapRow("sg"),
    h(Text, { key: "sd", color: tokens.text }, focusItem.describe),
  ];
  if (focusItem.id === "open" || focusItem.id === "browse") {
    sidebarRows.push(gapRow("sg2"));
    sidebarRows.push(
      h(Text, { key: "sr", color: tokens.textMuted }, "recent packs"),
    );
    if (recent.length) {
      recent.forEach((pk, i) =>
        sidebarRows.push(
          h(
            Text,
            { key: "rp" + i, color: i === 0 ? tokens.accent : tokens.textDim },
            `  ${i === 0 ? "›" : " "} ${pk.slug}`,
          ),
        ),
      );
    } else {
      sidebarRows.push(
        h(Text, { key: "rp-none", color: tokens.textMuted }, "  (none yet)"),
      );
    }
  }
  const sidebar = h(
    Box,
    {
      key: "sidebar",
      flexDirection: "column",
      // Grow to fill remaining width only in the side-by-side (wide) layout;
      // in the stacked (narrow) layout it must not grow vertically.
      ...(narrow ? { marginTop: 1 } : { flexGrow: 1 }),
    },
    ...sidebarRows.filter(Boolean),
  );

  // ── your projects, at a glance ──
  // Fixed-width slug column (so a long slug truncates rather than colliding with
  // the counts) + a guaranteed gap before the counts column.
  const slugW = narrow ? 20 : 32;
  const projectsRows: Row[] = [
    h(Text, { key: "ph", color: tokens.textMuted }, "YOUR PROJECTS"),
  ];
  if (packs.length) {
    packs.slice(0, narrow ? 4 : 8).forEach((pk, i) => {
      const active = pk.slug === p.slug;
      projectsRows.push(
        h(
          Box,
          { key: "pr" + i, flexDirection: "row" },
          h(
            Box,
            { width: slugW },
            h(
              Text,
              {
                color: active ? theme.terracotta : tokens.textDim,
                bold: active,
                wrap: "truncate-end",
              },
              `  ◈ ${pk.slug}`,
            ),
          ),
          h(
            Text,
            { color: tokens.textMuted, wrap: "truncate-end" },
            ` ${pk.nodes} nodes · κ ${pk.checks} · Ω ${pk.residue} · ${pk.clusters} areas`,
          ),
        ),
      );
    });
  } else {
    projectsRows.push(
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
      marginTop: compact ? 0 : 1,
    },
    ...projectsRows.filter(Boolean),
  );

  // ── bottom: live, context-sensitive key hints (3–5 keys that matter now) ──
  const hints =
    focusItem.id === "open" || focusItem.id === "browse"
      ? "↑/↓ move · ⏎ open pack · / all commands · ? help · q quit"
      : focusItem.id === "compile"
        ? "↑/↓ move · ⏎ compile · / all commands · ? help · q quit"
        : "↑/↓ move · ⏎ pick · / all commands · ? help · q quit";

  const height = Math.max(8, p.rows - 1);
  const middle = h(
    Box,
    {
      key: "middle",
      flexDirection: narrow ? "column" : "row",
      marginTop: compact ? 0 : 1,
    },
    menu,
    sidebar,
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
    h(Box, { flexGrow: 1, flexDirection: "column" }, banner, middle, projects),
    ...footer,
  );
}

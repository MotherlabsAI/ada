/**
 * App — the Ink workbench. A folder-tree of the schema graph: areas (clusters) open and
 * close; opening a node fills the screen with its capsule. One pane at a time, windowed to
 * the terminal so output never exceeds the screen (Ink updates in place).
 *
 * The home menu is now OPERATIONAL — each action runs from inside the TUI:
 *   • Compile an idea → intent input → `engineCompile` (a "compiling…" working state with the
 *     rotating star) → load the new pack → graph view on its first node.
 *   • Open a pack → a pack-picker when there are several on disk; else open the one (→ graph).
 *   • Browse / resume → the most-recent pack → graph.
 *   • Settings → a read-only, value-free key/model status panel.
 *   • Interview → a clean inline note pointing at `ada ctx init` (kept out of scope here).
 *
 * The view state machine: welcome ↔ {intent → compiling → graph} · {picker → graph} · settings.
 *
 * Tree:   ↑/↓ move · → open area · ← close · ⏎ open/read · space flag · x reject · / cmd · q quit
 * Reader: Tab cycle links · ⏎ follow · ⌫ back · ↑/↓ scroll · b tree · q quit
 */
import {
  createElement as h,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Box, Text, useApp, useInput, useWindowSize } from "ink";
import type { Graph, NodeCapsule, PackManifest } from "../../core/types.js";
import { clusterOf } from "../../core/ids.js";
import { theme, tokens } from "./theme.js";
import { StatusBar } from "./StatusBar.js";
import { Welcome } from "./Welcome.js";
import { IntentInput } from "./IntentInput.js";
import { Compiling } from "./Compiling.js";
import { PackPicker } from "./PackPicker.js";
import { Settings } from "./Settings.js";
import { readSettingsStatus } from "./settingsStatus.js";
import { SlashLine, type Command } from "./SlashLine.js";
import {
  graphTree,
  readerLines,
  windowSlice,
  resolvableLinks,
  breadcrumb,
  verifyTally,
  type Line,
} from "./lines.js";
import { loadPackData, type PackState, type PackSummary } from "./usePack.js";
import { engineCompile } from "../../compile/engine/compile.js";
import { engineSeed } from "../../compile/engine/seed.js";

/** The slice of a pack the workbench renders. Either the prop pack, or a freshly compiled one. */
export interface ActivePack {
  slug: string;
  graph: Graph;
  manifest?: PackManifest;
}

/** What a compile produces for the workbench: the pack to open + the node to land on. */
export interface CompileOutcome {
  pack: ActivePack;
  /** The first node to open in the graph (a real excavated capsule, not ROOT.000). */
  firstNodeId: string;
}

/**
 * The Compile seam, injectable for tests (A1/A9: a stub means NO live call). The default runs
 * the shared `engineCompile` with the bare-intent Seed and a sensible, affordable depth, and
 * returns the freshly compiled pack the workbench opens immediately.
 */
export type CompileFn = (args: {
  cwd: string;
  slug: string;
  intent: string;
}) => Promise<CompileOutcome>;

/** A sensible default depth — affordable (few model calls/area) but enough to fill a graph. */
const DEFAULT_COMPILE_PER_CLUSTER = 3;

/** Default compile: the shared engine seam → a CompileOutcome. The model is the live default. */
const defaultCompile: CompileFn = async ({ cwd, slug, intent }) => {
  const { model, manifest, firstNodeId } = await engineCompile({
    cwd,
    slug,
    intent,
    seed: engineSeed(intent),
    opts: { perCluster: DEFAULT_COMPILE_PER_CLUSTER },
  });
  return { pack: { slug, graph: model.graph, manifest }, firstNodeId };
};

export interface AppProps {
  slug: string;
  graph: Graph;
  initialState: PackState;
  onPersist: (state: PackState) => void;
  manifest?: PackManifest;
  onExport?: (slug: string) => void;
  /** Packs on disk, for the welcome's menu sidebar + "your projects" panel + the picker. */
  packs?: PackSummary[];
  /** Working directory for compile/open (defaults to process.cwd()). */
  cwd?: string;
  /** Load a pack from disk by slug (for Open/Browse → graph). Injectable for tests. */
  loadPack?: (cwd: string, slug: string) => ActivePack;
  /** Compile seam (injectable; default drives the live `engineCompile`). */
  compile?: CompileFn;
  /** Value-free env status for the Settings panel (default reads process.env). */
  settingsStatus?: ReturnType<typeof readSettingsStatus>;
}

function statusCounts(graph: Graph, manifest?: PackManifest) {
  // The R1 scan readout (same split as the readline header in navigator.ts):
  // checkable = trust without reading, gated = your eyes (A4), Ω = open gaps.
  // Always derived from the live graph so the split is authoritative; node/cluster
  // totals prefer the manifest when present.
  const t = verifyTally(graph.nodes);
  return {
    nodes: manifest ? manifest.nodeCount : graph.nodes.length,
    checkable: t.checkable,
    gated: t.gated,
    residue: t.residue,
    clusters: manifest
      ? manifest.clusters.length
      : new Set(graph.nodes.map((n) => clusterOf(n.id))).size,
  };
}

function renderLine(l: Line, key: number) {
  // Multi-colour row: colour lives on individual spans; bgHex paints the cursor bar.
  if (l.segments) {
    return h(
      Text,
      { key, backgroundColor: l.bgHex, wrap: "truncate-end" },
      ...l.segments.map((s, i) =>
        h(
          Text,
          {
            key: i,
            color: s.colour ? theme[s.colour] : undefined,
            bold: s.bold,
            dimColor: s.dim,
          },
          s.text === "" ? " " : s.text,
        ),
      ),
    );
  }
  return h(
    Text,
    {
      key,
      color: l.colour ? theme[l.colour] : undefined,
      bold: l.bold,
      dimColor: l.dim,
      wrap: "truncate-end",
    },
    l.text === "" ? " " : l.text,
  );
}

type View =
  | "welcome"
  | "intent"
  | "compiling"
  | "picker"
  | "settings"
  | "graph";

export function App(props: AppProps) {
  const app = useApp();
  const cwd = props.cwd ?? process.cwd();
  // useWindowSize re-renders on resize (SIGWINCH) — fixes the stale-dimensions bug.
  const ws = useWindowSize();
  const rows = ws.rows || 24;
  const cols = ws.columns || 80;
  const bodyHeight = Math.max(6, rows - 4);

  const [view, setView] = useState<View>("welcome");
  // A freshly compiled / freshly opened pack overrides the prop pack everywhere below.
  const [activePack, setActivePack] = useState<ActivePack | null>(null);
  // The Compile flow: the in-flight intent, the live phase line, and any inline error.
  const [intentDraft, setIntentDraft] = useState("");
  const [phase, setPhase] = useState("proposing clusters…");
  const [compileError, setCompileError] = useState<string | null>(null);

  // The pack the workbench renders: the freshly compiled/opened one, else the prop pack.
  const active: ActivePack = activePack ?? {
    slug: props.slug,
    graph: props.graph,
    ...(props.manifest ? { manifest: props.manifest } : {}),
  };
  const graph = active.graph;
  const nodes = graph.nodes;

  // A transient one-liner the welcome shows for the Interview action (kept out of scope here).
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string>("");
  const [reading, setReading] = useState<string | null>(null);
  const [scroll, setScroll] = useState(0);
  const [linkIndex, setLinkIndex] = useState(-1);
  const [backStack, setBackStack] = useState<string[]>([]);
  const [commandMode, setCommandMode] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(
    new Set(props.initialState.flagged),
  );
  const [rejected, setRejected] = useState<Set<string>>(
    new Set(props.initialState.rejected),
  );

  const counts = useMemo(
    () => statusCounts(graph, active.manifest),
    [graph, active.manifest],
  );

  const clusterLabels = active.manifest?.clusterLabels;
  const tree = useMemo(
    () =>
      graphTree(nodes, {
        selectedRef: cursor,
        open,
        flagged,
        rejected,
        width: cols,
        ...(clusterLabels ? { clusterLabels } : {}),
      }),
    [nodes, cursor, open, flagged, rejected, cols, clusterLabels],
  );

  const readingNode: NodeCapsule | undefined = useMemo(
    () => (reading ? nodes.find((n) => n.id === reading) : undefined),
    [reading, nodes],
  );
  const links = useMemo(
    () => (readingNode ? resolvableLinks(readingNode, graph) : []),
    [readingNode, graph],
  );
  const readerData = useMemo(
    () =>
      readingNode
        ? readerLines(readingNode, cols - 2, {
            // Only show a breadcrumb when there's a REAL follow-trail — a lone id
            // just duplicates the header below it and reads as "what is this?".
            ...(backStack.length > 1 ? { crumb: breadcrumb(backStack) } : {}),
            links,
            linkIndex,
          })
        : [],
    [readingNode, cols, backStack, links, linkIndex],
  );
  const maxScroll = Math.max(0, readerData.length - bodyHeight);

  useEffect(() => {
    setScroll(0);
    setLinkIndex(-1);
  }, [reading]);

  const persist = useCallback(
    (f: Set<string>, r: Set<string>, last?: string) => {
      props.onPersist({
        flagged: [...f],
        rejected: [...r],
        ...(last ? { lastNode: last } : {}),
      });
    },
    [props],
  );
  // The node the action targets: the one being read, else the cursor (if it's a node).
  const targetId =
    reading ?? (nodes.some((n) => n.id === cursor) ? cursor : undefined);
  const flagCurrent = useCallback(() => {
    if (!targetId) return;
    setFlagged((prev) => {
      const next = new Set(prev).add(targetId);
      persist(next, rejected, targetId);
      return next;
    });
  }, [targetId, rejected, persist]);
  const rejectCurrent = useCallback(() => {
    if (!targetId) return;
    setRejected((prev) => {
      const next = new Set(prev).add(targetId);
      persist(flagged, next, targetId);
      return next;
    });
  }, [targetId, flagged, persist]);

  const openInReader = useCallback(
    (id: string) => {
      if (!nodes.some((n) => n.id === id)) return;
      setOpen((prev) => new Set(prev).add(clusterOf(id)));
      setCursor(id);
      setReading(id);
      setBackStack([id]);
    },
    [nodes],
  );

  // ── Enter the graph view on a pack, landing on a chosen node (or the first cluster). ──
  const enterGraph = useCallback((pack: ActivePack, landNode?: string) => {
    setActivePack(pack);
    setNotice(null);
    setCompileError(null);
    const first =
      landNode && pack.graph.nodes.some((n) => n.id === landNode)
        ? landNode
        : (clusterOf(pack.graph.nodes[0]?.id ?? "") ??
          pack.graph.nodes[0]?.id ??
          "");
    setOpen(landNode ? new Set([clusterOf(landNode)]) : new Set());
    setCursor(first);
    setReading(null);
    setBackStack([]);
    setView("graph");
  }, []);

  // ── Open / Browse: load a pack from disk and enter the graph. Defaults to loadPackData. ──
  const openPackBySlug = useCallback(
    (slug: string) => {
      // The pack the App was launched with is already in memory (props) — open it directly,
      // no disk re-read. Only a DIFFERENT pack (chosen in the picker) is loaded from disk.
      if (slug === props.slug && !activePack) {
        enterGraph({
          slug: props.slug,
          graph: props.graph,
          ...(props.manifest ? { manifest: props.manifest } : {}),
        });
        return;
      }
      const load =
        props.loadPack ??
        ((c: string, s: string): ActivePack => {
          const { graph, manifest } = loadPackData(c, s);
          return { slug: s, graph, manifest };
        });
      try {
        const pack = load(cwd, slug);
        enterGraph(pack);
      } catch (err) {
        setCompileError(err instanceof Error ? err.message : String(err));
        setView("welcome");
      }
    },
    [
      props.loadPack,
      props.slug,
      props.graph,
      props.manifest,
      activePack,
      cwd,
      enterGraph,
    ],
  );

  // ── Compile: drive the injected/default compile seam, showing the working state. ──
  const runCompile = useCallback(
    async (intent: string) => {
      setIntentDraft(intent);
      setCompileError(null);
      setPhase("proposing clusters…");
      setView("compiling");
      // Advance the phase line shortly after starting so the user sees motion through the
      // pipeline even when the (stubbed) compile resolves fast. Timer is unref'd.
      const t1 = setTimeout(() => setPhase("excavating the clusters…"), 350);
      const t2 = setTimeout(() => setPhase("writing the pack…"), 900);
      (t1 as { unref?: () => void }).unref?.();
      (t2 as { unref?: () => void }).unref?.();
      const compile = props.compile ?? defaultCompile;
      try {
        const slug = slugFromIntent(intent);
        const { pack, firstNodeId } = await compile({ cwd, slug, intent });
        clearTimeout(t1);
        clearTimeout(t2);
        enterGraph(pack, firstNodeId);
      } catch (err) {
        clearTimeout(t1);
        clearTimeout(t2);
        setCompileError(err instanceof Error ? err.message : String(err));
        setView("intent");
      }
    },
    [props.compile, cwd, enterGraph],
  );

  const onCommand = useCallback(
    (c: Command) => {
      switch (c.cmd) {
        case "deeper":
        case "wiki":
          openInReader(c.arg ?? targetId ?? "");
          break;
        case "flag":
          flagCurrent();
          break;
        case "reject":
          rejectCurrent();
          break;
        case "search": {
          const q = (c.arg ?? "").trim().toLowerCase();
          if (q) {
            const m = nodes.find((n) =>
              `${n.id} ${n.label} ${n.localContext.summary}`
                .toLowerCase()
                .includes(q),
            );
            if (m) {
              setOpen((prev) => new Set(prev).add(clusterOf(m.id)));
              setCursor(m.id);
            }
          }
          break;
        }
        case "export":
          props.onExport?.(active.slug);
          break;
        case "branch":
          break;
        case "quit":
          app.exit();
          break;
      }
      setCommandMode(false);
    },
    [
      openInReader,
      targetId,
      flagCurrent,
      rejectCurrent,
      nodes,
      props,
      app,
      active.slug,
    ],
  );

  useInput((input, key) => {
    if (commandMode) {
      if (key.escape) setCommandMode(false);
      return;
    }

    // The welcome / intent / compiling / picker / settings views own their own input (each is a
    // self-contained component with its own useInput); App stays out of the way so keys aren't
    // double-handled. The compiling view is non-interactive (forward motion only).
    if (view !== "graph") return;

    if (reading !== null) {
      if (key.tab) {
        if (links.length) setLinkIndex((i) => (i + 1) % links.length);
        return;
      }
      if (key.return) {
        const t = linkIndex >= 0 ? links[linkIndex] : undefined;
        if (t) {
          setBackStack((s) => [...s, t.id]);
          setReading(t.id);
        }
        return;
      }
      if (key.backspace || key.delete) {
        if (backStack.length > 1) {
          const prev = backStack[backStack.length - 2]!;
          setBackStack(backStack.slice(0, -1));
          setReading(prev);
        } else {
          setReading(null);
        }
        return;
      }
      if (key.downArrow) return setScroll((s) => Math.min(s + 1, maxScroll));
      if (key.upArrow) return setScroll((s) => Math.max(0, s - 1));
      if (key.escape || input === "b") return setReading(null);
      if (input === "q") return app.exit();
      return;
    }

    // folder-tree mode
    if (input === "/") return setCommandMode(true);
    const treeRows = tree.rows;
    const move = (d: number) => {
      const i = treeRows.findIndex((r) => r.ref === cursor);
      // Step in direction d, skipping gap spacers (they're never selectable).
      let j = (i < 0 ? 0 : i) + d;
      while (j >= 0 && j < treeRows.length && treeRows[j]?.kind === "gap")
        j += d;
      const next = treeRows[j];
      if (next && next.kind !== "gap") setCursor(next.ref);
    };
    if (key.downArrow) return move(1);
    if (key.upArrow) return move(-1);

    const row = treeRows.find((r) => r.ref === cursor);
    if (key.rightArrow || key.return) {
      if (row?.kind === "cluster") {
        setOpen((prev) => {
          const s = new Set(prev);
          if (key.return && s.has(cursor)) s.delete(cursor);
          else s.add(cursor);
          return s;
        });
      } else if (row?.kind === "node") {
        setReading(cursor);
        setBackStack([cursor]);
      }
      return;
    }
    if (key.leftArrow || key.backspace || key.delete) {
      if (row?.kind === "cluster" && open.has(cursor)) {
        setOpen((prev) => {
          const s = new Set(prev);
          s.delete(cursor);
          return s;
        });
      } else if (row?.kind === "node") {
        setCursor(clusterOf(cursor));
      }
      return;
    }
    if (input === " ") return flagCurrent();
    if (input === "x") return rejectCurrent();
    if (key.escape) return setView("welcome"); // Esc → home
    if (input === "q") return app.exit();
  });

  // ── welcome ──────────────────────────────────────────────────────────────────
  if (view === "welcome") {
    return h(Welcome, {
      slug: props.slug,
      ...statusCounts(props.graph, props.manifest),
      cols,
      rows,
      ...(props.packs ? { packs: props.packs } : {}),
      notice: compileError ? `couldn't open: ${compileError}` : notice,
      onOpenPack: (slug: string) => {
        // The welcome's projects column IS the picker now — you navigate it and
        // press ⏎ on the pack you want. Honour that slug and load it straight to
        // the graph (the separate `picker` view is kept only as a fallback path).
        setNotice(null);
        openPackBySlug(slug || props.slug);
      },
      onCompile: () => {
        setNotice(null);
        setCompileError(null);
        setView("intent");
      },
      onInterview: () =>
        setNotice(
          "interview — run `ada ctx init` in a terminal to capture expectations first",
        ),
      onSettings: () => {
        setNotice(null);
        setView("settings");
      },
      onQuit: () => app.exit(),
    });
  }

  // ── intent input (Compile, step 1) ───────────────────────────────────────────
  if (view === "intent") {
    return h(
      Box,
      { flexDirection: "column" },
      compileError
        ? h(
            Box,
            { flexDirection: "column", paddingX: 1 },
            h(Text, { color: tokens.error }, "✗ " + firstLine(compileError)),
            missingKey(compileError)
              ? h(
                  Text,
                  { color: tokens.textMuted },
                  "  set ANTHROPIC_API_KEY once: printf 'ANTHROPIC_API_KEY=sk-ant-...\\n' >> ~/.ada/.env  (then retry)",
                )
              : h(
                  Text,
                  { color: tokens.textMuted },
                  "  edit your intent and retry",
                ),
          )
        : null,
      h(IntentInput, {
        initial: intentDraft,
        onSubmit: (intent) => void runCompile(intent),
        onCancel: () => {
          setCompileError(null);
          setView("welcome");
        },
      }),
    );
  }

  // ── compiling (Compile, working state) ───────────────────────────────────────
  if (view === "compiling") {
    return h(Compiling, { intent: intentDraft, phase });
  }

  // ── pack picker (Open, several packs) ────────────────────────────────────────
  if (view === "picker") {
    return h(PackPicker, {
      packs: props.packs ?? [],
      onPick: (slug) => openPackBySlug(slug),
      onCancel: () => setView("welcome"),
    });
  }

  // ── settings ─────────────────────────────────────────────────────────────────
  if (view === "settings") {
    const st = props.settingsStatus ?? readSettingsStatus();
    return h(Settings, {
      keyAvailable: st.keyAvailable,
      model: st.model,
      modelFromEnv: st.modelFromEnv,
      slug: active.slug,
      onBack: () => setView("welcome"),
    });
  }

  // ── graph ────────────────────────────────────────────────────────────────────
  let body: Line[];
  let hint: string;
  if (reading !== null && readingNode) {
    body = readerData.slice(scroll, scroll + bodyHeight);
    const more = maxScroll > 0 ? ` · ${scroll}/${maxScroll}` : "";
    hint = `Tab cycle · ⏎ follow · ⌫ back · ↑/↓ scroll · b tree · q quit${more}`;
  } else {
    body = windowSlice(tree.rows, tree.selectedLine, bodyHeight).slice;
    hint = "↑/↓ move · → open · ← close · ⏎ read · space flag · / cmd · q quit";
  }

  return h(
    Box,
    { flexDirection: "column", paddingX: 1 },
    h(StatusBar, { slug: active.slug, ...counts }),
    // A breath under the status bar so the tree/reader isn't squeezed against it.
    h(
      Box,
      { flexDirection: "column", marginTop: 1 },
      ...body.map((l, i) => renderLine(l, i)),
    ),
    commandMode
      ? h(SlashLine, { onCommand, active: true })
      : h(Text, { color: theme.ink }, hint),
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** First line of an error message (so a long stack-ish message stays one calm line). */
function firstLine(msg: string): string {
  return (msg.split("\n")[0] ?? msg).trim();
}

/** Does this error look like the missing-key case? (so we can show the `ada key` guidance). */
function missingKey(msg: string): boolean {
  return /ANTHROPIC_API_KEY/i.test(msg);
}

/**
 * A slug derived from the intent (lowercase, dash-joined, short). Deterministic and filesystem-
 * safe; falls back to a timestamped slug if the intent has no usable word characters.
 */
function slugFromIntent(intent: string): string {
  const base = intent
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, 6)
    .join("-");
  return base || `pack-${Date.now()}`;
}

/**
 * App — the Ink workbench. A folder-tree of the schema graph: areas (clusters) open and
 * close; opening a node fills the screen with its capsule. One pane at a time, windowed to
 * the terminal so output never exceeds the screen (Ink updates in place).
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
import { theme } from "./theme.js";
import { StatusBar } from "./StatusBar.js";
import { Welcome } from "./Welcome.js";
import { SlashLine, type Command } from "./SlashLine.js";
import {
  graphTree,
  readerLines,
  windowSlice,
  resolvableLinks,
  breadcrumb,
  type Line,
} from "./lines.js";
import type { PackState } from "./usePack.js";

export interface AppProps {
  slug: string;
  graph: Graph;
  initialState: PackState;
  onPersist: (state: PackState) => void;
  manifest?: PackManifest;
  onExport?: (slug: string) => void;
}

function statusCounts(graph: Graph, manifest?: PackManifest) {
  if (manifest) {
    return {
      nodes: manifest.nodeCount,
      checks: manifest.checkCount,
      residue: manifest.residueCount,
      clusters: manifest.clusters.length,
    };
  }
  return {
    nodes: graph.nodes.length,
    checks: graph.nodes.filter((n) => n.checkability.candidates.length > 0)
      .length,
    residue: graph.nodes.filter((n) => n.truth === "residue").length,
    clusters: new Set(graph.nodes.map((n) => clusterOf(n.id))).size,
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

export function App(props: AppProps) {
  const { graph } = props;
  const nodes = graph.nodes;
  const app = useApp();
  // useWindowSize re-renders on resize (SIGWINCH) — fixes the stale-dimensions bug.
  const ws = useWindowSize();
  const rows = ws.rows || 24;
  const cols = ws.columns || 80;
  const bodyHeight = Math.max(6, rows - 4);

  const clusters = useMemo(
    () => [...new Set(nodes.map((n) => clusterOf(n.id)))],
    [nodes],
  );
  const [view, setView] = useState<"welcome" | "graph">("welcome");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string>(clusters[0] ?? "");
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
    () => statusCounts(graph, props.manifest),
    [graph, props.manifest],
  );

  const clusterLabels = props.manifest?.clusterLabels;
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
            crumb: breadcrumb(backStack),
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
          props.onExport?.(props.slug);
          break;
        case "branch":
          break;
        case "quit":
          app.exit();
          break;
      }
      setCommandMode(false);
    },
    [openInReader, targetId, flagCurrent, rejectCurrent, nodes, props, app],
  );

  useInput((input, key) => {
    if (commandMode) {
      if (key.escape) setCommandMode(false);
      return;
    }

    if (view === "welcome") {
      if (input === "q") return app.exit();
      // ⏎ or any key opens the graph (the landing's only job is to get you in).
      setView("graph");
      return;
    }

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
      const next =
        treeRows[
          Math.max(0, Math.min(treeRows.length - 1, (i < 0 ? 0 : i) + d))
        ];
      if (next) setCursor(next.ref);
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

  if (view === "welcome") {
    return h(Welcome, { slug: props.slug, ...counts, cols, rows });
  }

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
    { flexDirection: "column" },
    h(StatusBar, { slug: props.slug, ...counts }),
    h(
      Box,
      { flexDirection: "column" },
      ...body.map((l, i) => renderLine(l, i)),
    ),
    commandMode
      ? h(SlashLine, { onCommand, active: true })
      : h(Text, { color: theme.ink }, hint),
  );
}

/**
 * App — the Ink workbench. Renders ONE pane at a time (graph OR reader), windowed to
 * the terminal viewport so total output never exceeds the screen — which is what lets
 * Ink update in place instead of stacking frames on a small terminal.
 *
 * Key bindings:
 *   graph mode:   ↑/↓ move · ⏎ read · space flag · x reject · g flagged · / cmd · q quit
 *   reading mode: ↑/↓ scroll · b/esc back · q quit
 */
import {
  createElement as h,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import type { Graph, NodeCapsule, PackManifest } from "../../core/types.js";
import { clusterOf } from "../../core/ids.js";
import { theme } from "./theme.js";
import { StatusBar } from "./StatusBar.js";
import { SlashLine, type Command } from "./SlashLine.js";
import { graphLines, readerLines, windowSlice, type Line } from "./lines.js";
import type { PackState } from "./usePack.js";

export interface AppProps {
  slug: string;
  graph: Graph;
  initialState: PackState;
  onPersist: (state: PackState) => void;
  manifest?: PackManifest;
  onExport?: (slug: string) => void;
}

type Mode = "graph" | "reading";

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
  const app = useApp();
  const { stdout } = useStdout();
  const nodes = graph.nodes;

  const rows = stdout?.rows ?? 24;
  const cols = stdout?.columns ?? 80;
  // status(1) + hint(1) + slashline(1) + safety(1)
  const bodyHeight = Math.max(6, rows - 4);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("graph");
  const [scroll, setScroll] = useState(0);
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
  const selected: NodeCapsule | undefined = nodes[selectedIndex];

  const graphData = useMemo(
    () => graphLines(graph, { selectedId: selected?.id, flagged, rejected }),
    [graph, selected?.id, flagged, rejected],
  );
  const readerData = useMemo(
    () => (selected ? readerLines(selected, cols - 2) : []),
    [selected, cols],
  );
  const maxScroll = Math.max(0, readerData.length - bodyHeight);

  // Reset reader scroll whenever the reader opens or the node changes.
  useEffect(() => setScroll(0), [mode, selected?.id]);

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

  const flagCurrent = useCallback(() => {
    if (!selected) return;
    setFlagged((prev) => {
      const next = new Set(prev).add(selected.id);
      persist(next, rejected, selected.id);
      return next;
    });
  }, [selected, rejected, persist]);

  const rejectCurrent = useCallback(() => {
    if (!selected) return;
    setRejected((prev) => {
      const next = new Set(prev).add(selected.id);
      persist(flagged, next, selected.id);
      return next;
    });
  }, [selected, flagged, persist]);

  const onCommand = useCallback(
    (c: Command) => {
      switch (c.cmd) {
        case "deeper":
        case "wiki": {
          if (c.arg) {
            const idx = nodes.findIndex((n) => n.id === c.arg);
            if (idx >= 0) setSelectedIndex(idx);
          }
          setMode("reading");
          break;
        }
        case "flag":
          flagCurrent();
          break;
        case "reject":
          rejectCurrent();
          break;
        case "search": {
          const q = (c.arg ?? "").toLowerCase();
          if (q) {
            const idx = nodes.findIndex(
              (n) =>
                n.id.toLowerCase().includes(q) ||
                n.label.toLowerCase().includes(q) ||
                n.localContext.summary.toLowerCase().includes(q),
            );
            if (idx >= 0) {
              setSelectedIndex(idx);
              setMode("graph");
            }
          }
          break;
        }
        case "export":
          props.onExport?.(props.slug);
          break;
        case "branch":
          break; // reserved
        case "quit":
          app.exit();
          break;
      }
      setCommandMode(false);
    },
    [nodes, flagCurrent, rejectCurrent, props, app],
  );

  useInput((input, key) => {
    if (commandMode) {
      if (key.escape) setCommandMode(false);
      return;
    }
    if (input === "/") return setCommandMode(true);
    if (input === "q") return app.exit();

    if (mode === "reading") {
      if (key.downArrow) return setScroll((s) => Math.min(s + 1, maxScroll));
      if (key.upArrow) return setScroll((s) => Math.max(0, s - 1));
      if (key.escape || input === "b") return setMode("graph");
      return;
    }
    // graph mode
    if (key.downArrow)
      return setSelectedIndex((i) => Math.min(i + 1, nodes.length - 1));
    if (key.upArrow) return setSelectedIndex((i) => Math.max(i - 1, 0));
    if (key.return) return setMode("reading");
    if (input === " ") return flagCurrent();
    if (input === "x") return rejectCurrent();
    if (input === "g") {
      const f = nodes.findIndex((n) => flagged.has(n.id));
      if (f >= 0) setSelectedIndex(f);
      return;
    }
  });

  // Build the bounded body for the active pane.
  let body: Line[];
  let hint: string;
  if (mode === "reading") {
    body = readerData.slice(scroll, scroll + bodyHeight);
    const more = maxScroll > 0 ? `  (${scroll}/${maxScroll} ↑/↓ scroll)` : "";
    hint = `b back · q quit${more}`;
  } else {
    body = windowSlice(
      graphData.lines,
      graphData.selectedLine,
      bodyHeight,
    ).slice;
    hint =
      "↑/↓ move · ⏎ read · space flag · x reject · g flagged · / cmd · q quit";
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

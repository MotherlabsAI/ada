/**
 * App — the Ink workbench. Renders ONE pane at a time (graph OR reader), windowed to the
 * terminal viewport so output never exceeds the screen (Ink updates in place).
 *
 * Graph mode:   type to filter · ↑/↓ move · ⏎ read · Tab flag · / cmd · Esc clear/quit
 * Reading mode: Tab cycle links · ⏎ follow · ⌫ back-stack · ↑/↓ scroll · b graph · q quit
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
import {
  graphLines,
  readerLines,
  windowSlice,
  matchNode,
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
  const nodes = graph.nodes;
  const app = useApp();
  const { stdout } = useStdout();

  const rows = stdout?.rows ?? 24;
  const cols = stdout?.columns ?? 80;
  const bodyHeight = Math.max(6, rows - 4);

  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("graph");
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

  const visible = useMemo(
    () => (filter.trim() ? nodes.filter((n) => matchNode(n, filter)) : nodes),
    [nodes, filter],
  );
  const selIdx = Math.min(selectedIndex, Math.max(0, visible.length - 1));
  const selected: NodeCapsule | undefined = visible[selIdx];

  const graphData = useMemo(
    () => graphLines(visible, { selectedId: selected?.id, flagged, rejected }),
    [visible, selected?.id, flagged, rejected],
  );
  const links = useMemo(
    () => (selected ? resolvableLinks(selected, graph) : []),
    [selected, graph],
  );
  const readerData = useMemo(
    () =>
      selected
        ? readerLines(selected, cols - 2, {
            crumb: breadcrumb(backStack),
            links,
            linkIndex,
          })
        : [],
    [selected, cols, backStack, links, linkIndex],
  );
  const maxScroll = Math.max(0, readerData.length - bodyHeight);

  // Fresh node or mode → reset scroll + link highlight.
  useEffect(() => {
    setScroll(0);
    setLinkIndex(-1);
  }, [mode, selected?.id]);

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

  const openInReader = useCallback(
    (id: string) => {
      const idx = nodes.findIndex((n) => n.id === id);
      if (idx < 0) return;
      setFilter("");
      setSelectedIndex(idx);
      setMode("reading");
      setBackStack((s) =>
        s.length && s[s.length - 1] === id ? s : [...s, id],
      );
    },
    [nodes],
  );

  const onCommand = useCallback(
    (c: Command) => {
      switch (c.cmd) {
        case "deeper":
        case "wiki":
          openInReader(c.arg ?? selected?.id ?? "");
          break;
        case "flag":
          flagCurrent();
          break;
        case "reject":
          rejectCurrent();
          break;
        case "search":
          setFilter(c.arg ?? "");
          setSelectedIndex(0);
          setMode("graph");
          break;
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
    [openInReader, selected, flagCurrent, rejectCurrent, props, app],
  );

  useInput((input, key) => {
    if (commandMode) {
      if (key.escape) setCommandMode(false);
      return;
    }

    if (mode === "reading") {
      if (key.tab) {
        if (links.length) setLinkIndex((i) => (i + 1) % links.length);
        return;
      }
      if (key.return) {
        const t = linkIndex >= 0 ? links[linkIndex] : undefined;
        if (t) {
          setBackStack((s) => [...s, t.id]);
          setFilter("");
          setSelectedIndex(nodes.findIndex((n) => n.id === t.id));
        }
        return;
      }
      if (key.backspace || key.delete) {
        if (backStack.length > 1) {
          const prevId = backStack[backStack.length - 2]!;
          const idx = nodes.findIndex((n) => n.id === prevId);
          if (idx >= 0) {
            setFilter("");
            setSelectedIndex(idx);
            setBackStack(backStack.slice(0, -1));
          }
        }
        return;
      }
      if (key.downArrow) return setScroll((s) => Math.min(s + 1, maxScroll));
      if (key.upArrow) return setScroll((s) => Math.max(0, s - 1));
      if (key.escape || input === "b") return setMode("graph");
      if (input === "q") return app.exit();
      return;
    }

    // graph mode — type to filter
    if (input === "/") return setCommandMode(true);
    if (key.tab) return flagCurrent();
    if (key.return) {
      if (selected) {
        setMode("reading");
        setBackStack([selected.id]);
      }
      return;
    }
    if (key.upArrow) return setSelectedIndex((i) => Math.max(0, i - 1));
    if (key.downArrow)
      return setSelectedIndex((i) => Math.min(visible.length - 1, i + 1));
    if (key.backspace || key.delete) {
      setFilter((f) => f.slice(0, -1));
      setSelectedIndex(0);
      return;
    }
    if (key.escape) {
      if (filter) {
        setFilter("");
        setSelectedIndex(0);
      } else app.exit();
      return;
    }
    if (input && input.length === 1 && !key.ctrl && !key.meta) {
      setFilter((f) => f + input);
      setSelectedIndex(0);
    }
  });

  let body: Line[];
  let hint: string;
  if (mode === "reading") {
    body = readerData.slice(scroll, scroll + bodyHeight);
    const more = maxScroll > 0 ? ` · ${scroll}/${maxScroll}` : "";
    hint = `Tab cycle · ⏎ follow · ⌫ back · ↑/↓ scroll · b graph · q quit${more}`;
  } else if (visible.length === 0) {
    body = [{ text: `  no matches for "${filter}"`, dim: true }];
    hint = "⌫ edit · Esc clear";
  } else {
    body = windowSlice(
      graphData.lines,
      graphData.selectedLine,
      bodyHeight,
    ).slice;
    hint = filter
      ? `filter: ${filter}▌ · ↑/↓ move · ⏎ open · Tab flag · Esc clear`
      : "type to filter · ↑/↓ move · ⏎ read · Tab flag · / cmd · Esc quit";
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

/**
 * App — the Ink workbench. Owns navigation + flag/reject state and persists it
 * back to the pack's `.state.json` (via `onPersist`). The TUI is a projection:
 * it never mutates the pack, only the user-state file.
 *
 * Key bindings:
 *   ↑/↓     move selection (flat node order)
 *   enter   open the selected node in the reader (reading mode)
 *   space   flag the selected node
 *   x       reject the selected node
 *   b/esc   back to graph mode
 *   g       jump to the first flagged node
 *
 * Slash commands route through SlashLine.onCommand:
 *   deeper [id]  open the reader (id optional → current selection)
 *   flag/reject  same as space/x
 *   search <q>   select the first matching node
 *   export       fire onExport (cli shells `ada export`)
 *   quit         exit Ink
 */
import { createElement as h, useState, useMemo, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { Graph, NodeCapsule, PackManifest } from "../../core/types.js";
import { clusterOf } from "../../core/ids.js";
import { theme } from "./theme.js";
import { StatusBar } from "./StatusBar.js";
import { GraphPanel } from "./GraphPanel.js";
import { NodeReader } from "./NodeReader.js";
import { SlashLine, type Command } from "./SlashLine.js";
import type { PackState } from "./usePack.js";

export interface AppProps {
  slug: string;
  graph: Graph;
  initialState: PackState;
  onPersist: (state: PackState) => void;
  /** Optional, for accurate status counts; falls back to graph-derived values. */
  manifest?: PackManifest;
  /** Optional side-effects wired by the CLI (kept out of the pure App core). */
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
  const nodes = graph.nodes.length;
  const checks = graph.nodes.filter(
    (n) => n.checkability.candidates.length > 0,
  ).length;
  const residue = graph.nodes.filter((n) => n.truth === "residue").length;
  const clusters = new Set(graph.nodes.map((n) => clusterOf(n.id))).size;
  return { nodes, checks, residue, clusters };
}

export function App(props: AppProps) {
  const { graph } = props;
  const app = useApp();
  const nodes = graph.nodes;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("graph");
  // When true, keystrokes compose a slash command instead of driving navigation.
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
      const next = new Set(prev);
      next.add(selected.id);
      persist(next, rejected, selected.id);
      return next;
    });
  }, [selected, rejected, persist]);

  const rejectCurrent = useCallback(() => {
    if (!selected) return;
    setRejected((prev) => {
      const next = new Set(prev);
      next.add(selected.id);
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
          // Reserved for the branch-creation flow (deferred slice).
          break;
        case "quit":
          app.exit();
          break;
      }
      // A dispatched command always returns control to navigation.
      setCommandMode(false);
    },
    [nodes, flagCurrent, rejectCurrent, props, app],
  );

  useInput((input, key) => {
    // While composing a command, SlashLine owns the keystrokes — App only
    // listens for Esc to abort back to navigation.
    if (commandMode) {
      if (key.escape) setCommandMode(false);
      return;
    }
    if (input === "/") {
      setCommandMode(true);
      return;
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(i + 1, nodes.length - 1));
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (key.return) {
      setMode("reading");
      return;
    }
    if (key.escape) {
      setMode("graph");
      return;
    }
    if (input === " ") {
      flagCurrent();
      return;
    }
    if (input === "x") {
      rejectCurrent();
      return;
    }
    if (input === "b") {
      setMode("graph");
      return;
    }
    if (input === "g") {
      const firstFlagged = nodes.findIndex((n) => flagged.has(n.id));
      if (firstFlagged >= 0) setSelectedIndex(firstFlagged);
      return;
    }
    if (input === "q") {
      app.exit();
      return;
    }
  });

  const right =
    mode === "reading" && selected
      ? h(NodeReader, { node: selected })
      : h(
          Box,
          { flexDirection: "column" },
          h(Text, { color: theme.ink }, "  select a node and press ⏎ to read"),
          selected
            ? h(
                Text,
                { color: theme.ink },
                `  ⟡ ${selected.localContext.summary}`,
              )
            : null,
        );

  return h(
    Box,
    { flexDirection: "column" },
    h(StatusBar, { slug: props.slug, ...counts }),
    h(
      Box,
      { flexDirection: "row" },
      h(
        Box,
        { flexDirection: "column", marginRight: 2 },
        h(GraphPanel, {
          graph,
          selectedId: selected?.id,
          flagged,
          rejected,
        }),
      ),
      h(Box, { flexDirection: "column" }, right),
    ),
    h(SlashLine, { onCommand, active: commandMode }),
  );
}

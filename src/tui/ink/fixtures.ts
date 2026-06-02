/**
 * Test fixtures for the Ink workbench. Hand-built NodeCapsules/Graph so component
 * tests never depend on the full showcase compiler. Kept under src/tui/ink so it
 * lives inside the track's ownership boundary.
 *
 * NOTE: imported only by *.test.ts files; harmless if shipped in dist.
 */
import type {
  Graph,
  NodeCapsule,
  Colour,
  Glyph,
  Depth,
  CheckClass,
} from "../../core/types.js";

export function makeNode(p: {
  id: string;
  label: string;
  colour?: Colour;
  glyph?: Glyph;
  graphSymbol?: string;
  depth?: Depth;
  check?: CheckClass;
  summary?: string;
  why?: string;
  failure?: string;
  candidates?: string[];
  unknowns?: string[];
  compileTargets?: NodeCapsule["role"]["compileTargets"];
  parents?: string[];
  children?: string[];
  siblings?: string[];
  dependsOn?: string[];
  exportsTo?: string[];
  guardedBy?: string[];
}): NodeCapsule {
  const cluster = p.id.includes(".") ? p.id.slice(0, p.id.indexOf(".")) : p.id;
  const glyph: Glyph = p.glyph ?? "◇";
  return {
    id: p.id,
    label: p.label,
    glyph,
    colour: p.colour ?? "clay",
    status: "draft",
    depth: p.depth ?? "L2",
    truth: "inference",
    role: {
      cluster,
      nodeType: "node",
      compileTargets: p.compileTargets ?? ["graph", "wiki"],
    },
    localContext: {
      summary: p.summary ?? `${p.label} summary.`,
      whyItMatters: p.why ?? `${p.label} matters.`,
      failureIfMissing: p.failure ?? `${p.label} missing failure.`,
    },
    worldLinks: {
      parents: p.parents ?? [],
      children: p.children ?? [],
      siblings: p.siblings ?? [],
      dependsOn: p.dependsOn ?? [],
      exportsTo: p.exportsTo ?? [],
      guardedBy: p.guardedBy ?? [],
    },
    epistemics: {
      claimClass: "design",
      confidence: "medium",
      sourceStatus: "inferred",
      assumptions: [],
      unknowns: p.unknowns ?? [],
    },
    checkability: {
      class: p.check ?? "C3",
      explanation: "Deterministic predicate is possible.",
      candidates: p.candidates ?? [],
    },
    ui: {
      visibleBadges: [],
      graphSymbol: p.graphSymbol ?? `${glyph}`,
      openPriority: "medium",
    },
    quality: {
      gateStatus: "passed",
      genericnessScore: "low",
      actionEnablementScore: "high",
    },
  };
}

/** A 3-node, 2-cluster graph (ATT.004, ATT.005, PRO.001). */
export function fixtureGraph(): Graph {
  return {
    id: "fixture",
    version: "0",
    packSlug: "fixture",
    nodes: [
      makeNode({
        id: "ATT.004",
        label: "Selected attribute",
        colour: "plum",
        graphSymbol: "◇ ∴ κ",
        candidates: ["attr_exists"],
        unknowns: ["pricing units"],
        compileTargets: ["graph", "wiki", "blueprint"],
        parents: ["ROOT.001"],
        children: ["PRO.001"],
        dependsOn: ["ATT.005"],
        exportsTo: ["CONTEXT.md"],
        guardedBy: ["GOV.001"],
      }),
      makeNode({
        id: "ATT.005",
        label: "Sibling attribute",
        colour: "clay",
        graphSymbol: "◇",
      }),
      makeNode({
        id: "PRO.001",
        label: "A process node",
        colour: "deep_blue",
        graphSymbol: "◆",
      }),
    ],
    edges: [],
  };
}

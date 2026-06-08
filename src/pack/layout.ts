/** Filesystem layout for a pack (spec §12, AXIOM A5). Pure path computation. */
import { join } from "node:path";
import { clusterOf, nodeDirName } from "../core/ids.js";
import type { NodeCapsule } from "../core/types.js";

export function packsRoot(cwd: string): string {
  return join(cwd, ".ada", "packs");
}

export function packDir(cwd: string, slug: string): string {
  return join(packsRoot(cwd), slug);
}

export function paths(cwd: string, slug: string) {
  const root = packDir(cwd, slug);
  return {
    root,
    seed: join(root, "SEED.md"),
    pack: join(root, "PACK.md"),
    manifest: join(root, "manifest.json"),
    graphJson: join(root, "graph.json"),
    graphYaml: join(root, "graph.yaml"),
    nodesDir: join(root, "nodes"),
    wikiDir: join(root, "wiki"),
    cDir: join(root, "c"),
    cRegistry: join(root, "c", "registry.yaml"),
    cDoc: join(root, "c", "C.md"),
    cChecksDir: join(root, "c", "checks"),
    cReportsDir: join(root, "c", "reports"),
    exportsDir: join(root, "exports"),
    claudeDir: join(root, "exports", "claude"),
    claudeSkillsDir: join(root, "exports", "claude", "skills", "ada-context"),
    claudeAgentsDir: join(root, "exports", "claude", "agents"),
    claudePromptsDir: join(root, "exports", "claude", "prompts"),
    blueprintDir: join(root, "exports", "blueprint"),
    copilotDir: join(root, "exports", "copilot"),
    mcpDir: join(root, "exports", "mcp"),
    openaiDir: join(root, "exports", "openai-agents"),
  };
}

/** nodes/<CLUSTER>/<NNN-slug>/ for a given node. */
export function nodeDir(cwd: string, slug: string, node: NodeCapsule): string {
  const cluster = clusterOf(node.id);
  // The cluster prefix is the one path segment that bypasses slugify; assert it is
  // path-safe so a malformed id can never escape the nodes/ directory.
  if (!/^[A-Za-z0-9]+$/.test(cluster)) {
    throw new Error(`Unsafe cluster prefix in node id "${node.id}".`);
  }
  return join(
    paths(cwd, slug).nodesDir,
    cluster,
    nodeDirName(node.id, node.label),
  );
}

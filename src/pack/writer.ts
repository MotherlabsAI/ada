/** Writes a PackModel to disk as the full .ada/packs/<slug>/ tree (spec §12, AXIOM A5). */
import { mkdir, writeFile, rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  PackModel,
  PackManifest,
  NodeCapsule,
  Edge,
} from "../core/types.js";
import { toJson, toYaml } from "../core/serialize.js";
import { clusterOf } from "../core/ids.js";
import { TRUTH_GLYPH, CHECK_LABEL } from "../core/grammar.js";
import { paths, nodeDir } from "./layout.js";
import { nodeWiki } from "./wiki.js";
import { emitChecks, registryYaml, cDoc } from "../c/emit.js";
import { CHECK_FILES } from "../c/checkSources.js";
import { claudeExports } from "../export/claude.js";
import { settingsExports } from "../export/settings.js";
import { assertBackingHonest } from "../export/coherence.js";
import { blueprintExports } from "../export/blueprint.js";
import { pomExport } from "../export/pom.js";
import { autonomyContractExport } from "../export/autonomy.js";
import { agentChartersExport } from "../export/agents.js";
import { toolContractsExport } from "../export/tools.js";
import { evidenceLedgerExport } from "../export/evidence.js";
import { memoryPolicyExport } from "../export/memory.js";
import { copilotExports } from "../export/copilot.js";
import { mcpExports } from "../export/mcp.js";
import { openaiExports } from "../export/openai.js";
import { exportManifestArtifact } from "../export/manifest.js";

function manifestOf(model: PackModel): PackManifest {
  const clusters = [...new Set(model.graph.nodes.map((n) => clusterOf(n.id)))];
  return {
    slug: model.slug,
    product: "Ada by Motherlabs",
    schemaVersion: model.graph.version,
    createdNote: model.provenance,
    nodeCount: model.graph.nodes.length,
    edgeCount: model.graph.edges.length,
    checkCount: CHECK_FILES.length,
    residueCount: model.seed.unknownContext.length,
    clusters,
    // Carry the proposed area registry as DATA (P7) when present; restricted to the clusters
    // actually in this pack, so the manifest stays a faithful projection. Omitted entirely
    // when the model has none (showcase / pre-P7 packs fall back to the built-in label map).
    ...(model.clusterLabels
      ? {
          clusterLabels: Object.fromEntries(
            clusters
              .filter((c) => model.clusterLabels?.[c])
              .map((c) => [c, model.clusterLabels![c]!]),
          ),
        }
      : {}),
  };
}

function edgesFor(model: PackModel, id: string): Edge[] {
  return model.graph.edges.filter((e) => e.from === id || e.to === id);
}

function seedMd(model: PackModel): string {
  const s = model.seed;
  const block = (label: string, items: string[]) =>
    [`## ${label}`, ...items.map((i) => `- ${i}`), ""].join("\n");
  return [
    "# ⟦ SEED ⟧",
    "",
    `**Root intent.** ${s.rootIntent}`,
    "",
    `**Domain.** ${s.domain}`,
    `**User role.** ${s.userRole}`,
    "",
    `**Build objective.** ${s.buildObjective}`,
    `**Knowledge objective.** ${s.knowledgeObjective}`,
    `**Trust objective.** ${s.trustObjective}`,
    "",
    block("Known context", s.knownContext),
    block("Unknown context (residue)", s.unknownContext),
    block("Assumptions", s.assumptions),
    block("Sources", s.sources),
    block("Constraints", s.constraints),
    block("Risks", s.risks),
    `> Provenance: ${model.provenance}`,
    "",
  ].join("\n");
}

function packMd(model: PackModel, m: PackManifest): string {
  return [
    `# ${model.seed.domain}`,
    "",
    `> ${model.seed.rootIntent}`,
    "",
    `- Nodes: **${m.nodeCount}** · Edges: **${m.edgeCount}** · Checks: **${m.checkCount}** · Residue: **${m.residueCount}**`,
    `- Clusters: ${m.clusters.join(", ")}`,
    "",
    "## Layout",
    "- `wiki/` — readable memory (start at `index.md`)",
    "- `nodes/` — one folder per context capsule",
    "- `c/` — deterministic checks (`node c/checks/verify.mjs`)",
    "- `exports/claude/` — CLAUDE.md, skill, subagents, prompts",
    "- `exports/blueprint/` — the deterministic build contract",
    "",
    `Provenance: ${model.provenance}`,
    "",
  ].join("\n");
}

function nodeCard(node: NodeCapsule): string {
  const c = node.checkability;
  return [
    `# ${node.ui.graphSymbol} ${node.id} — ${node.label}`,
    "",
    `- cluster: ${node.role.cluster} · depth: ${node.depth} · truth: ${TRUTH_GLYPH[node.truth]} ${node.truth}`,
    `- checkability: ${c.class} (${CHECK_LABEL[c.class]})`,
    `- compiles to: ${node.role.compileTargets.join(", ")}`,
    "",
    `**Summary.** ${node.localContext.summary}`,
    "",
    `**Why.** ${node.localContext.whyItMatters}`,
    "",
    `**Failure if missing.** ${node.localContext.failureIfMissing}`,
    "",
    "See `wiki.md` for the full article, `edges.yaml` for links, `checkability.yaml` for checks.",
    "",
  ].join("\n");
}

/**
 * Atomic-ish pack replace (INVARIANT.002, production-ready). The previous pack must stay the
 * canonical one until the new pack is FULLY written: a crash or thrown error mid-write must
 * never leave a half-written, corrupt pack on disk. So we move the existing pack aside to a
 * `.bak`, write the fresh one into the real root, and only on success drop the backup — on any
 * failure we remove the partial and restore the previous pack intact, then rethrow. (A directory
 * rename on one filesystem is atomic; the brief gap is covered by the recoverable `.bak`.)
 */
export async function atomicReplace(
  root: string,
  write: () => Promise<void>,
): Promise<void> {
  const bak = `${root}.bak`;
  await rm(bak, { recursive: true, force: true }); // clear a stale backup from a prior crash
  const hadPrevious = existsSync(root);
  if (hadPrevious) await rename(root, bak);
  try {
    await write();
    if (hadPrevious) await rm(bak, { recursive: true, force: true });
  } catch (err) {
    await rm(root, { recursive: true, force: true }); // drop the partial
    if (hadPrevious) await rename(bak, root); // restore the canonical previous pack
    throw err;
  }
}

export async function writePack(
  cwd: string,
  model: PackModel,
): Promise<PackManifest> {
  const p = paths(cwd, model.slug);
  // Fail BEFORE touching disk: a duplicate id would desync the manifest (kept here, pre-transaction).
  const preIds = model.graph.nodes.map((n) => n.id);
  const preDupes = [
    ...new Set(preIds.filter((id, i) => preIds.indexOf(id) !== i)),
  ];
  if (preDupes.length) {
    throw new Error(
      `Duplicate node ids would collide on disk: ${preDupes.join(", ")}`,
    );
  }
  let manifest!: PackManifest;
  await atomicReplace(p.root, async () => {
    manifest = await writePackBody(cwd, model, p);
  });
  return manifest;
}

async function writePackBody(
  cwd: string,
  model: PackModel,
  p: ReturnType<typeof paths>,
): Promise<PackManifest> {
  for (const d of [
    p.root,
    p.wikiDir,
    p.cChecksDir,
    p.cReportsDir,
    p.claudeDir,
    p.blueprintDir,
  ]) {
    await mkdir(d, { recursive: true });
  }

  // Node directories are addressed by id; a duplicate id would silently overwrite
  // another node and desync the manifest. Fail loudly before writing anything.
  const ids = model.graph.nodes.map((n) => n.id);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dupes.length) {
    throw new Error(
      `Duplicate node ids would collide on disk: ${dupes.join(", ")}`,
    );
  }

  const manifest = manifestOf(model);
  await writeFile(p.seed, seedMd(model), "utf8");
  await writeFile(p.graphJson, toJson(model.graph), "utf8");
  await writeFile(p.graphYaml, toYaml(model.graph), "utf8");
  await writeFile(p.manifest, toJson(manifest), "utf8");
  await writeFile(p.pack, packMd(model, manifest), "utf8");
  // The self-describing index of the whole emitted family (§22 EXPORT_MANIFEST), at the root.
  const em = exportManifestArtifact(model);
  await writeFile(join(p.root, em.path), em.content, "utf8");

  for (const node of model.graph.nodes) {
    const dir = nodeDir(cwd, model.slug, node);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "NODE.md"), nodeCard(node), "utf8");
    await writeFile(join(dir, "wiki.md"), nodeWiki(node), "utf8");
    await writeFile(
      join(dir, "context.yaml"),
      toYaml({
        role: node.role,
        localContext: node.localContext,
        epistemics: node.epistemics,
      }),
      "utf8",
    );
    await writeFile(
      join(dir, "edges.yaml"),
      toYaml(edgesFor(model, node.id)),
      "utf8",
    );
    await writeFile(
      join(dir, "checkability.yaml"),
      toYaml(node.checkability),
      "utf8",
    );
    await writeFile(
      join(dir, "export.yaml"),
      toYaml({
        compileTargets: node.role.compileTargets,
        exportsTo: node.worldLinks.exportsTo,
      }),
      "utf8",
    );
    await writeFile(join(dir, "quality.yaml"), toYaml(node.quality), "utf8");
  }

  for (const w of model.wiki) {
    await writeFile(join(p.wikiDir, w.slug), w.markdown, "utf8");
  }

  const shipsRunnable = model.shipsRunnableChecks === true;
  await emitChecks(p.cChecksDir, shipsRunnable);
  await writeFile(p.cRegistry, registryYaml(model, shipsRunnable), "utf8");
  await writeFile(p.cDoc, cDoc(model, shipsRunnable), "utf8");

  // The executor bundle: the context files (claude) + the enforced-governance layer
  // (settings.json + hooks, brick 7). Both land under `.claude/`; both pass the A2 guard.
  const claudeFiles = [...claudeExports(model), ...settingsExports(model)];
  // A2 coherence guard (fail-closed): a pack must never claim a runnable-check
  // backing it does not ship. Assert over the whole executor bundle before writing.
  const bundle = claudeFiles.map((f) => f.content).join("\n");
  const verdict = assertBackingHonest(bundle, shipsRunnable);
  if (!verdict.honest) {
    throw new Error(
      `A2 coherence violation in executor export: ${verdict.reason}`,
    );
  }
  for (const f of claudeFiles) {
    const dest = join(p.claudeDir, f.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content, "utf8");
  }
  for (const f of [
    ...blueprintExports(model),
    pomExport(model),
    autonomyContractExport(model),
    agentChartersExport(model),
    toolContractsExport(model),
    evidenceLedgerExport(model),
    memoryPolicyExport(model),
  ]) {
    const dest = join(p.blueprintDir, f.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content, "utf8");
  }
  // Multi-target reach (the family beyond Claude): GitHub Copilot repo instructions.
  for (const f of copilotExports(model)) {
    const dest = join(p.copilotDir, f.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content, "utf8");
  }
  // …and the open protocol: MCP resources + tools, mountable by any MCP-speaking client.
  for (const f of mcpExports(model)) {
    const dest = join(p.mcpDir, f.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content, "utf8");
  }
  // …and the OpenAI Agents SDK shape: agents + handoffs + guardrails.
  for (const f of openaiExports(model)) {
    const dest = join(p.openaiDir, f.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, f.content, "utf8");
  }

  return manifest;
}

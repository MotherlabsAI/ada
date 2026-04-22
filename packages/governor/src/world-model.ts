import type { Blueprint } from "@ada/compiler";
import * as fs from "fs";
import * as path from "path";

// ── Relevant Topic Selection ───────────────────────────────────────────────
// Mirrors Claude Code's findRelevantMemories pattern.
// Selects which .ada/topics/*.json files are most relevant to the current
// blueprint using keyword matching (no LLM call needed at typical topic scale).

export interface RelevantTopic {
  readonly name: string;
  readonly filePath: string;
  readonly score: number;
}

/**
 * Find the most relevant topic files for a given blueprint context.
 * Returns up to maxResults topics ordered by keyword-match score.
 * Excludes _session-patterns.json (always loaded separately).
 */
export function findRelevantTopics(
  adaDir: string,
  blueprint: Blueprint,
  maxResults = 3,
): RelevantTopic[] {
  const topicsDir = path.join(adaDir, "topics");
  if (!fs.existsSync(topicsDir)) return [];

  // Build a bag-of-words from the blueprint for scoring
  const blueprintText = [
    blueprint.summary,
    ...blueprint.dataModel.entities.map((e) => e.name),
    ...blueprint.dataModel.boundedContexts.map((c) => c.name),
    ...blueprint.architecture.components.map((c) => c.name),
    ...blueprint.nonFunctional.map((c) => c.requirement),
  ]
    .join(" ")
    .toLowerCase();

  const topics: RelevantTopic[] = [];

  for (const f of fs.readdirSync(topicsDir)) {
    if (!f.endsWith(".json") || f === "_session-patterns.json") continue;
    const name = path.basename(f, ".json");
    const filePath = path.join(topicsDir, f);

    // Score by: how many times the context name appears in blueprint text
    // + how many entity names from the topic appear in the blueprint
    let score = 0;
    const nameLower = name.toLowerCase();

    // Direct name match — strongest signal
    const nameMatches = (blueprintText.match(new RegExp(nameLower, "g")) ?? [])
      .length;
    score += nameMatches * 3;

    // Entity names from topic file
    try {
      const topic = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
        entities?: { name: string }[];
      };
      for (const entity of topic.entities ?? []) {
        const entityLower = entity.name.toLowerCase();
        if (blueprintText.includes(entityLower)) score += 1;
      }
    } catch {
      // unreadable topic — skip scoring from content
    }

    if (score > 0) {
      topics.push({ name, filePath, score });
    }
  }

  return topics.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/**
 * Load the content of relevant topic files and format as a context block
 * suitable for inclusion in a blueprint summary or system prompt.
 */
export function buildTopicContext(topics: RelevantTopic[]): string {
  if (topics.length === 0) return "";
  const blocks: string[] = ["## Relevant World Model Topics\n"];
  for (const topic of topics) {
    try {
      const content = fs.readFileSync(topic.filePath, "utf8");
      blocks.push(`### ${topic.name}\n\`\`\`json\n${content.trim()}\n\`\`\``);
    } catch {
      // unreadable — skip
    }
  }
  return blocks.join("\n\n");
}

// ── Layer 1: World Model Index ─────────────────────────────────────────────
// A < 200-line markdown file always present at .ada/world-model-index.md.
// Contains pointers, not content. Mirrors Claude Code's MEMORY.md pattern.

export function generateWorldModelIndex(blueprint: Blueprint): string {
  const timestamp = new Date().toISOString();
  const projectName = blueprint.summary.split(".")[0]?.trim() ?? "Ada Project";

  const lines: string[] = [];
  lines.push(`# World Model — ${projectName}`);
  lines.push(`Generated: ${timestamp}`);
  lines.push(`Blueprint: .ada/state.json | IR chain: .ada/ir-chain.json`);
  lines.push("");

  // Bounded Contexts section
  lines.push("## Bounded Contexts");
  const contexts = blueprint.dataModel.boundedContexts;
  if (contexts.length > 0) {
    for (const ctx of contexts) {
      lines.push(
        `- ${ctx.name} — ${ctx.rootEntity} — .ada/topics/${ctx.name}.json`,
      );
    }
  } else {
    lines.push("- (no bounded contexts in blueprint)");
  }
  lines.push("");

  // Active Invariants section — up to 10 most critical
  lines.push("## Active Invariants");
  const allInvariants: string[] = [];
  for (const ctx of contexts) {
    for (const inv of ctx.invariants) {
      allInvariants.push(inv.predicate);
    }
  }
  // Also pull entity-level invariants
  for (const entity of blueprint.dataModel.entities) {
    for (const inv of entity.invariants) {
      allInvariants.push(inv.predicate);
    }
  }
  const topInvariants = allInvariants.slice(0, 10);
  if (topInvariants.length > 0) {
    for (const pred of topInvariants) {
      lines.push(`- ${pred}`);
    }
  } else {
    lines.push("- (no invariants defined)");
  }
  lines.push("");

  // Session State section — placeholder; updated by mergeSessionDelta
  lines.push("## Session State");
  lines.push("- Last session: .ada/sessions/(none yet)");
  lines.push("- Drift alerts: .ada/drift-alerts.jsonl");
  lines.push("- Confidence: (no session completed yet)");
  lines.push("");

  // Open Questions section
  lines.push("## Open Questions");
  const questions = blueprint.openQuestions;
  if (questions.length > 0) {
    for (const q of questions) {
      lines.push(`- ${q}`);
    }
  } else {
    lines.push("- (no open questions)");
  }

  return lines.join("\n") + "\n";
}

export function mergeSessionDelta(
  adaDir: string,
  insights?: SessionInsights,
): void {
  const indexPath = path.join(adaDir, "world-model-index.md");
  const deltaPath = path.join(adaDir, "world-model-delta.json");

  // Skip silently if index doesn't exist — will be created at next compile
  if (!fs.existsSync(indexPath)) return;
  // Skip silently if delta doesn't exist
  if (!fs.existsSync(deltaPath)) return;

  let delta: {
    sessionEnd?: number;
    driftCount?: number;
    finalConfidence?: number;
    durationMs?: number;
  };
  try {
    delta = JSON.parse(fs.readFileSync(deltaPath, "utf8")) as typeof delta;
  } catch {
    return;
  }

  let content: string;
  try {
    content = fs.readFileSync(indexPath, "utf8");
  } catch {
    return;
  }

  // Find the latest archived session log
  const sessionsDir = path.join(adaDir, "sessions");
  let latestSession = "(none yet)";
  if (fs.existsSync(sessionsDir)) {
    const files = fs
      .readdirSync(sessionsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .sort()
      .reverse();
    if (files.length > 0) {
      latestSession = `.ada/sessions/${files[0]}`;
    }
  }

  const confidence =
    delta.finalConfidence != null
      ? `${Math.round(delta.finalConfidence * 100)}%`
      : "(unknown)";

  const driftLine =
    insights != null && insights.driftCount > 0
      ? `- Drift: ${insights.driftCount} signal${insights.driftCount === 1 ? "" : "s"}`
      : "";

  const recurringLine =
    insights != null && insights.criticalDriftLocations.length > 0
      ? `- Critical locations: ${insights.criticalDriftLocations.slice(0, 3).join(", ")}`
      : "";

  const sessionBlockLines = [
    "## Session State",
    `- Last session: ${latestSession}`,
    "- Drift alerts: .ada/drift-alerts.jsonl",
    `- Confidence: ${confidence}`,
  ];
  if (driftLine) sessionBlockLines.push(driftLine);
  if (recurringLine) sessionBlockLines.push(recurringLine);
  sessionBlockLines.push("");

  const newSessionBlock = sessionBlockLines.join("\n");

  // Replace the existing ## Session State block
  const sessionBlockPattern = /## Session State\n(?:- [^\n]*\n)*\n?/;

  const updated = sessionBlockPattern.test(content)
    ? content.replace(sessionBlockPattern, newSessionBlock)
    : content + "\n" + newSessionBlock;

  try {
    fs.writeFileSync(indexPath, updated, "utf8");
  } catch {
    // Best-effort — never crash on persistence failure
  }
}

export function writeWorldModelIndex(
  adaDir: string,
  blueprint: Blueprint,
): void {
  const indexPath = path.join(adaDir, "world-model-index.md");
  const content = generateWorldModelIndex(blueprint);
  try {
    fs.writeFileSync(indexPath, content, "utf8");
  } catch {
    // Best-effort
  }
}

// ── Layer 2: Topic Files ───────────────────────────────────────────────────
// One JSON file per bounded context at .ada/topics/{contextName}.json.
// Contains the full entity definitions for that context.

export interface TopicFile {
  readonly contextName: string;
  readonly rootEntity: string;
  readonly entities: readonly {
    readonly name: string;
    readonly category: string;
    readonly properties: readonly {
      name: string;
      type: string;
      required: boolean;
    }[];
    readonly invariants: readonly string[];
  }[];
  readonly generatedAt: number;
}

export function generateTopicFiles(
  blueprint: Blueprint,
): Map<string, TopicFile> {
  const result = new Map<string, TopicFile>();
  const { boundedContexts, entities } = blueprint.dataModel;

  // Build a lookup map for entities by name
  const entityByName = new Map(entities.map((e) => [e.name, e]));

  for (const ctx of boundedContexts) {
    const ctxEntities = ctx.entities
      .map((name) => entityByName.get(name))
      .filter((e): e is NonNullable<typeof e> => e != null)
      .map((e) => ({
        name: e.name,
        category: e.category,
        properties: e.properties.map((p) => ({
          name: p.name,
          type: p.type,
          required: p.required,
        })),
        invariants: e.invariants.map((inv) => inv.predicate),
      }));

    const topicFile: TopicFile = {
      contextName: ctx.name,
      rootEntity: ctx.rootEntity,
      entities: ctxEntities,
      generatedAt: Date.now(),
    };

    result.set(ctx.name, topicFile);
  }

  return result;
}

export function writeTopicFiles(adaDir: string, blueprint: Blueprint): void {
  const topicsDir = path.join(adaDir, "topics");
  if (!fs.existsSync(topicsDir)) {
    fs.mkdirSync(topicsDir, { recursive: true });
  }

  const topicFiles = generateTopicFiles(blueprint);
  for (const [contextName, topicFile] of topicFiles) {
    const filePath = path.join(topicsDir, `${contextName}.json`);
    try {
      fs.writeFileSync(
        filePath,
        JSON.stringify(topicFile, null, 2) + "\n",
        "utf8",
      );
    } catch {
      // Best-effort
    }
  }
}

// ── Session Insight Extraction ─────────────────────────────────────────────
// Inspired by Claude Code's extractMemories pattern: structured extraction of
// governance facts from the session log. No LLM call needed — the governance
// events are already typed.

export interface SessionInsights {
  readonly sessionId: string;
  readonly durationMs: number;
  readonly finalConfidence: number;
  readonly driftCount: number;
  readonly criticalDriftLocations: readonly string[];
  readonly toolsObserved: readonly string[];
  readonly contentBlockCount: number;
  readonly extractedAt: number;
}

export interface SessionPatterns {
  readonly totalSessions: number;
  readonly avgFinalConfidence: number;
  readonly recurringDriftLocations: readonly {
    location: string;
    count: number;
  }[];
  readonly commonTools: readonly { tool: string; count: number }[];
  readonly lastUpdated: number;
}

/**
 * Extract structured governance insights from an archived session log.
 * Reads the JSONL file produced by teeEvents() in run.ts.
 */
export function extractSessionInsights(
  archivedLogPath: string,
  delta: {
    durationMs?: number;
    finalConfidence?: number;
    driftCount?: number;
    criticalDrifts?: readonly { location: string; detail: string }[];
  },
): SessionInsights {
  const toolsObserved = new Set<string>();
  let contentBlockCount = 0;

  // Parse the session log for tool names and content block counts
  try {
    const raw = fs.readFileSync(archivedLogPath, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line) as {
          event?: {
            type?: string;
            tool_name?: string;
          };
        };
        const evt = entry.event;
        if (!evt) continue;
        if (evt.type === "content_block_start") {
          contentBlockCount++;
        }
        if (evt.type === "tool_use" && typeof evt.tool_name === "string") {
          toolsObserved.add(evt.tool_name);
        }
      } catch {
        // malformed line — skip
      }
    }
  } catch {
    // session log not readable — return minimal insights
  }

  const sessionId = path.basename(archivedLogPath, ".jsonl");
  return {
    sessionId,
    durationMs: delta.durationMs ?? 0,
    finalConfidence: delta.finalConfidence ?? 1.0,
    driftCount: delta.driftCount ?? 0,
    criticalDriftLocations: (delta.criticalDrifts ?? []).map((d) => d.location),
    toolsObserved: Array.from(toolsObserved),
    contentBlockCount,
    extractedAt: Date.now(),
  };
}

/**
 * Accumulate session insights into the cross-session patterns file.
 * Written to .ada/topics/_session-patterns.json — picked up by governor
 * and MCP server for drift trend awareness.
 */
export function updateSessionPatterns(
  adaDir: string,
  insights: SessionInsights,
): void {
  const topicsDir = path.join(adaDir, "topics");
  const patternsPath = path.join(topicsDir, "_session-patterns.json");

  let prior: {
    totalSessions?: number;
    confidenceSum?: number;
    driftLocationCounts?: Record<string, number>;
    toolCounts?: Record<string, number>;
    lastUpdated?: number;
  } = {};

  // Load existing patterns if present
  if (fs.existsSync(patternsPath)) {
    try {
      prior = JSON.parse(fs.readFileSync(patternsPath, "utf8")) as typeof prior;
    } catch {
      // Corrupt file — start fresh
    }
  }

  const totalSessions = (prior.totalSessions ?? 0) + 1;
  const confidenceSum = (prior.confidenceSum ?? 0) + insights.finalConfidence;

  // Accumulate drift location counts
  const driftLocationCounts: Record<string, number> = {
    ...(prior.driftLocationCounts ?? {}),
  };
  for (const loc of insights.criticalDriftLocations) {
    driftLocationCounts[loc] = (driftLocationCounts[loc] ?? 0) + 1;
  }

  // Accumulate tool counts
  const toolCounts: Record<string, number> = {
    ...(prior.toolCounts ?? {}),
  };
  for (const tool of insights.toolsObserved) {
    toolCounts[tool] = (toolCounts[tool] ?? 0) + 1;
  }

  // Build readable patterns for the MCP surface
  const recurringDriftLocations = Object.entries(driftLocationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const commonTools = Object.entries(toolCounts)
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const patterns: SessionPatterns & {
    totalSessions: number;
    confidenceSum: number;
    driftLocationCounts: Record<string, number>;
    toolCounts: Record<string, number>;
  } = {
    totalSessions,
    confidenceSum,
    avgFinalConfidence: Math.round((confidenceSum / totalSessions) * 100) / 100,
    recurringDriftLocations,
    commonTools,
    driftLocationCounts,
    toolCounts,
    lastUpdated: Date.now(),
  };

  if (!fs.existsSync(topicsDir)) {
    fs.mkdirSync(topicsDir, { recursive: true });
  }

  try {
    fs.writeFileSync(
      patternsPath,
      JSON.stringify(patterns, null, 2) + "\n",
      "utf8",
    );
  } catch {
    // Best-effort
  }
}

// ── Session Consolidation ──────────────────────────────────────────────────
// autoDream equivalent: reads all archived sessions + patterns and writes
// a rich summary to world-model-index.md. No LLM call needed.

export interface ConsolidateResult {
  readonly sessionsProcessed: number;
  readonly totalToolEvents: number;
  readonly topTools: readonly { tool: string; count: number }[];
  readonly topDriftLocations: readonly { location: string; count: number }[];
  readonly avgConfidence: number;
  readonly sessionsPruned: number;
}

export interface ConsolidateOptions {
  readonly pruneOlderThanDays?: number; // delete sessions older than N days (default: no pruning)
  readonly verbose?: boolean;
}

/**
 * Consolidate all archived sessions into the world model index.
 * Reads .ada/sessions/*.jsonl + .ada/topics/_session-patterns.json,
 * produces a rich Session State section in world-model-index.md.
 */
export function consolidateSessions(
  adaDir: string,
  options: ConsolidateOptions = {},
): ConsolidateResult {
  const sessionsDir = path.join(adaDir, "sessions");
  const indexPath = path.join(adaDir, "world-model-index.md");
  const patternsPath = path.join(adaDir, "topics", "_session-patterns.json");

  // Load accumulated patterns (the truth source for confidence + drift)
  let patterns: {
    totalSessions?: number;
    avgFinalConfidence?: number;
    recurringDriftLocations?: { location: string; count: number }[];
    commonTools?: { tool: string; count: number }[];
    lastUpdated?: number;
  } = {};
  if (fs.existsSync(patternsPath)) {
    try {
      patterns = JSON.parse(
        fs.readFileSync(patternsPath, "utf8"),
      ) as typeof patterns;
    } catch {
      // Corrupt — use empty
    }
  }

  // Count and sort session files
  let sessionFiles: { name: string; tsMs: number }[] = [];
  if (fs.existsSync(sessionsDir)) {
    sessionFiles = fs
      .readdirSync(sessionsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => {
        const tsMs = parseInt(path.basename(f, ".jsonl"), 10);
        return { name: f, tsMs: isNaN(tsMs) ? 0 : tsMs };
      })
      .sort((a, b) => b.tsMs - a.tsMs);
  }

  // Scan each session JSONL for tool event counts (supplement patterns data)
  const toolCounts: Record<string, number> = {};
  let totalToolEvents = 0;
  for (const { name } of sessionFiles) {
    const filePath = path.join(sessionsDir, name);
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      for (const line of raw.split("\n")) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line) as {
            event?: {
              type?: string;
              content_block?: { type?: string; name?: string };
            };
          };
          const evt = entry.event;
          if (
            evt?.type === "content_block_start" &&
            evt.content_block?.type === "tool_use"
          ) {
            const name_tool = evt.content_block.name ?? "unknown";
            toolCounts[name_tool] = (toolCounts[name_tool] ?? 0) + 1;
            totalToolEvents++;
          }
        } catch {
          // malformed line
        }
      }
    } catch {
      // unreadable session — skip
    }
  }

  // Merge scanned tool counts with patterns (patterns are the source of truth for aggregates)
  const topTools =
    (patterns.commonTools ?? []).length > 0
      ? patterns.commonTools!
      : Object.entries(toolCounts)
          .map(([tool, count]) => ({ tool, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

  const topDriftLocations = patterns.recurringDriftLocations ?? [];
  const avgConfidence = patterns.avgFinalConfidence ?? 1.0;
  const totalSessions = Math.max(
    patterns.totalSessions ?? 0,
    sessionFiles.length,
  );

  // Prune old sessions
  let sessionsPruned = 0;
  if (options.pruneOlderThanDays != null && options.pruneOlderThanDays > 0) {
    const cutoffMs = Date.now() - options.pruneOlderThanDays * 24 * 3600 * 1000;
    for (const { name, tsMs } of sessionFiles) {
      if (tsMs > 0 && tsMs < cutoffMs) {
        try {
          fs.unlinkSync(path.join(sessionsDir, name));
          sessionsPruned++;
        } catch {
          // best-effort
        }
      }
    }
  }

  // Write enriched Session State section to world-model-index.md
  if (fs.existsSync(indexPath)) {
    try {
      let content = fs.readFileSync(indexPath, "utf8");

      const latestSession = sessionFiles[0]
        ? `.ada/sessions/${sessionFiles[0].name}`
        : "(none yet)";

      const confPct = Math.round(avgConfidence * 100);
      const topDriftStr = topDriftLocations
        .slice(0, 3)
        .map((d) => `${d.location} (×${d.count})`)
        .join(", ");
      const topToolStr = topTools
        .slice(0, 5)
        .map((t) => `${t.tool} (${t.count})`)
        .join(", ");

      const newSessionBlock = [
        "## Session State",
        `- Total sessions: ${totalSessions}`,
        `- Last session: ${latestSession}`,
        `- Avg confidence: ${confPct}%`,
        ...(topDriftStr ? [`- Recurring drift: ${topDriftStr}`] : []),
        ...(topToolStr ? [`- Common tools: ${topToolStr}`] : []),
        "- Drift alerts: .ada/drift-alerts.jsonl",
        "",
      ].join("\n");

      const sessionBlockPattern = /## Session State\n(?:- [^\n]*\n)*\n?/;
      const updated = sessionBlockPattern.test(content)
        ? content.replace(sessionBlockPattern, newSessionBlock)
        : content + "\n" + newSessionBlock;

      fs.writeFileSync(indexPath, updated, "utf8");
    } catch {
      // best-effort
    }
  }

  return {
    sessionsProcessed: sessionFiles.length,
    totalToolEvents,
    topTools,
    topDriftLocations,
    avgConfidence,
    sessionsPruned,
  };
}

/**
 * Delete session archive files older than keepDays. Returns count deleted.
 */
export function pruneOldSessions(adaDir: string, keepDays: number): number {
  const sessionsDir = path.join(adaDir, "sessions");
  if (!fs.existsSync(sessionsDir)) return 0;

  const cutoffMs = Date.now() - keepDays * 24 * 3600 * 1000;
  let pruned = 0;

  for (const f of fs
    .readdirSync(sessionsDir)
    .filter((f) => f.endsWith(".jsonl"))) {
    const tsMs = parseInt(path.basename(f, ".jsonl"), 10);
    if (!isNaN(tsMs) && tsMs < cutoffMs) {
      try {
        fs.unlinkSync(path.join(sessionsDir, f));
        pruned++;
      } catch {
        // best-effort
      }
    }
  }
  return pruned;
}

// ── Layer 3: Session Archive ───────────────────────────────────────────────

export function archiveSessionLog(adaDir: string): string | null {
  const sessionLogPath = path.join(adaDir, "session-log.jsonl");

  // If file doesn't exist, nothing to archive
  if (!fs.existsSync(sessionLogPath)) return null;

  let content: string;
  try {
    content = fs.readFileSync(sessionLogPath, "utf8");
  } catch {
    return null;
  }

  // If empty, skip archive
  if (content.trim().length === 0) {
    try {
      fs.unlinkSync(sessionLogPath);
    } catch {
      // best-effort
    }
    return null;
  }

  // Ensure sessions directory exists
  const sessionsDir = path.join(adaDir, "sessions");
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  const archiveName = `${Date.now()}.jsonl`;
  const archivePath = path.join(sessionsDir, archiveName);

  try {
    fs.renameSync(sessionLogPath, archivePath);
    return archivePath;
  } catch {
    // rename can fail cross-device; fall back to copy+delete
    try {
      fs.writeFileSync(archivePath, content, "utf8");
      fs.unlinkSync(sessionLogPath);
      return archivePath;
    } catch {
      return null;
    }
  }
}

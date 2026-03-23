import { IntentAgent } from "./agents/intent.js";
import { PersonaAgent } from "./agents/persona.js";
import { EntityAgent } from "./agents/entity.js";
import { ProcessAgent } from "./agents/process.js";
import { SynthesisAgent } from "./agents/synthesis.js";
import { VerifyAgent } from "./agents/verify.js";
import { GovernorAgent } from "./agents/governor.js";
import { buildGate } from "./gate.js";
import type {
  Blueprint,
  CompileResult,
  PipelineState,
  ProvenanceGate,
  StageCompleteEvent,
  CompilerStageCode,
  Challenge,
  StageExecutionRecord,
  ClarificationRequest,
  ClarificationAnswer,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";
import type { PostcodeAddress } from "@ada/provenance";
import { analyzeCodebase } from "./context/analyzer.js";
import type { CodebaseContext } from "./context/types.js";

function gatherProjectContext(cwd: string): string {
  const fragments: string[] = [];

  // CLAUDE.md — primary project spec
  const claudeMd = path.join(cwd, "CLAUDE.md");
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, "utf8");
    // Take the Summary section and key structural info, cap at 3000 chars
    const summaryMatch = content.match(
      /## Summary\n([\s\S]*?)(?=\n## |\n---|\Z)/,
    );
    if (summaryMatch?.[1]) {
      fragments.push(
        `PROJECT SPEC (from CLAUDE.md):\n${summaryMatch[1].trim().slice(0, 2000)}`,
      );
    } else {
      fragments.push(
        `PROJECT SPEC (from CLAUDE.md):\n${content.slice(0, 2000)}`,
      );
    }
  }

  // package.json — name, description, tech stack
  const pkgJson = path.join(cwd, "package.json");
  if (fs.existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf8")) as Record<
        string,
        unknown
      >;
      const info = [
        pkg["name"] ? `name: ${String(pkg["name"])}` : null,
        pkg["description"]
          ? `description: ${String(pkg["description"])}`
          : null,
        pkg["engines"] ? `engines: ${JSON.stringify(pkg["engines"])}` : null,
      ].filter(Boolean);
      if (info.length > 0) {
        fragments.push(`PACKAGE: ${info.join(", ")}`);
      }
    } catch {
      /* skip malformed */
    }
  }

  // tsconfig — confirms TypeScript
  if (
    fs.existsSync(path.join(cwd, "tsconfig.json")) ||
    fs.existsSync(path.join(cwd, "tsconfig.base.json"))
  ) {
    fragments.push("TECH STACK: TypeScript (tsconfig found)");
  }

  // pnpm-workspace.yaml — monorepo structure
  const workspace = path.join(cwd, "pnpm-workspace.yaml");
  if (fs.existsSync(workspace)) {
    fragments.push(
      `MONOREPO: pnpm workspace (${fs.readFileSync(workspace, "utf8").trim()})`,
    );
  }

  // List packages if they exist
  const packagesDir = path.join(cwd, "packages");
  if (fs.existsSync(packagesDir) && fs.statSync(packagesDir).isDirectory()) {
    try {
      const pkgs = fs.readdirSync(packagesDir).filter((d) => {
        const p = path.join(packagesDir, d, "package.json");
        return fs.existsSync(p);
      });
      if (pkgs.length > 0) {
        fragments.push(`PACKAGES: ${pkgs.join(", ")}`);
      }
    } catch {
      /* skip */
    }
  }

  return fragments.length > 0
    ? "\n\n--- PROJECT CONTEXT (auto-discovered from working directory) ---\n" +
        fragments.join("\n") +
        "\n--- END PROJECT CONTEXT ---"
    : "";
}

export interface CompileOptions {
  readonly apiKey?: string | undefined;
  readonly onStageStart?: (stage: CompilerStageCode) => void;
  readonly onStageToken?: (event: {
    stage: CompilerStageCode;
    token: string;
  }) => void;
  readonly onStageComplete?: (event: StageCompleteEvent) => void;
  readonly onClarificationNeeded?:
    | ((
        requests: readonly ClarificationRequest[],
      ) => Promise<readonly ClarificationAnswer[]>)
    | undefined;
}

export class MotherCompiler {
  private readonly intentAgent = new IntentAgent();
  private readonly personaAgent = new PersonaAgent();
  private readonly entityAgent = new EntityAgent();
  private readonly processAgent = new ProcessAgent();
  private readonly synthesisAgent = new SynthesisAgent();
  private readonly verifyAgent = new VerifyAgent();
  private readonly governorAgent = new GovernorAgent();

  async compile(
    intent: string,
    options: CompileOptions,
  ): Promise<CompileResult> {
    const compileStartedAt = Date.now();
    const {
      onStageStart,
      onStageToken,
      onStageComplete,
      onClarificationNeeded,
    } = options;
    const gates: Record<string, ProvenanceGate> = {};
    const stageRecords: StageExecutionRecord[] = [];
    let cumulativeEntropy = 1.0;
    let previousPostcode: PostcodeAddress | null = null;

    const emitAndGate = (
      stage: CompilerStageCode,
      postcode: PostcodeAddress,
      challenges: readonly Challenge[],
      contentScore: number, // renamed from invariantCount — measures structured content produced
      unresolvedUnknowns: number,
      parseFailure: boolean,
    ): void => {
      if (previousPostcode) {
        const gate = buildGate({
          fromPostcode: previousPostcode,
          toPostcode: postcode,
          challenges: [...challenges],
          invariantCount: contentScore,
          unresolvedUnknowns,
          previousEntropy: cumulativeEntropy,
          parseFailure,
        });
        gates[postcode.raw] = gate;
        cumulativeEntropy = gate.entropyEstimate;
      } else {
        // First stage — no previous postcode, but still compute initial entropy
        const gate = buildGate({
          fromPostcode: postcode, // self-reference for first gate
          toPostcode: postcode,
          challenges: [...challenges],
          invariantCount: contentScore,
          unresolvedUnknowns,
          previousEntropy: cumulativeEntropy,
          parseFailure,
        });
        gates[postcode.raw] = gate;
        cumulativeEntropy = gate.entropyEstimate;
      }
      onStageComplete?.({
        stage,
        postcode,
        entropyEstimate: cumulativeEntropy,
        challenges,
      });
      previousPostcode = postcode;
    };

    function stageCallbacks(stage: CompilerStageCode) {
      return {
        onToken: onStageToken
          ? (token: string) => onStageToken({ stage, token })
          : undefined,
      };
    }

    // ─── Stage 0: Context (CTX) — static codebase analysis ───
    const cwd = process.cwd();
    const codebaseContext: CodebaseContext = analyzeCodebase(cwd);

    // Set context on agents that benefit from grounding
    this.intentAgent.setCodebaseContext(codebaseContext);
    this.entityAgent.setCodebaseContext(codebaseContext);
    this.synthesisAgent.setCodebaseContext(codebaseContext);

    // Emit CTX gate
    onStageStart?.("CTX");
    const ctxContentScore =
      codebaseContext.vocabulary.length + codebaseContext.constants.length;
    emitAndGate("CTX", codebaseContext.postcode, [], ctxContentScore, 0, false);
    stageRecords.push({
      stageCode: "CTX",
      metadata: {
        modelId: "static-analysis",
        temperature: 0,
        extendedThinking: false,
        maxTokens: 0,
        retryCount: 0,
        callDurationMs: 0,
      },
      postcode: codebaseContext.postcode,
    });

    // ─── Enrich intent with project context (raw text fallback) ───
    const projectContext = gatherProjectContext(cwd);
    const enrichedIntent = projectContext ? intent + projectContext : intent;

    // ─── Stage 1: Intent (excavate) ───
    onStageStart?.("INT");
    const intentResult = await this.intentAgent.run(
      enrichedIntent,
      stageCallbacks("INT"),
    );
    let intentGraph = {
      ...intentResult.output,
      rawIntent: intent,
      postcode: intentResult.postcode,
    };
    stageRecords.push({
      stageCode: "INT",
      metadata: intentResult.metadata,
      postcode: intentResult.postcode,
    });
    // Content score: goals + constraints + unknowns found
    const intContent =
      intentGraph.goals.length + intentGraph.constraints.length;
    emitAndGate(
      "INT",
      intentResult.postcode,
      intentResult.challenges,
      intContent,
      intentGraph.unknowns.length,
      intentResult.parseFailure,
    );

    // ─── Clarification checkpoint ───
    // If project context was available, auto-resolve blocking unknowns
    // that are answerable from the codebase. Only ask the user for
    // genuinely unresolvable questions.
    if (projectContext && intentGraph.unknowns.length > 0) {
      // Downgrade blocking unknowns to scoping when context is present —
      // the context already answers questions about tech stack, scope, etc.
      const downgraded = intentGraph.unknowns.map((u) =>
        u.impact === "blocking" ? { ...u, impact: "scoping" as const } : u,
      );
      intentGraph = { ...intentGraph, unknowns: downgraded };
    }

    if (onClarificationNeeded) {
      const blockers = intentGraph.unknowns.filter(
        (u) => u.impact === "blocking",
      );
      if (blockers.length > 0) {
        const requests: ClarificationRequest[] = blockers.map((u) => ({
          unknownId: u.id,
          question: u.description,
          impact: u.impact,
          suggestedDefault: null,
        }));
        const answers = await onClarificationNeeded(requests);
        if (answers.length > 0) {
          const additionalConstraints = answers.map((a) => ({
            id: `clarification-${a.unknownId}`,
            description: a.answer,
            source: "explicit" as const,
          }));
          const resolvedIds = new Set(answers.map((a) => a.unknownId));
          intentGraph = {
            ...intentGraph,
            constraints: [...intentGraph.constraints, ...additionalConstraints],
            unknowns: intentGraph.unknowns.filter(
              (u) => !resolvedIds.has(u.id),
            ),
          };
        }
      }
    }

    // ─── Stage 2: Persona (situate) ───
    onStageStart?.("PER");
    const personaResult = await this.personaAgent.run(
      intentGraph,
      stageCallbacks("PER"),
    );
    const domainContext = {
      ...personaResult.output,
      postcode: personaResult.postcode,
    };
    stageRecords.push({
      stageCode: "PER",
      metadata: personaResult.metadata,
      postcode: personaResult.postcode,
    });
    // Content score: vocabulary terms + stakeholders + exclusions
    const perContent =
      Object.keys(domainContext.ubiquitousLanguage).length +
      domainContext.stakeholders.length +
      domainContext.excludedConcerns.length;
    emitAndGate(
      "PER",
      personaResult.postcode,
      personaResult.challenges,
      perContent,
      0,
      personaResult.parseFailure,
    );

    // ─── Stage 3: Entity (crystallize) ───
    onStageStart?.("ENT");
    const entityResult = await this.entityAgent.run(
      { intentGraph, domainContext },
      stageCallbacks("ENT"),
    );
    const entityMap = {
      ...entityResult.output,
      postcode: entityResult.postcode,
    };
    stageRecords.push({
      stageCode: "ENT",
      metadata: entityResult.metadata,
      postcode: entityResult.postcode,
    });
    const totalInvariants = entityMap.entities.reduce(
      (sum, e) => sum + e.invariants.length,
      0,
    );
    // Content score: entities + invariants + bounded contexts
    const entContent =
      entityMap.entities.length +
      totalInvariants +
      entityMap.boundedContexts.length;
    emitAndGate(
      "ENT",
      entityResult.postcode,
      entityResult.challenges,
      entContent,
      intentGraph.unknowns.filter((u) => u.impact === "blocking").length,
      entityResult.parseFailure,
    );

    // ─── Stage 4: Process (choreograph) ───
    onStageStart?.("PRO");
    const processResult = await this.processAgent.run(
      { intentGraph, domainContext, entityMap },
      stageCallbacks("PRO"),
    );
    const processFlow = {
      ...processResult.output,
      postcode: processResult.postcode,
    };
    stageRecords.push({
      stageCode: "PRO",
      metadata: processResult.metadata,
      postcode: processResult.postcode,
    });
    // Content score: workflow steps + state machine states + failure modes
    const proSteps = processFlow.workflows.reduce(
      (sum, w) => sum + w.steps.length,
      0,
    );
    const proStates = processFlow.stateMachines.reduce(
      (sum, sm) => sum + sm.states.length,
      0,
    );
    const proEdges = processFlow.workflows.reduce(
      (s, w) => s + w.steps.reduce((ss, st) => ss + st.failureModes.length, 0),
      0,
    );
    emitAndGate(
      "PRO",
      processResult.postcode,
      processResult.challenges,
      proSteps + proStates + proEdges,
      0,
      processResult.parseFailure,
    );

    // ─── Stage 5: Synthesis (compose) ───
    onStageStart?.("SYN");
    const synthesisResult = await this.synthesisAgent.run(
      { intentGraph, domainContext, entityMap, processFlow },
      stageCallbacks("SYN"),
    );
    stageRecords.push({
      stageCode: "SYN",
      metadata: synthesisResult.metadata,
      postcode: synthesisResult.postcode,
    });
    const synthesisOutput = synthesisResult.output;
    const blueprint: Blueprint = {
      summary: synthesisOutput.summary,
      architecture: synthesisOutput.architecture,
      dataModel: entityMap,
      processModel: processFlow,
      nonFunctional: synthesisOutput.nonFunctional,
      openQuestions: synthesisOutput.openQuestions,
      resolvedConflicts: synthesisOutput.resolvedConflicts,
      challenges: synthesisOutput.challenges,
      postcode: synthesisResult.postcode,
    };
    // Content score: components + resolved conflicts + non-functional requirements
    const synContent =
      blueprint.architecture.components.length +
      blueprint.resolvedConflicts.length +
      blueprint.nonFunctional.length;
    emitAndGate(
      "SYN",
      synthesisResult.postcode,
      synthesisResult.challenges,
      synContent,
      blueprint.openQuestions.length,
      synthesisResult.parseFailure,
    );

    // ─── Stage 6: Verify (challenge) ───
    onStageStart?.("VER");
    const verifyResult = await this.verifyAgent.run(
      { blueprint, intentGraph },
      stageCallbacks("VER"),
    );
    const auditReport = {
      ...verifyResult.output,
      postcode: verifyResult.postcode,
    };
    stageRecords.push({
      stageCode: "VER",
      metadata: verifyResult.metadata,
      postcode: verifyResult.postcode,
    });
    // Content score: checks performed (coverage + coherence are non-zero = 2 checks passed)
    const verContent =
      (auditReport.coverageScore > 0 ? 5 : 0) +
      (auditReport.coherenceScore > 0 ? 5 : 0) +
      auditReport.drifts.length;
    emitAndGate(
      "VER",
      verifyResult.postcode,
      verifyResult.challenges,
      verContent,
      auditReport.gaps.length,
      verifyResult.parseFailure,
    );

    // ─── Stage 7: Governor (govern) ───
    onStageStart?.("GOV");
    const pipelineState: PipelineState = {
      intent: intentGraph,
      persona: domainContext,
      entity: entityMap,
      process: processFlow,
      synthesis: blueprint,
      verify: auditReport,
      governor: null,
      gates,
      cumulativeEntropy,
    };
    const governorResult = await this.governorAgent.run(
      pipelineState,
      stageCallbacks("GOV"),
    );
    const governorDecision = {
      ...governorResult.output,
      postcode: governorResult.postcode,
    };
    stageRecords.push({
      stageCode: "GOV",
      metadata: governorResult.metadata,
      postcode: governorResult.postcode,
    });
    // Content score: decision made = content
    const govContent = governorDecision.decision ? 10 : 0;
    emitAndGate(
      "GOV",
      governorResult.postcode,
      governorResult.challenges,
      govContent,
      0,
      governorResult.parseFailure,
    );

    const finalState: PipelineState = {
      ...pipelineState,
      governor: governorDecision,
    };
    const status =
      governorDecision.decision === "ACCEPT"
        ? ("accepted" as const)
        : governorDecision.decision === "REJECT"
          ? ("rejected" as const)
          : ("iterating" as const);

    const compileCompletedAt = Date.now();
    const compilationRun = {
      runId: `run-${compileStartedAt}`,
      sourceIntent: intent,
      stages: stageRecords,
      startedAt: compileStartedAt,
      completedAt: compileCompletedAt,
      totalDurationMs: compileCompletedAt - compileStartedAt,
    };

    return {
      blueprint,
      governorDecision,
      pipelineState: finalState,
      status,
      iterationCount: 1,
      compilationRun,
      fallback: null,
    };
  }
}

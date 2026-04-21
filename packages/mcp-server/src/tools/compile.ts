import * as fs from "fs";
import * as path from "path";
import { MotherCompiler } from "@ada/compiler";
import type { CompileResult, StageCompleteEvent } from "@ada/compiler";

/**
 * ada_compile — triggers full Ada compilation directly via MotherCompiler.
 *
 * Bypasses the CLI entirely (no shell, no TTY requirement, no arg-length limit).
 * Changes cwd to projectDir before compiling (MotherCompiler uses process.cwd()
 * internally for .ada/ directory), restores it after.
 */
export async function compileIntent(
  intent: string,
  projectDir: string,
  options: { amend?: boolean; noWebResearch?: boolean },
): Promise<{ content: string; isError: boolean }> {
  if (!intent || intent.trim().length === 0) {
    return { content: "Intent is required.", isError: true };
  }

  const cwd = projectDir || process.env["ADA_PROJECT_DIR"] || process.cwd();

  if (cwd === "/") {
    return {
      content:
        "No project directory specified. Pass projectDir or set ADA_PROJECT_DIR.",
      isError: true,
    };
  }

  if (!fs.existsSync(cwd)) {
    return { content: `Project directory not found: ${cwd}`, isError: true };
  }

  // MotherCompiler.compile() uses process.cwd() to locate .ada/ — chdir first
  const originalCwd = process.cwd();
  try {
    process.chdir(cwd);
  } catch (e) {
    return {
      content: `Cannot chdir to project directory: ${cwd} — ${String(e)}`,
      isError: true,
    };
  }

  const stageLog: string[] = [];
  const compiler = new MotherCompiler();

  try {
    const result: CompileResult = await compiler.compile(intent, {
      onStageComplete(event: StageCompleteEvent) {
        stageLog.push(
          `  ◆ ${event.stage}  entropy:${event.entropyEstimate.toFixed(3)}`,
        );
      },
    });

    // Persist state file so other MCP tools can read it
    const adaDir = path.join(cwd, ".ada");
    fs.mkdirSync(adaDir, { recursive: true });
    fs.writeFileSync(
      path.join(adaDir, "state.json"),
      JSON.stringify(result, null, 2),
      "utf8",
    );

    const bp = result.blueprint;
    const gov = result.governorDecision;
    const components = bp?.architecture?.components ?? [];
    const audit = bp?.audit;

    const lines = [
      `✓ Compilation complete`,
      `  Decision: ${gov?.decision ?? "unknown"}`,
      `  Confidence: ${gov?.confidence ?? "—"}`,
      ``,
      `Pipeline:`,
      ...stageLog,
      ``,
      `Summary: ${bp?.summary ?? "—"}`,
      ``,
      `Bounded contexts (${components.length}):`,
      ...components.map((c) => `  • ${c.name} (${c.boundedContext})`),
      ``,
      `Coverage: ${audit?.coverageScore ?? "—"}   Coherence: ${audit?.coherenceScore ?? "—"}`,
      ``,
      `Next: call ada_get_macro_plan to get the ordered execution plan`,
    ];

    return { content: lines.join("\n"), isError: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      content: `Compilation failed:\n${msg.slice(0, 3000)}`,
      isError: true,
    };
  } finally {
    try {
      process.chdir(originalCwd);
    } catch {
      /* ignore */
    }
  }
}

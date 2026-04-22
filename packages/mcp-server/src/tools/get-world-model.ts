import * as fs from "fs";
import * as path from "path";
import { loadManifest, loadStageArtifact } from "../state.js";
import type { CompilerStageCode } from "@ada/compiler";

const VALID_STAGES = new Set<string>([
  "CTX",
  "INT",
  "PER",
  "ENT",
  "PRO",
  "SYN",
  "VER",
  "GOV",
]);

export function getWorldModel(stage?: string): {
  content: string;
  isError: boolean;
} {
  if (stage) {
    // topic:<name> — read from .ada/topics/{name}.json
    if (stage.startsWith("topic:")) {
      const topicName = stage.slice("topic:".length);
      const topicPath = path.join(
        process.cwd(),
        ".ada",
        "topics",
        `${topicName}.json`,
      );
      if (!fs.existsSync(topicPath)) {
        return {
          content: `No topic file found for "${topicName}". Available: run ada init or check .ada/topics/`,
          isError: true,
        };
      }
      try {
        return {
          content: fs.readFileSync(topicPath, "utf8"),
          isError: false,
        };
      } catch {
        return {
          content: `Failed to read topic file "${topicName}"`,
          isError: true,
        };
      }
    }

    if (!VALID_STAGES.has(stage.toUpperCase())) {
      return {
        content: `Unknown stage "${stage}". Valid stages: CTX, INT, PER, ENT, PRO, SYN, VER, GOV — or use "topic:<name>" for .ada/topics/<name>.json`,
        isError: true,
      };
    }
    const artifact = loadStageArtifact(
      stage.toUpperCase() as CompilerStageCode,
    );
    if (artifact === null) {
      return {
        content: `No artifact found for stage "${stage}". Run ada init first.`,
        isError: true,
      };
    }
    return { content: JSON.stringify(artifact, null, 2), isError: false };
  }

  // No stage — prefer the human-readable world model index if it exists
  const indexPath = path.join(process.cwd(), ".ada", "world-model-index.md");
  if (fs.existsSync(indexPath)) {
    try {
      return { content: fs.readFileSync(indexPath, "utf8"), isError: false };
    } catch {
      // Fall through to manifest JSON on read failure
    }
  }

  // Fall back to raw manifest JSON for backwards compatibility
  const manifest = loadManifest();
  if (!manifest) {
    return {
      content: "No compiled world model found. Run ada init first.",
      isError: true,
    };
  }

  return { content: JSON.stringify(manifest, null, 2), isError: false };
}

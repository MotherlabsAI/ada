import * as fs from "fs";
import type { Blueprint } from "@ada/compiler";

export function loadBlueprint(): Blueprint | null {
  const statePath = process.env["ADA_STATE_PATH"];
  if (!statePath) return null;

  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as { blueprint?: Blueprint };
    return parsed.blueprint ?? null;
  } catch {
    return null;
  }
}

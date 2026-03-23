import * as fs from "fs";
import { VerifyAgent } from "@ada/compiler";
import type { Blueprint, IntentGraph } from "@ada/compiler";

export async function verifyCommand(): Promise<void> {
  const statePath = process.env["ADA_STATE_PATH"];
  if (!statePath) {
    console.error("Error: ADA_STATE_PATH not set");
    process.exit(1);
  }

  let state: { blueprint?: Blueprint; intent?: IntentGraph };
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8")) as { blueprint?: Blueprint; intent?: IntentGraph };
  } catch {
    console.error("Error: could not read state file");
    process.exit(1);
  }

  if (!state.blueprint || !state.intent) {
    console.error("Error: state file missing blueprint or intent");
    process.exit(1);
  }

  const agent = new VerifyAgent();
  const result = await agent.run(
    { blueprint: state.blueprint, intentGraph: state.intent }
  );

  console.log(JSON.stringify(result.output, null, 2));
}

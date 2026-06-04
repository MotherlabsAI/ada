/**
 * settingsStatus — the value-free environment status the Settings panel shows. Mirrors the
 * `ada key` CLI logic and `engine/model.ts`'s model precedence WITHOUT touching the network
 * module (so importing this never risks a live call) and WITHOUT ever exposing the secret
 * (AXIOM A9 — only the boolean availability and the model id cross this boundary).
 *
 * The built-in default model is duplicated here as a literal on purpose: model.ts keeps it
 * private (it is the network module; we must not import it for a read-only status line), and a
 * grep-guard test pins the two to stay in sync. Pure: reads `process.env`, returns a plain shape.
 */

/** Kept in lockstep with engine/model.ts's private DEFAULT_MODEL (a test asserts they match). */
export const SETTINGS_DEFAULT_MODEL = "claude-opus-4-8";

export interface SettingsStatus {
  /** Whether ANTHROPIC_API_KEY is present — the boolean only, never the value (A9). */
  keyAvailable: boolean;
  /** The active model id: ADA_MODEL when set, else the built-in default. */
  model: string;
  /** True when `model` came from ADA_MODEL (vs the default). */
  modelFromEnv: boolean;
}

/** Read the value-free status from an env bag (defaults to `process.env`). */
export function readSettingsStatus(
  env: NodeJS.ProcessEnv = process.env,
): SettingsStatus {
  const keyAvailable = Boolean(env["ANTHROPIC_API_KEY"]);
  const adaModel = env["ADA_MODEL"];
  const modelFromEnv = typeof adaModel === "string" && adaModel.trim() !== "";
  return {
    keyAvailable,
    model: modelFromEnv ? adaModel!.trim() : SETTINGS_DEFAULT_MODEL,
    modelFromEnv,
  };
}

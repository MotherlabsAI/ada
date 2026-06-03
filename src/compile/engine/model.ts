/**
 * The SINGLE model boundary. This is the only module in the engine permitted to touch a
 * network: AXIOM A1 (the model is invoked at COMPILE TIME only) and AXIOM A9 (that single
 * compile-time call is the only outbound call Ada is allowed). Everything downstream —
 * excavate.ts, the rubric gate, assembly — is pure and model-free (AXIOM A3).
 *
 * The real compile-time client will live HERE, behind this interface. Until it is wired,
 * the default throws and callers inject a client (tests inject a deterministic stub).
 */
export interface ModelClient {
  /** One compile-time completion. The only network the engine is permitted (A1/A9). */
  complete(prompt: string): Promise<string>;
}

/** The default boundary: no client configured yet. Throws rather than silently faking. */
export function notConfigured(): ModelClient {
  return {
    async complete(): Promise<string> {
      throw new Error(
        "No model configured. Inject a ModelClient — the real compile-time client lives " +
          "in engine/model.ts behind this interface (A1/A9: the only permitted outbound call).",
      );
    },
  };
}

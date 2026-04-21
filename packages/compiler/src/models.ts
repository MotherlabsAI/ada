export const SONNET = "claude-sonnet-4-6" as const;
export const OPUS = "claude-opus-4-6" as const;
export const OPUS_4_7 = "claude-opus-4-7" as const;

// Development mode: use SONNET for all stages to reduce cost (~20x cheaper).
// Set ADA_DEV_MODE=1 to enable. Production uses OPUS for SYN/VER/GOV.
export const DEV_OPUS = process.env["ADA_DEV_MODE"] === "1" ? SONNET : OPUS;

// Default model for runtime governance (gate + semantic drift).
// Use OPUS (4.6) until claude-opus-4-7 is available via the API.
// Set ADA_GOVERNANCE_MODEL=claude-opus-4-7 to opt into 4.7 when live.
export const GOVERNANCE_MODEL =
  process.env["ADA_DEV_MODE"] === "1"
    ? SONNET
    : (process.env["ADA_GOVERNANCE_MODEL"] ?? OPUS);

export type ModelId = typeof SONNET | typeof OPUS | typeof OPUS_4_7;

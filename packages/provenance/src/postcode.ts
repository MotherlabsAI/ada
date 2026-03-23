import { createHash } from "crypto";

export type StageCode = "INT" | "PER" | "ENT" | "PRO" | "SYN" | "VER" | "GOV" | "CFG" | "ORC" | "CLI";

export interface PostcodeAddress {
  readonly prefix: "ML";
  readonly stage: StageCode;
  readonly hash: string;
  readonly version: number;
  readonly raw: string;
}

export function generatePostcode(
  stage: StageCode,
  content: string,
  version: number = 1
): PostcodeAddress {
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 8);
  const raw = `ML.${stage}.${hash}/v${version}`;
  return { prefix: "ML", stage, hash, version, raw };
}

export function parsePostcode(raw: string): PostcodeAddress | null {
  const match = raw.match(/^ML\.([A-Z]{2,3})\.([a-f0-9]{8})\/v(\d+)$/);
  if (!match) return null;
  const [, stage, hash, version] = match;
  return {
    prefix: "ML",
    stage: stage as StageCode,
    hash: hash!,
    version: parseInt(version!, 10),
    raw,
  };
}

export function isValidPostcode(raw: string): boolean {
  return parsePostcode(raw) !== null;
}

import type { NodeSpec } from "./assemble.js";
import { hasBannedGenericPhrase, specificityScore } from "./quality-signals.js";

export interface RubricScore {
  dimensions: {
    notGeneric: boolean; // no banned filler
    specific: boolean; // specificity proxies present
    intentTraced: boolean; // fromPrompt non-empty
    compilesToConcrete: boolean; // >=2 concrete artifacts
    checkabilityHonest: boolean; // C3-5 => has candidates; C0-2 => fine
    residueSurfaced: boolean; // unknowns present OR truth=source legitimately
  };
  total: number; // 0..6
  verdict: "impress" | "pass" | "reject";
}

function isCheckable(c: NodeSpec["checkClass"]): boolean {
  return c === "C3" || c === "C4" || c === "C5";
}

export function scoreNode(n: NodeSpec): RubricScore {
  const text = `${n.summary} ${n.whyItMatters} ${n.failureIfMissing}`;
  const dimensions = {
    notGeneric: !hasBannedGenericPhrase(text),
    specific: specificityScore(n.summary) >= 2,
    intentTraced: n.fromPrompt.length > 0,
    compilesToConcrete: n.compilesTo.length >= 2,
    checkabilityHonest: isCheckable(n.checkClass)
      ? n.cCandidates.length > 0
      : true,
    residueSurfaced: n.unknowns.length > 0 || n.truth === "source",
  };
  const total = Object.values(dimensions).filter(Boolean).length;
  // Hard rejects: generic filler or no intent trace can never "impress".
  const verdict: RubricScore["verdict"] =
    !dimensions.notGeneric || !dimensions.intentTraced || total <= 3
      ? "reject"
      : total >= 5 && dimensions.specific
        ? "impress"
        : "pass";
  return { dimensions, total, verdict };
}

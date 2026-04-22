export type RouteMode =
  | "forward"
  | "interrogative"
  | "latent"
  | "format-forward"
  | "amend";

export interface RouteDecision {
  mode: RouteMode;
  announcement: string;
  composition: string[]; // stage codes in order
}

export function classifyInput(
  input: string,
  hasCodebase: boolean,
  hasBlueprint: boolean,
): RouteDecision {
  const lower = input.toLowerCase();
  const wordCount = input.trim().split(/\s+/).length;

  // 1. interrogative — question words, "?", or interrogative signals
  const questionWords =
    /^(what|how|why|where|which|can|could|should|is|are|does|do)\b/i;
  const interrogativeSignals = [
    "improve",
    "wrong",
    "issue",
    "problem with",
    "review",
    "audit",
    "analyze",
    "what about",
    "broken",
    "fix",
  ];
  const isInterrogative =
    questionWords.test(input.trim()) ||
    input.includes("?") ||
    interrogativeSignals.some((s) => lower.includes(s));

  if (isInterrogative) {
    return {
      mode: "interrogative",
      announcement:
        "You asked a question about your codebase. I'll analyze the structure and surface findings.",
      composition: ["CTX", "ENT", "VER", "FORMAT"],
    };
  }

  // 2. format-forward — structured output signals
  const formatSignals = [
    "schema",
    "diagram",
    "type definition",
    "interface",
    "give me a",
    "generate a",
    "create a",
    "spec for",
    "pdf",
    "document for",
    "wireframe",
  ];
  const isFormatForward = formatSignals.some((s) => lower.includes(s));

  if (isFormatForward) {
    return {
      mode: "format-forward",
      announcement:
        "I'll compile your intent and emit structured output — schemas, diagrams, and a placement map.",
      composition: ["CTX", "INT", "ENT", "FORMAT"],
    };
  }

  // 3. amend — blueprint exists + amend signals + not interrogative
  const amendSignals = [
    "add",
    "also",
    "extend",
    "update",
    "change",
    "remove",
    "plus",
    "and also",
  ];
  const isAmend =
    hasBlueprint &&
    amendSignals.some((s) => lower.includes(s)) &&
    !isInterrogative;

  if (isAmend) {
    return {
      mode: "amend",
      announcement:
        "Blueprint found. I'll extend it with your changes rather than recompiling from scratch.",
      composition: ["CTX", "INT", "SYN", "GOV"],
    };
  }

  // 4. latent — short, vague, feeling-oriented
  const latentSignals = [
    "feel",
    "struggle",
    "not sure",
    "don't know",
    "help me",
    "stuck",
    "need something",
    "something that",
  ];
  const hasProductNoun =
    /\b(app|platform|tool|system|service|api|dashboard|site|product|software|feature|bot|workflow)\b/i.test(
      input,
    );
  const isLatent =
    wordCount < 20 &&
    !hasProductNoun &&
    latentSignals.some((s) => lower.includes(s));

  if (isLatent) {
    return {
      mode: "latent",
      announcement:
        "Your intent isn't fully formed yet — that's fine. I'll probe first, then surface what you're actually building.",
      composition: ["CTX", "INT", "PER", "ENT", "INT"],
    };
  }

  // 5. forward — everything else
  return {
    mode: "forward",
    announcement: "Compiling your intent through the full pipeline.",
    composition: ["CTX", "INT", "PER", "ENT", "PRO", "SYN", "VER", "GOV"],
  };
}

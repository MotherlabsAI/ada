// ═══════════════════════════════════════════════════════════════════════════════
// ADA — TUI Design System (motherTUI)
// Source of truth for all visual decisions. Do not approximate. Do not invent.
// ═══════════════════════════════════════════════════════════════════════════════

// 1. PALETTE
export const palette = {
  bg: {
    deep: "#0d0d0d",
    surface: "#151518",
    elevated: "#1c1c21",
    hover: "#22222a",
  },
  accent: {
    primary: "#8ba4c4",
    dim: "#6b8aad",
    pale: "#afc3d9",
    wash: "#8ba4c422",
  },
  text: {
    primary: "#e8e6df",
    secondary: "#a8a69e",
    tertiary: "#787672",
    dim: "#5a5856",
    ghost: "#484644",
  },
  semantic: {
    verified: "#7ab87a",
    verifiedDim: "#4a7a4a",
    active: "#d4917a",
    activeDim: "#a8533a",
    failure: "#c45c4a",
    failureDim: "#8a3a30",
    warning: "#d4c07a",
    warningDim: "#a89a5a",
    provenance: "#a8d4e6",
    provenanceDim: "#6a8a9c",
    info: "#7a9cc4",
    infoDim: "#4a6a8a",
    revenue: "#c4b47a",
    revenueDim: "#8a7a4a",
  },
} as const;

// 2. GLYPHS
export const glyphs = {
  identity: {
    core: "\u25C8", // ◈
    open: "\u25C7", // ◇
    filled: "\u25C6", // ◆
    heavy: "\u2666", // ♦
  },
  pipeline: {
    arrow: "\u2192", // →
    cycle: "\u21BB", // ↻
    therefore: "\u2234", // ∴
    because: "\u2235", // ∵
    separator: "\u00B7", // ·
    ellipsis: "\u2026", // …
  },
  status: {
    pass: "\u2713", // ✓
    fail: "\u2717", // ✗
    running: "\u25B6", // ▶
    stopped: "\u25A0", // ■
    connected: "\u25CF", // ●
    disconnected: "\u25CB", // ○
    loading: "\u25C9", // ◉
    queued: "\u25CC", // ◌
    skipped: "\u2298", // ⊘
    alert: "\u2691", // ⚑
    triangle: "\u25B3", // △
  },
  chevron: "\u276F", // ❯
  downArrow: "\u2193", // ↓
} as const;

// 3. BORDERS
export const borders = {
  single: {
    tl: "\u250C",
    tr: "\u2510",
    bl: "\u2514",
    br: "\u2518",
    h: "\u2500",
    v: "\u2502",
  },
  rounded: {
    tl: "\u256D",
    tr: "\u256E",
    bl: "\u2570",
    br: "\u256F",
    h: "\u2500",
    v: "\u2502",
  },
  heavy: {
    tl: "\u250F",
    tr: "\u2513",
    bl: "\u2517",
    br: "\u251B",
    h: "\u2501",
    v: "\u2503",
  },
  double: {
    tl: "\u2554",
    tr: "\u2557",
    bl: "\u255A",
    br: "\u255D",
    h: "\u2550",
    v: "\u2551",
  },
  dash: { h: "\u2504", v: "\u2506" },
} as const;

// 4. SPINNERS
export const spinners = {
  diamondBreathe: {
    frames: [
      "\u25C7",
      "\u25C8",
      "\u25C6",
      "\u2666",
      "\u25C8",
      "\u25C7",
    ] as readonly string[],
    timing: [200, 130, 100, 100, 130, 200] as readonly number[],
    total: 860,
  },
  brailleOrbit: {
    frames: [
      "\u280B",
      "\u2819",
      "\u2839",
      "\u2838",
      "\u283C",
      "\u2834",
      "\u2826",
      "\u2827",
      "\u2807",
      "\u280F",
    ] as readonly string[],
    timing: 80,
  },
  brailleGrow: {
    frames: [
      "\u2840",
      "\u2844",
      "\u2846",
      "\u2847",
      "\u28C7",
      "\u28E7",
      "\u28F7",
      "\u28FF",
    ] as readonly string[],
    timing: 60,
  },
  pulseDot: {
    frames: ["\u22C5", "\u2219", "\u25CF", "\u2219"] as readonly string[],
    timing: [200, 150, 200, 150] as readonly number[],
  },
  pulseCircle: {
    frames: [
      "\u25CC",
      "\u25CB",
      "\u2299",
      "\u25CF",
      "\u2299",
      "\u25CB",
    ] as readonly string[],
    timing: [180, 120, 100, 100, 120, 180] as readonly number[],
  },
} as const;

// 5. SPINNER VERBS
export const spinnerVerbs: Record<string, readonly string[]> = {
  INT: [
    "Excavating",
    "Parsing intent",
    "Mapping goals",
    "Eliciting requirements",
  ],
  PER: [
    "Profiling",
    "Modeling context",
    "Scoping domain",
    "Building vocabulary",
  ],
  ENT: [
    "Extracting structure",
    "Mapping entities",
    "Building ontology",
    "Identifying nouns",
  ],
  PRO: [
    "Sequencing",
    "Tracing workflows",
    "Defining transitions",
    "Mapping verbs",
  ],
  SYN: [
    "Composing",
    "Merging artifacts",
    "Resolving conflicts",
    "Filling gaps",
  ],
  VER: [
    "Auditing",
    "Checking drift",
    "Validating coherence",
    "Measuring fidelity",
  ],
  GOV: [
    "Gating",
    "Evaluating acceptance",
    "Measuring provenance",
    "Issuing verdict",
  ],
};

// 6. PROGRESS BARS
export const progressBars = {
  diamond: {
    done: "\u25C6", // ◆
    active: "\u25C8", // ◈
    pending: "\u25C7", // ◇
    render: (current: number, total: number): string => {
      return Array.from({ length: total }, (_, i) =>
        i < current ? "\u25C6" : i === current ? "\u25C8" : "\u25C7",
      ).join("");
    },
  },
} as const;

// 7. SPARKLINE
export const sparkline = {
  bars: [
    "\u2581",
    "\u2582",
    "\u2583",
    "\u2584",
    "\u2585",
    "\u2586",
    "\u2587",
    "\u2588",
  ] as readonly string[],
  render: (values: number[]): string => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values
      .map((v) => {
        const idx = Math.round(((v - min) / range) * 7);
        return "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588"[
          Math.max(0, Math.min(7, idx))
        ];
      })
      .join("");
  },
};

// 8. BLOCKS (compound patterns)
export const blocks = {
  gateStatus: (status: "accept" | "reject" | "pending"): string => {
    const map = {
      accept: "\u25C8 ACCEPT",
      reject: "\u25C6 REJECT",
      pending: "\u25C7 PENDING",
    };
    return map[status];
  },
} as const;

// 9. TIMING
export const timing = {
  spinnerCycle: 860,
  verbRotation: 2800,
  borderFocus: 150,
  stageTransition: 100,
  logEntryFlash: 200,
  valueFlash: 300,
  easing: "ease-out" as const,
} as const;

// 10. LAYOUT
export const layout = {
  breakpoints: {
    full: 120,
    compact: 80,
    stacked: 60,
    minimal: 40,
  },
  padding: {
    panelInner: { h: 1, v: 0 },
    sectionGap: 1,
  },
} as const;

// 11. TEXT RULES
export const textRules = {
  panelTitles: "UPPERCASE" as const,
  bodyText: "sentence" as const,
  timestampFormat: "HH:MM:SS" as const,
  truncation: "\u2026" as const,
  noEmoji: true,
  noPureWhite: true,
  noPureBlack: true,
  noBgColor: true,
  noTitleCase: true,
} as const;

// 12. SEMANTIC MAP
export const semanticMap = {
  "\u25C8": { meaning: "Ada identity / gate ACCEPT", color: "accent.primary" },
  "\u25C7": { meaning: "gate PENDING / awaiting", color: "info" },
  "\u25C6": { meaning: "gate REJECT / closed", color: "failure" },
  "\u2713": { meaning: "pass / success", color: "verified" },
  "\u2717": { meaning: "fail / error", color: "failure" },
  "\u25B6": { meaning: "running now", color: "active" },
  "\u25CC": { meaning: "queued / waiting", color: "text.tertiary" },
  "\u21BB": { meaning: "retry / ITERATE", color: "warning" },
} as const;

// 13. PANELS
export const panels = {
  pipeline: { title: "COMPILING", border: "single" as const },
  governor: { title: "GOVERNOR", border: "single" as const },
  artifacts: { title: "ARTIFACTS", border: "single" as const },
  signals: { title: "LIVE SIGNALS", border: "single" as const },
  agents: { title: "AGENTS", border: "single" as const },
} as const;

// 14. KEYBINDS
export const keybinds = {
  compile: [
    { key: "q", label: "quit" },
    { key: "r", label: "retry" },
    { key: "esc", label: "interrupt" },
  ],
  run: [
    { key: "q", label: "quit" },
    { key: "tab", label: "next panel" },
  ],
} as const;

// 15. HELPERS
export function confidenceColor(value: number): string {
  if (value >= 0.8) return palette.semantic.verified;
  if (value >= 0.6) return palette.semantic.warning;
  return palette.semantic.failure;
}

export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

export function formatTimestamp(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

export function formatTokens(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

// EXPORT
export const motherTUI = {
  palette,
  glyphs,
  borders,
  spinners,
  spinnerVerbs,
  progressBars,
  sparkline,
  blocks,
  timing,
  layout,
  textRules,
  semanticMap,
  panels,
  keybinds,
} as const;

export default motherTUI;

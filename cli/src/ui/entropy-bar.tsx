import React from "react";
import { Text, Box } from "ink";
import { palette } from "./design-system.js";
import type { CompilerStageCode } from "@ada/compiler";

const STAGE_CODES: CompilerStageCode[] = [
  "INT",
  "PER",
  "ENT",
  "PRO",
  "SYN",
  "VER",
  "GOV",
];

const SPARK_CHARS = [
  "\u2581", // ▁
  "\u2582", // ▂
  "\u2583", // ▃
  "\u2584", // ▄
  "\u2585", // ▅
  "\u2586", // ▆
  "\u2587", // ▇
  "\u2588", // █
];

function entropyColor(val: number): string {
  if (val > 0.7) return palette.semantic.failure;
  if (val > 0.4) return palette.semantic.warning;
  return palette.semantic.verified;
}

interface EntropyBarProps {
  readonly values: ReadonlyMap<CompilerStageCode, number>;
}

export function EntropyBar({ values }: EntropyBarProps): React.ReactElement {
  return (
    <Box>
      <Text color={palette.text.tertiary}>{"entropy "}</Text>
      {STAGE_CODES.map((code) => {
        const val = values.get(code);

        if (val === undefined) {
          // Not yet computed — ghost placeholder
          return (
            <Text key={code} color={palette.text.ghost}>
              {"\u2591"}
            </Text>
          );
        }

        // Height maps entropy inversely: lower entropy = taller bar (more structure)
        // High entropy (0.9) → short bar ▁; low entropy (0.1) → tall bar █
        const invertedForHeight = 1 - val;
        const idx = Math.min(7, Math.round(invertedForHeight * 7));
        const bar = SPARK_CHARS[idx] ?? "\u2581";
        const color = entropyColor(val);

        return (
          <Text key={code} color={color}>
            {bar}
          </Text>
        );
      })}
      <Text color={palette.text.tertiary}>
        {"  "}
        {values.size > 0 &&
          (() => {
            const vals = Array.from(values.values());
            const last = vals[vals.length - 1];
            return last !== undefined ? last.toFixed(2) : "";
          })()}
      </Text>
    </Box>
  );
}

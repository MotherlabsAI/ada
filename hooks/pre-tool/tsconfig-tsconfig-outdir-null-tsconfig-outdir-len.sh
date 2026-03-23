#!/bin/bash
# Invariant: tsConfig.outDir !== null && tsConfig.outDir.length > 0
# Entity: TsConfig
# Description: tsconfig must declare an output directory
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: tsConfig.outDir !== null && tsConfig.outDir.length > 0
exit 0

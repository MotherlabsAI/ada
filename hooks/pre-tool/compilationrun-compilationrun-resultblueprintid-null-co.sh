#!/bin/bash
# Invariant: (compilationRun.resultBlueprintId !== null) || (compilationRun.fallbackResultId !== null)
# Entity: CompilationRun
# Description: a completed run must produce either a blueprint or a fallback result
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: (compilationRun.resultBlueprintId !== null) || (compilationRun.fallbackResultId !== null)
exit 0

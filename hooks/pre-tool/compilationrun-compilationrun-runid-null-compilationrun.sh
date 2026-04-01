#!/bin/bash
# Invariant: compilationRun.runId !== null && compilationRun.runId.startsWith('ML-')
# Entity: CompilationRun
# Description: runId must be non-empty and ML-prefixed to be globally unique and traceable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.runId !== null && compilationRun.runId.startsWith('ML-')
exit 0

#!/bin/bash
# Invariant: runRecord.runId !== null && runRecord.runId.startsWith('ML')
# Entity: RunRecord
# Description: runId must be ML-prefixed matching the CompilationRun invariant
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: runRecord.runId !== null && runRecord.runId.startsWith('ML')
exit 0

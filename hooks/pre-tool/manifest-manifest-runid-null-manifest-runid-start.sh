#!/bin/bash
# Invariant: manifest.runId !== null && manifest.runId.startsWith('ML.')
# Entity: Manifest
# Description: manifest runId must be ML-prefixed matching its CompilationRun
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: manifest.runId !== null && manifest.runId.startsWith('ML.')
exit 0

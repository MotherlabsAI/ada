#!/bin/bash
# Invariant: compilationRun.determinismMetadata !== null
# Entity: CompilationRun
# Description: determinism metadata must be captured per run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.determinismMetadata !== null
exit 0

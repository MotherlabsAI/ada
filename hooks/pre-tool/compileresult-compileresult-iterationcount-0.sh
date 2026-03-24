#!/bin/bash
# Invariant: compileResult.iterationCount > 0
# Entity: CompileResult
# Description: At least one iteration must have occurred — a result from zero iterations has no provenance
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.iterationCount > 0
exit 0

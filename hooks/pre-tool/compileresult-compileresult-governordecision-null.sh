#!/bin/bash
# Invariant: compileResult.governorDecision !== null
# Entity: CompileResult
# Description: governorDecision must be non-null — the pipeline cannot produce a CompileResult without a governor decision
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.governorDecision !== null
exit 0

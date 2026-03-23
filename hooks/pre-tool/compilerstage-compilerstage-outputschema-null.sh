#!/bin/bash
# Invariant: compilerStage.outputSchema !== null
# Entity: CompilerStage
# Description: stage must declare its output schema
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilerStage.outputSchema !== null
exit 0

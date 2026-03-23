#!/bin/bash
# Invariant: compilerStage.name !== null
# Entity: CompilerStage
# Description: stage must have a declared name
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilerStage.name !== null
exit 0

#!/bin/bash
# Invariant: compilerStage.stageId !== null
# Entity: CompilerStage
# Description: stage must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilerStage.stageId !== null
exit 0

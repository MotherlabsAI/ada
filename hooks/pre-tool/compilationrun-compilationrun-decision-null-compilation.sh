#!/bin/bash
# Invariant: compilationRun.decision !== null || compilationRun.stages.length < 9
# Entity: CompilationRun
# Description: decision must be set before BLD stage runs and only after all upstream stages complete
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.decision !== null || compilationRun.stages.length < 9
exit 0

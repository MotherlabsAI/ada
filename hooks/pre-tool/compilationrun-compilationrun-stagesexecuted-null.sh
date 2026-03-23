#!/bin/bash
# Invariant: compilationRun.stagesExecuted !== null
# Entity: CompilationRun
# Description: stages executed list must be initialized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.stagesExecuted !== null
exit 0

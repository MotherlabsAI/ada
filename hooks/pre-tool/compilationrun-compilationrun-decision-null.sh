#!/bin/bash
# Invariant: compilationRun.decision !== null
# Entity: CompilationRun
# Description: every run must end with an explicit ACCEPT, REJECT, or ITERATE decision — an undecided run is an illegal terminal state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.decision !== null
exit 0

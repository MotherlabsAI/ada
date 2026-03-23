#!/bin/bash
# Invariant: synGate.intStageRunId !== null
# Entity: SYNGate
# Description: SYN gate must reference the INT stage whose output it evaluates
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: synGate.intStageRunId !== null
exit 0

#!/bin/bash
# Invariant: inTStage.stateless === true
# Entity: INTStage
# Description: INTStage is declared stateless in the registry; mutable state would invalidate the StatelessReRun invariant and corrupt the rerun architecture
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: inTStage.stateless === true
exit 0

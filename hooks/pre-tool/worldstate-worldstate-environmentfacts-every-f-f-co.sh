#!/bin/bash
# Invariant: worldState.environmentFacts.every(f => f.confidence >= 0 && f.confidence <= 1)
# Entity: WorldState
# Description: every fact must carry a valid confidence score — missing confidence prevents drift detection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: worldState.environmentFacts.every(f => f.confidence >= 0 && f.confidence <= 1)
exit 0

#!/bin/bash
# Invariant: stateFact.confidence >= 0 && stateFact.confidence <= 1
# Entity: StateFact
# Description: confidence must be a valid probability — values outside [0,1] are not interpretable as certainty scores
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stateFact.confidence >= 0 && stateFact.confidence <= 1
exit 0

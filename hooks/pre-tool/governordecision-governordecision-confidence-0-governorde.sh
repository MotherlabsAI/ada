#!/bin/bash
# Invariant: governorDecision.confidence >= 0 && governorDecision.confidence <= 1
# Entity: GovernorDecision
# Description: confidence must be a probability in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.confidence >= 0 && governorDecision.confidence <= 1
exit 0

#!/bin/bash
# Invariant: governorDecision.gatePassRate >= 0 && governorDecision.gatePassRate <= 1
# Entity: GovernorDecision
# Description: gate pass rate must be in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.gatePassRate >= 0 && governorDecision.gatePassRate <= 1
exit 0

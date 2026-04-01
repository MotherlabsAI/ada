#!/bin/bash
# Invariant: governorDecision.coherenceScore >= 0 && governorDecision.coherenceScore <= 1
# Entity: GovernorDecision
# Description: coherenceScore must be normalized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.coherenceScore >= 0 && governorDecision.coherenceScore <= 1
exit 0

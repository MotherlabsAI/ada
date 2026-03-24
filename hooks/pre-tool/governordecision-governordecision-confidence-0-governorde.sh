#!/bin/bash
# Invariant: governorDecision.confidence >= 0 && governorDecision.confidence <= 1
# Entity: GovernorDecision
# Description: Confidence must be a valid proportion — unbounded confidence scores cannot be used to gate pipeline progression
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.confidence >= 0 && governorDecision.confidence <= 1
exit 0

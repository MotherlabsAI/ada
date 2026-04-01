#!/bin/bash
# Invariant: governorDecision.coverageScore >= 0 && governorDecision.coverageScore <= 1
# Entity: GovernorDecision
# Description: coverageScore must be normalized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.coverageScore >= 0 && governorDecision.coverageScore <= 1
exit 0

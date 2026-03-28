#!/bin/bash
# Invariant: governorDecision.coverageScore >= 0 && governorDecision.coverageScore <= 1
# Entity: GovernorDecision
# Description: coverage score is a normalised ratio; out-of-range values corrupt gate pass rate computation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.coverageScore >= 0 && governorDecision.coverageScore <= 1
exit 0

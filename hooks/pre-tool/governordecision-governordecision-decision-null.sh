#!/bin/bash
# Invariant: governorDecision.decision !== null
# Entity: GovernorDecision
# Description: every GovernorDecision must carry a non-null decision type — ACCEPT, REJECT, or ITERATE
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.decision !== null
exit 0

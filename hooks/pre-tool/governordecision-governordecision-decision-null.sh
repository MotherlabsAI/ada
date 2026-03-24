#!/bin/bash
# Invariant: governorDecision.decision !== null
# Entity: GovernorDecision
# Description: Decision type must be set — a governor with no decision emits no governing signal
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.decision !== null
exit 0

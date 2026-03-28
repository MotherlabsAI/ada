#!/bin/bash
# Invariant: governorDecision.decision !== null
# Entity: GovernorDecision
# Description: a null decision type means the governor has not resolved; CompileResult cannot set status without a concrete decision
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: governorDecision.decision !== null
exit 0

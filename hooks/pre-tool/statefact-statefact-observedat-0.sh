#!/bin/bash
# Invariant: stateFact.observedAt > 0
# Entity: StateFact
# Description: every fact must record when it was observed — zero or negative timestamps indicate unrecorded observations
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: stateFact.observedAt > 0
exit 0

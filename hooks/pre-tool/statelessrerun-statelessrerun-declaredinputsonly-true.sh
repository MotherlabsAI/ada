#!/bin/bash
# Invariant: statelessReRun.declaredInputsOnly === true
# Entity: StatelessReRun
# Description: Declared inputs only must be true — stateless re-runs must not receive any inputs beyond the declared stage contract
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: statelessReRun.declaredInputsOnly === true
exit 0

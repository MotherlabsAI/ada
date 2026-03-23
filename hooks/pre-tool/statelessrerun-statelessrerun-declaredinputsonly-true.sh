#!/bin/bash
# Invariant: statelessReRun.declaredInputsOnly === true
# Entity: StatelessReRun
# Description: re-run begins exclusively from declared inputs
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: statelessReRun.declaredInputsOnly === true
exit 0

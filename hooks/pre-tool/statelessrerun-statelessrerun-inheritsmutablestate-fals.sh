#!/bin/bash
# Invariant: statelessReRun.inheritsMutableState === false
# Entity: StatelessReRun
# Description: re-run must never inherit mutable state from the prior run
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: statelessReRun.inheritsMutableState === false
exit 0

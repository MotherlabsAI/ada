#!/bin/bash
# Invariant: buildContract.gatePass === true
# Entity: BuildContract
# Description: a BuildContract may only exist if the BLD gate passed — a failed gate produces no contract
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildContract.gatePass === true
exit 0

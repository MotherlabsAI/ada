#!/bin/bash
# Invariant: buildContract.stack !== null && buildContract.stack.length > 0
# Entity: BuildContract
# Description: stack preset must be non-empty — BLD stage requires a deterministic stack selection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: buildContract.stack !== null && buildContract.stack.length > 0
exit 0

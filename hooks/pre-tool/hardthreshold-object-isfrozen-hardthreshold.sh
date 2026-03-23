#!/bin/bash
# Invariant: Object.isFrozen(hardThreshold)
# Entity: HardThreshold
# Description: hard threshold is a compile-time constant, never mutated at runtime
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: Object.isFrozen(hardThreshold)
exit 0

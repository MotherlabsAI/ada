#!/bin/bash
# Invariant: hardThreshold.value === 0.30
# Entity: HardThreshold
# Description: threshold is exactly 0.30; not a parameter, not overridable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: hardThreshold.value === 0.30
exit 0

#!/bin/bash
# Invariant: uncertaintyMarker.stageCode !== null
# Entity: UncertaintyMarker
# Description: Stage must be attributed — uncertainty without stage location cannot be remediated
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: uncertaintyMarker.stageCode !== null
exit 0

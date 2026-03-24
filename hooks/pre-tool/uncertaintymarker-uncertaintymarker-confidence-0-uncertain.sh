#!/bin/bash
# Invariant: uncertaintyMarker.confidence >= 0 && uncertaintyMarker.confidence <= 1
# Entity: UncertaintyMarker
# Description: Confidence must be a valid proportion — unbounded confidence markers cannot be compared across stages
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: uncertaintyMarker.confidence >= 0 && uncertaintyMarker.confidence <= 1
exit 0

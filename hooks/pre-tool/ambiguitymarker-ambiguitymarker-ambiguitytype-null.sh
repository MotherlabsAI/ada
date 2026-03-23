#!/bin/bash
# Invariant: ambiguityMarker.ambiguityType !== null
# Entity: AmbiguityMarker
# Description: ambiguity type must be classified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguityMarker.ambiguityType !== null
exit 0

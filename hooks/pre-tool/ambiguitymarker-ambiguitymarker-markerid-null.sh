#!/bin/bash
# Invariant: ambiguityMarker.markerId !== null
# Entity: AmbiguityMarker
# Description: marker must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguityMarker.markerId !== null
exit 0

#!/bin/bash
# Invariant: ambiguityMarker.affectedFragmentId !== null
# Entity: AmbiguityMarker
# Description: marker must reference its fragment
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: ambiguityMarker.affectedFragmentId !== null
exit 0

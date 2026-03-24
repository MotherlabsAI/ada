#!/bin/bash
# Invariant: uncertaintyMarker.description !== null && uncertaintyMarker.description.length > 0
# Entity: UncertaintyMarker
# Description: Uncertainty must be described — an anonymous marker cannot guide fallback selection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: uncertaintyMarker.description !== null && uncertaintyMarker.description.length > 0
exit 0

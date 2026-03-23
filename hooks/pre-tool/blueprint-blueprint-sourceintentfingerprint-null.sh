#!/bin/bash
# Invariant: blueprint.sourceIntentFingerprint !== null
# Entity: Blueprint
# Description: blueprint must reference its source intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.sourceIntentFingerprint !== null
exit 0

#!/bin/bash
# Invariant: postcodeAddress.version >= 1
# Entity: PostcodeAddress
# Description: Version must be positive — it distinguishes re-runs from initial compilations
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.version >= 1
exit 0

#!/bin/bash
# Invariant: postcodeAddress.version > 0
# Entity: PostcodeAddress
# Description: Version must be positive — version zero is indistinguishable from an uninitialized postcode
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.version > 0
exit 0

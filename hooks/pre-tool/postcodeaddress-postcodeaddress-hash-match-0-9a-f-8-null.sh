#!/bin/bash
# Invariant: postcodeAddress.hash.match(/^[0-9a-f]{8}$/) !== null
# Entity: PostcodeAddress
# Description: hash must be lowercase hex — content-derived, not random
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.hash.match(/^[0-9a-f]{8}$/) !== null
exit 0

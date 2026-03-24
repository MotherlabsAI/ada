#!/bin/bash
# Invariant: postcodeAddress.hash !== null && postcodeAddress.hash.length > 0
# Entity: PostcodeAddress
# Description: Hash must be present — the postcode is the identity of a pipeline artifact and cannot be anonymous
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.hash !== null && postcodeAddress.hash.length > 0
exit 0

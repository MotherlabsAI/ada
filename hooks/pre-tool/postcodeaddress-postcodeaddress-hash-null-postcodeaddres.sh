#!/bin/bash
# Invariant: postcodeAddress.hash !== null && postcodeAddress.hash.length > 0
# Entity: PostcodeAddress
# Description: without a hash the postcode is not unique and collisions would corrupt provenance chain lookups
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.hash !== null && postcodeAddress.hash.length > 0
exit 0

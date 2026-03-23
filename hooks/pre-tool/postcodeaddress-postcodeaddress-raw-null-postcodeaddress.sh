#!/bin/bash
# Invariant: postcodeAddress.raw !== null && postcodeAddress.raw.startsWith('ML')
# Entity: PostcodeAddress
# Description: raw postcode string must start with the ML prefix
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.raw !== null && postcodeAddress.raw.startsWith('ML')
exit 0

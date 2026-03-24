#!/bin/bash
# Invariant: postcodeAddress.raw !== null && postcodeAddress.raw.length > 0
# Entity: PostcodeAddress
# Description: Raw string must be present — it is the canonical serialized form used for equality checks across stage boundaries
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.raw !== null && postcodeAddress.raw.length > 0
exit 0

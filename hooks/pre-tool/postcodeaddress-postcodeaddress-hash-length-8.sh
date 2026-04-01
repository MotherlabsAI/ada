#!/bin/bash
# Invariant: postcodeAddress.hash.length === 8
# Entity: PostcodeAddress
# Description: the hash field is exactly 8 hex characters — shorter or longer values indicate encoding errors
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.hash.length === 8
exit 0

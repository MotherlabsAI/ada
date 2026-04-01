#!/bin/bash
# Invariant: postcodeAddress.version >= 1
# Entity: PostcodeAddress
# Description: version starts at 1 on first assignment; 0 or negative is not a valid version
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.version >= 1
exit 0

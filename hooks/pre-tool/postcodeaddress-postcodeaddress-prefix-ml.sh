#!/bin/bash
# Invariant: postcodeAddress.prefix === 'ML'
# Entity: PostcodeAddress
# Description: all postcodes in this system are prefixed ML — any other prefix indicates a foreign or corrupted artifact
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.prefix === 'ML'
exit 0

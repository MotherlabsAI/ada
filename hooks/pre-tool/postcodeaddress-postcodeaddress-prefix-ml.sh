#!/bin/bash
# Invariant: postcodeAddress.prefix === 'ML'
# Entity: PostcodeAddress
# Description: all pipeline postcodes carry the ML prefix; a different prefix means the address was generated outside this pipeline and cannot be trusted
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.prefix === 'ML'
exit 0

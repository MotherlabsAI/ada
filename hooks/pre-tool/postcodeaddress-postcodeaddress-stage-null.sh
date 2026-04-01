#!/bin/bash
# Invariant: postcodeAddress.stage !== null
# Entity: PostcodeAddress
# Description: every postcode must identify which pipeline stage produced it
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.stage !== null
exit 0

#!/bin/bash
# Invariant: postcodeAddress.hash !== null
# Entity: PostcodeAddress
# Description: hash is derived from content, not generated randomly; a null hash means the artifact was never content-addressed
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.hash !== null
exit 0

#!/bin/bash
# Invariant: postcodeAddress.raw === `ML.${postcodeAddress.stage}.${postcodeAddress.hash}/v${postcodeAddress.version}`
# Entity: PostcodeAddress
# Description: raw string must be canonically derived from component fields to enable string-based lookups
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: postcodeAddress.raw === `ML.${postcodeAddress.stage}.${postcodeAddress.hash}/v${postcodeAddress.version}`
exit 0

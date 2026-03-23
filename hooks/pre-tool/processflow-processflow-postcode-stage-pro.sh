#!/bin/bash
# Invariant: processFlow.postcode.stage === 'PRO'
# Entity: ProcessFlow
# Description: process flow postcode must carry the PRO stage tag
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: processFlow.postcode.stage === 'PRO'
exit 0

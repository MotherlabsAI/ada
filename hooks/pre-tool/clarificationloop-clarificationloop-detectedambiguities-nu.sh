#!/bin/bash
# Invariant: clarificationLoop.detectedAmbiguities !== null && clarificationLoop.detectedAmbiguities.length > 0
# Entity: ClarificationLoop
# Description: clarification loop must have at least one detected ambiguity
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationLoop.detectedAmbiguities !== null && clarificationLoop.detectedAmbiguities.length > 0
exit 0

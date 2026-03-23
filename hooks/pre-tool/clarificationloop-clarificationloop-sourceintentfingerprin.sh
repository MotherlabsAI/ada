#!/bin/bash
# Invariant: clarificationLoop.sourceIntentFingerprint !== null
# Entity: ClarificationLoop
# Description: loop must reference the originating intent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: clarificationLoop.sourceIntentFingerprint !== null
exit 0

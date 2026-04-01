#!/bin/bash
# Invariant: session.finalConfidence >= 0 && session.finalConfidence <= 1
# Entity: Session
# Description: finalConfidence is a normalized score — values outside [0,1] are semantically invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: session.finalConfidence >= 0 && session.finalConfidence <= 1
exit 0

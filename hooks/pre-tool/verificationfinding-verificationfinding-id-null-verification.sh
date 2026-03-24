#!/bin/bash
# Invariant: verificationFinding.id !== null && verificationFinding.id.length > 0
# Entity: VerificationFinding
# Description: Finding must have identity — anonymous findings cannot be referenced in bounded context results
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationFinding.id !== null && verificationFinding.id.length > 0
exit 0

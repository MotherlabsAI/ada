#!/bin/bash
# Invariant: verificationFinding.title !== null && verificationFinding.title.length > 0
# Entity: VerificationFinding
# Description: Finding must be titled — untitled findings cannot appear in the vision document or audit trail
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationFinding.title !== null && verificationFinding.title.length > 0
exit 0

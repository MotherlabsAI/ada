#!/bin/bash
# Invariant: verificationFinding.confidence >= 0 && verificationFinding.confidence <= 1
# Entity: VerificationFinding
# Description: Confidence must be a valid proportion — unbounded confidence corrupts finding prioritization
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationFinding.confidence >= 0 && verificationFinding.confidence <= 1
exit 0

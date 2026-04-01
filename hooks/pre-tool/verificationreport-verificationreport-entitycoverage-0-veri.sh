#!/bin/bash
# Invariant: verificationReport.entityCoverage >= 0 && verificationReport.entityCoverage <= 1
# Entity: VerificationReport
# Description: entity coverage is a normalized ratio — values outside [0,1] indicate scoring errors
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.entityCoverage >= 0 && verificationReport.entityCoverage <= 1
exit 0

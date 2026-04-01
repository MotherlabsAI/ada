#!/bin/bash
# Invariant: verificationReport.invariantCoverage >= 0 && verificationReport.invariantCoverage <= 1
# Entity: VerificationReport
# Description: invariant coverage is a normalized ratio — values outside [0,1] indicate scoring errors
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.invariantCoverage >= 0 && verificationReport.invariantCoverage <= 1
exit 0

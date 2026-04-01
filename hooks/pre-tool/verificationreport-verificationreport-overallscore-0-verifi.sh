#!/bin/bash
# Invariant: verificationReport.overallScore >= 0 && verificationReport.overallScore <= 1
# Entity: VerificationReport
# Description: overallScore must be normalized
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.overallScore >= 0 && verificationReport.overallScore <= 1
exit 0

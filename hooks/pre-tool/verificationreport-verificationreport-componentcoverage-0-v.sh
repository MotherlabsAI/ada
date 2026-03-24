#!/bin/bash
# Invariant: verificationReport.componentCoverage >= 0 && verificationReport.componentCoverage <= 1
# Entity: VerificationReport
# Description: Component coverage must be in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.componentCoverage >= 0 && verificationReport.componentCoverage <= 1
exit 0

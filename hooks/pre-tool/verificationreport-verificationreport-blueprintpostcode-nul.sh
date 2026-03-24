#!/bin/bash
# Invariant: verificationReport.blueprintPostcode !== null && verificationReport.blueprintPostcode.length > 0
# Entity: VerificationReport
# Description: Report must reference the blueprint it verifies — without this the verification is untraceable
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.blueprintPostcode !== null && verificationReport.blueprintPostcode.length > 0
exit 0

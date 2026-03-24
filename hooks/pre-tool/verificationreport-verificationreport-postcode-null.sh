#!/bin/bash
# Invariant: verificationReport.postcode !== null
# Entity: VerificationReport
# Description: Report must carry its own postcode — it is a typed artifact in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.postcode !== null
exit 0

#!/bin/bash
# Invariant: verificationReport.postcode !== null
# Entity: VerificationReport
# Description: the report itself must be content-addressed — it participates in the provenance chain as a VER stage output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: verificationReport.postcode !== null
exit 0

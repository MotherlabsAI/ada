#!/bin/bash
# Invariant: auditReport.postcode !== null
# Entity: AuditReport
# Description: every audit report must be content-addressed — it participates in the provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.postcode !== null
exit 0

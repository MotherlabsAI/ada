#!/bin/bash
# Invariant: auditReport.postcode !== null
# Entity: AuditReport
# Description: AuditReport must carry a postcode — without it the report cannot be placed in provenance chain
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.postcode !== null
exit 0

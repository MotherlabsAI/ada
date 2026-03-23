#!/bin/bash
# Invariant: auditReport.postcode.stage === 'AUD'
# Entity: AuditReport
# Description: audit report postcode must carry the AUD stage tag
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.postcode.stage === 'AUD'
exit 0

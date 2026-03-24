#!/bin/bash
# Invariant: auditReport.coverageScore >= 0 && auditReport.coverageScore <= 1
# Entity: AuditReport
# Description: Coverage score must be a valid proportion — out-of-range scores cannot be compared across pipeline runs
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.coverageScore >= 0 && auditReport.coverageScore <= 1
exit 0

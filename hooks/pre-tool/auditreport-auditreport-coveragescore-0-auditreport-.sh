#!/bin/bash
# Invariant: auditReport.coverageScore >= 0 && auditReport.coverageScore <= 1
# Entity: AuditReport
# Description: coverage is a normalized score — values outside [0,1] are not valid VER outputs
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.coverageScore >= 0 && auditReport.coverageScore <= 1
exit 0

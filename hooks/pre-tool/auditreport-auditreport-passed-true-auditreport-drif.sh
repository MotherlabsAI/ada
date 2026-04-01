#!/bin/bash
# Invariant: auditReport.passed === true ? auditReport.drifts.filter(d => d.severity === 'critical').length === 0 : true
# Entity: AuditReport
# Description: a passed AuditReport must have zero critical drift findings
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.passed === true ? auditReport.drifts.filter(d => d.severity === 'critical').length === 0 : true
exit 0

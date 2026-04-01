#!/bin/bash
# Invariant: auditReport.passed === (auditReport.drifts.filter(d => d.severity === 'critical').length === 0)
# Entity: AuditReport
# Description: a report passes only when there are no critical drifts — critical drifts must block GOV ACCEPT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.passed === (auditReport.drifts.filter(d => d.severity === 'critical').length === 0)
exit 0

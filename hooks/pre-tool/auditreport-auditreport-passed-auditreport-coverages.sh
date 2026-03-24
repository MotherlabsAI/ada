#!/bin/bash
# Invariant: auditReport.passed === (auditReport.coverageScore >= 0 && auditReport.coherenceScore >= 0)
# Entity: AuditReport
# Description: Passed flag must be consistent with the scores — a mismatch means the audit stage produced a contradictory report
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.passed === (auditReport.coverageScore >= 0 && auditReport.coherenceScore >= 0)
exit 0

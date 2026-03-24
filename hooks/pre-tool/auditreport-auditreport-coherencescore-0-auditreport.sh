#!/bin/bash
# Invariant: auditReport.coherenceScore >= 0 && auditReport.coherenceScore <= 1
# Entity: AuditReport
# Description: Coherence score must be a valid proportion — incoherent scoring undermines governor decisions
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.coherenceScore >= 0 && auditReport.coherenceScore <= 1
exit 0

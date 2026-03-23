#!/bin/bash
# Invariant: auditReport.coherenceScore >= 0 && auditReport.coherenceScore <= 1
# Entity: AuditReport
# Description: coherence score must be a ratio in [0,1]
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: auditReport.coherenceScore >= 0 && auditReport.coherenceScore <= 1
exit 0

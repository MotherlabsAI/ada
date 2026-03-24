#!/bin/bash
# Invariant: handoffRecord.assessmentId !== null
# Entity: HandoffRecord
# Description: Handoff must reference the CompilationReadinessAssessment that authorized it — without this, there is no structural evidence the termination condition was satisfied
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: handoffRecord.assessmentId !== null
exit 0

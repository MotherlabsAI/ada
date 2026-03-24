#!/bin/bash
# Invariant: compilationReadinessAssessment.assessmentId !== null && compilationReadinessAssessment.assessmentId.length > 0
# Entity: CompilationReadinessAssessment
# Description: Assessment must have a unique identifier — without this, the HandoffRecord cannot reference which readiness check authorized the handoff
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.assessmentId !== null && compilationReadinessAssessment.assessmentId.length > 0
exit 0

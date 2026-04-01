#!/bin/bash
# Invariant: compilationReadinessAssessment.assessedAt > 0
# Entity: CompilationReadinessAssessment
# Description: assessments must be timestamped — undated assessments cannot be ordered relative to turns
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.assessedAt > 0
exit 0

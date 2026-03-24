#!/bin/bash
# Invariant: compilationReadinessAssessment.blockingGapCount >= 0 && compilationReadinessAssessment.blockingGapCount <= compilationReadinessAssessment.openGapCount
# Entity: CompilationReadinessAssessment
# Description: Blocking gaps cannot exceed open gaps — a superset violation indicates corrupt gap tracking
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.blockingGapCount >= 0 && compilationReadinessAssessment.blockingGapCount <= compilationReadinessAssessment.openGapCount
exit 0

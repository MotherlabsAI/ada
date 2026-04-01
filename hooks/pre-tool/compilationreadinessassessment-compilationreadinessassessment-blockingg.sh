#!/bin/bash
# Invariant: compilationReadinessAssessment.blockingGapCount >= 0
# Entity: CompilationReadinessAssessment
# Description: blockingGapCount must be non-negative
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.blockingGapCount >= 0
exit 0

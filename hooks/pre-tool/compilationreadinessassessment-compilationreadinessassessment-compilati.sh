#!/bin/bash
# Invariant: compilationReadinessAssessment.compilationReady === (compilationReadinessAssessment.blockingGapCount === 0)
# Entity: CompilationReadinessAssessment
# Description: compilation readiness is true if and only if there are zero blocking gaps — this is the invariant that gates handoff
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.compilationReady === (compilationReadinessAssessment.blockingGapCount === 0)
exit 0

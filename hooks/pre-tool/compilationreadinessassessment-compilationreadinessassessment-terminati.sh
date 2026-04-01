#!/bin/bash
# Invariant: compilationReadinessAssessment.terminationSignalEmitted === false || compilationReadinessAssessment.compilationReady === true
# Entity: CompilationReadinessAssessment
# Description: a termination signal may only be emitted when compilation is ready — premature termination is an elicitation failure
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.terminationSignalEmitted === false || compilationReadinessAssessment.compilationReady === true
exit 0

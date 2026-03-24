#!/bin/bash
# Invariant: !(compilationReadinessAssessment.terminationSignalEmitted === true) || compilationReadinessAssessment.compilationReady === true
# Entity: CompilationReadinessAssessment
# Description: Termination signal must not be emitted unless compilationReady is true — without this, incomplete IntentGraphs are handed off
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(compilationReadinessAssessment.terminationSignalEmitted === true) || compilationReadinessAssessment.compilationReady === true
exit 0

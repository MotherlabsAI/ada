#!/bin/bash
# Invariant: compilationReadinessAssessment.schemaConformanceResultId !== null
# Entity: CompilationReadinessAssessment
# Description: Assessment must reference a SchemaConformanceResult — without this, compilationReady cannot be correctly derived
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationReadinessAssessment.schemaConformanceResultId !== null
exit 0

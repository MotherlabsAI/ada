#!/bin/bash
# Invariant: schemaConformanceResult.resultId !== null && schemaConformanceResult.resultId.length > 0
# Entity: SchemaConformanceResult
# Description: Conformance result must have identity — anonymous results cannot be referenced by readiness assessments
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: schemaConformanceResult.resultId !== null && schemaConformanceResult.resultId.length > 0
exit 0

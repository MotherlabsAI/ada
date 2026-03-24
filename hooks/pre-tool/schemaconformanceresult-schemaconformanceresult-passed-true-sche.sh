#!/bin/bash
# Invariant: !(schemaConformanceResult.passed === true) || (schemaConformanceResult.failedPredicates.length === 0 && schemaConformanceResult.missingRequiredFields.length === 0)
# Entity: SchemaConformanceResult
# Description: A passing conformance result must have zero failed predicates and zero missing fields — without this, the passed flag is structurally inconsistent
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: !(schemaConformanceResult.passed === true) || (schemaConformanceResult.failedPredicates.length === 0 && schemaConformanceResult.missingRequiredFields.length === 0)
exit 0

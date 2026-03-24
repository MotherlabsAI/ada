#!/bin/bash
# Invariant: schemaConformanceResult.failedPredicates !== null
# Entity: SchemaConformanceResult
# Description: Failed predicates array must always exist (may be empty) — without this, Gap detection cannot identify which fields need elicitation
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: schemaConformanceResult.failedPredicates !== null
exit 0

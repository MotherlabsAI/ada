#!/bin/bash
# Invariant: schemaConformanceResult.draftId !== null
# Entity: SchemaConformanceResult
# Description: Result must be bound to a specific draft — without this, conformance results cannot be attributed to the correct working state
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: schemaConformanceResult.draftId !== null
exit 0

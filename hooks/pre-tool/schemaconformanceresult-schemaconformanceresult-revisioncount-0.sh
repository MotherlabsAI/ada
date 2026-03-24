#!/bin/bash
# Invariant: schemaConformanceResult.revisionCount >= 0
# Entity: SchemaConformanceResult
# Description: Revision count must be non-negative — negative revision counts are structurally invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: schemaConformanceResult.revisionCount >= 0
exit 0

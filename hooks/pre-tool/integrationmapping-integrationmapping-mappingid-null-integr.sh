#!/bin/bash
# Invariant: integrationMapping.mappingId !== null && integrationMapping.mappingId.length > 0
# Entity: IntegrationMapping
# Description: mapping must have a non-empty identifier
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: integrationMapping.mappingId !== null && integrationMapping.mappingId.length > 0
exit 0

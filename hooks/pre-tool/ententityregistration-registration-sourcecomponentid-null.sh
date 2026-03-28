#!/bin/bash
# Invariant: registration.sourceComponentId !== null
# Entity: ENTEntityRegistration
# Description: every registration must name its source component or provenance is broken
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: registration.sourceComponentId !== null
exit 0

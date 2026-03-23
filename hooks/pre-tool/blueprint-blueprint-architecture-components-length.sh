#!/bin/bash
# Invariant: blueprint.architecture.components.length > 0
# Entity: Blueprint
# Description: blueprint architecture must define at least one component
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.architecture.components.length > 0
exit 0

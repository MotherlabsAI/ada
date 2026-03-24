#!/bin/bash
# Invariant: blueprint.dataModel !== null
# Entity: Blueprint
# Description: Data model must be present — a blueprint without a data model is not a complete compilation output
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.dataModel !== null
exit 0

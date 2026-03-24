#!/bin/bash
# Invariant: blueprint.processModel !== null
# Entity: Blueprint
# Description: Process model must be present — a blueprint without a process model cannot be verified for behavioral completeness
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: blueprint.processModel !== null
exit 0

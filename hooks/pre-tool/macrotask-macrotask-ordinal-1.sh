#!/bin/bash
# Invariant: macroTask.ordinal >= 1
# Entity: MacroTask
# Description: ordinal must be a positive integer representing position in the dependency-ordered execution sequence
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroTask.ordinal >= 1
exit 0

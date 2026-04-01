#!/bin/bash
# Invariant: macroTask.boundedContext !== null && macroTask.boundedContext.length > 0
# Entity: MacroTask
# Description: boundedContext must be non-null to scope agent authority for this task
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroTask.boundedContext !== null && macroTask.boundedContext.length > 0
exit 0

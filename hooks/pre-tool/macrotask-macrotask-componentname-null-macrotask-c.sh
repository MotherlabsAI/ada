#!/bin/bash
# Invariant: macroTask.componentName !== null && macroTask.componentName.length > 0
# Entity: MacroTask
# Description: componentName must be non-null to map the task to a Blueprint component
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroTask.componentName !== null && macroTask.componentName.length > 0
exit 0

#!/bin/bash
# Invariant: macroTask.agentFile !== null && macroTask.agentFile.length > 0
# Entity: MacroTask
# Description: agentFile must be non-null so the macro planner knows which agent to delegate to
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroTask.agentFile !== null && macroTask.agentFile.length > 0
exit 0

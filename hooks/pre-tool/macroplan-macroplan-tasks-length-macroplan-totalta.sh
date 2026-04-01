#!/bin/bash
# Invariant: macroPlan.tasks.length === macroPlan.totalTasks
# Entity: MacroPlan
# Description: the tasks array length must match totalTasks for consistency
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroPlan.tasks.length === macroPlan.totalTasks
exit 0

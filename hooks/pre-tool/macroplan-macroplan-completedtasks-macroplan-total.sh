#!/bin/bash
# Invariant: macroPlan.completedTasks <= macroPlan.totalTasks
# Entity: MacroPlan
# Description: completed task count cannot exceed total task count — this would indicate state corruption
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroPlan.completedTasks <= macroPlan.totalTasks
exit 0

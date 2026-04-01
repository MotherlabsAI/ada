#!/bin/bash
# Invariant: macroPlan.tasks.every(t => t.blockedBy.every(dep => macroPlan.tasks.some(u => u.componentName === dep)))
# Entity: MacroPlan
# Description: every dependency named in blockedBy must reference an actual task in the plan — dangling dependencies would stall execution
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: macroPlan.tasks.every(t => t.blockedBy.every(dep => macroPlan.tasks.some(u => u.componentName === dep)))
exit 0

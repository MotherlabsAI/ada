#!/bin/bash
# Invariant: /* task order respects component dependency graph — no task starts before its blockedBy tasks complete */macroPlan.tasks.every(t => t.blockedBy.every(dep => macroPlan.tasks.find(u => u.componentName === dep)?.status === 'complete' || t.status === 'pending'))
# Entity: MacroPlan
# Description: dependency order must be respected — a task executing before its dependencies complete violates the blueprint's architecture
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: /* task order respects component dependency graph — no task starts before its blockedBy tasks complete */macroPlan.tasks.every(t => t.blockedBy.every(dep => macroPlan.tasks.find(u => u.componentName === dep)?.status === 'complete' || t.status === 'pending'))
exit 0

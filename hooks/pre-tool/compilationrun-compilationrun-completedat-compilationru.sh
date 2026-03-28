#!/bin/bash
# Invariant: compilationRun.completedAt >= compilationRun.startedAt
# Entity: CompilationRun
# Description: completion cannot precede start; violation indicates a corrupt timing record
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.completedAt >= compilationRun.startedAt
exit 0

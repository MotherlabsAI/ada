#!/bin/bash
# Invariant: compilationRun.completedAt >= compilationRun.startedAt
# Entity: CompilationRun
# Description: Completion must not precede start — temporal inversion corrupts duration metrics and audit ordering
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.completedAt >= compilationRun.startedAt
exit 0

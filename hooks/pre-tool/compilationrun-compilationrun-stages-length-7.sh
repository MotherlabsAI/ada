#!/bin/bash
# Invariant: compilationRun.stages.length <= 7
# Entity: CompilationRun
# Description: a run may record at most 7 stage executions
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.stages.length <= 7
exit 0

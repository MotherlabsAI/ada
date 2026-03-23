#!/bin/bash
# Invariant: compilationRun.startedAt !== null
# Entity: CompilationRun
# Description: run start time must be recorded
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.startedAt !== null
exit 0

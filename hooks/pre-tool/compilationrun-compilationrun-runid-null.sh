#!/bin/bash
# Invariant: compilationRun.runId !== null
# Entity: CompilationRun
# Description: run must be identified
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.runId !== null
exit 0

#!/bin/bash
# Invariant: compilationRun.startedAt > 0
# Entity: CompilationRun
# Description: a run without a start timestamp cannot have its duration computed; totalDurationMs would be meaningless for G10 diagnostics
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.startedAt > 0
exit 0

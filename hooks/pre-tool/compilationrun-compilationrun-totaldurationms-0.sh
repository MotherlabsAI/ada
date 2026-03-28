#!/bin/bash
# Invariant: compilationRun.totalDurationMs >= 0
# Entity: CompilationRun
# Description: negative duration is physically impossible and signals corrupt telemetry
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.totalDurationMs >= 0
exit 0

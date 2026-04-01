#!/bin/bash
# Invariant: compilationRun.stages.length === 9
# Entity: CompilationRun
# Description: all 9 pipeline stages must complete before a decision is emitted
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.stages.length === 9
exit 0

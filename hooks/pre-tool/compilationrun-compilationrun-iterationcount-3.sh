#!/bin/bash
# Invariant: compilationRun.iterationCount <= 3
# Entity: CompilationRun
# Description: GOV ITERATE loop is capped at 3 iterations; a 4th would be a terminal REJECT
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.iterationCount <= 3
exit 0

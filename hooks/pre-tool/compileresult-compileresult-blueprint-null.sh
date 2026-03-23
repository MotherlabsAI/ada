#!/bin/bash
# Invariant: compileResult.blueprint !== null
# Entity: CompileResult
# Description: compile result must always carry a blueprint — even a rejected run holds the last blueprint for inspection
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compileResult.blueprint !== null
exit 0

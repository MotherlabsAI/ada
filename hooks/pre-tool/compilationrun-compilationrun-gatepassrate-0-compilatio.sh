#!/bin/bash
# Invariant: compilationRun.gatePassRate >= 0 && compilationRun.gatePassRate <= 1
# Entity: CompilationRun
# Description: gatePassRate must be a valid normalized score
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.gatePassRate >= 0 && compilationRun.gatePassRate <= 1
exit 0

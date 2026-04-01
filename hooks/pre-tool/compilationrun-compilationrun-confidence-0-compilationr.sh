#!/bin/bash
# Invariant: compilationRun.confidence >= 0 && compilationRun.confidence <= 1
# Entity: CompilationRun
# Description: confidence is a normalized score; values outside [0,1] are semantically invalid
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.confidence >= 0 && compilationRun.confidence <= 1
exit 0

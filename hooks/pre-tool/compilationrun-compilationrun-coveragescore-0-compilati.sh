#!/bin/bash
# Invariant: compilationRun.coverageScore >= 0 && compilationRun.coverageScore <= 1
# Entity: CompilationRun
# Description: coverageScore must be a valid normalized score
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.coverageScore >= 0 && compilationRun.coverageScore <= 1
exit 0

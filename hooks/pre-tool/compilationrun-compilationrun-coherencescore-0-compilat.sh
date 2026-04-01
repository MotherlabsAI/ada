#!/bin/bash
# Invariant: compilationRun.coherenceScore >= 0 && compilationRun.coherenceScore <= 1
# Entity: CompilationRun
# Description: coherenceScore must be a valid normalized score
INPUT=$(cat)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // .tool_input.command // ""')
# Structural enforcement not possible for this predicate.
# Manual review required: compilationRun.coherenceScore >= 0 && compilationRun.coherenceScore <= 1
exit 0
